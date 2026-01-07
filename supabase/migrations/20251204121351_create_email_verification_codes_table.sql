/*
  # Email Verification Codes for OTP Sign-Up Flow

  1. New Tables
    - `email_verification_codes`
      - `id` (uuid, primary key)
      - `email` (text, email address being verified)
      - `code_hash` (text, hashed OTP code)
      - `expires_at` (timestamptz, expiration time - 10 minutes from creation)
      - `attempts` (integer, number of failed verification attempts)
      - `used` (boolean, whether code has been used)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on email_verification_codes
    - Codes expire after 10 minutes
    - Maximum 5 verification attempts
    - Codes are hashed, never stored in plain text
    - Auto-cleanup of expired codes
    
  3. Indexes
    - Index on email for fast lookups
    - Index on expires_at for cleanup queries

  4. Important Notes
    - OTP codes are 6-digit numbers (100000-999999)
    - Codes are hashed using SHA-256 before storage
    - Rate limiting prevents abuse
    - Used codes cannot be reused
*/

-- Create email_verification_codes table
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  attempts integer DEFAULT 0,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - These codes are managed by the system, not directly by users
-- We'll use Edge Functions to manage OTP codes securely

CREATE POLICY "Service role can manage verification codes"
  ON email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invalidate old codes when creating a new one
CREATE OR REPLACE FUNCTION invalidate_old_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark all previous codes for this email as used
  UPDATE email_verification_codes
  SET used = true
  WHERE email = NEW.email
    AND id != NEW.id
    AND used = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-invalidate old codes
DROP TRIGGER IF EXISTS trigger_invalidate_old_codes ON email_verification_codes;
CREATE TRIGGER trigger_invalidate_old_codes
  AFTER INSERT ON email_verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_old_verification_codes();

-- Helper function to check if code is valid (not expired, not used, attempts < max)
CREATE OR REPLACE FUNCTION is_verification_code_valid(
  p_email text,
  p_code_hash text
)
RETURNS boolean AS $$
DECLARE
  v_code_record RECORD;
BEGIN
  -- Find the most recent code for this email
  SELECT * INTO v_code_record
  FROM email_verification_codes
  WHERE email = p_email
    AND code_hash = p_code_hash
    AND expires_at > now()
    AND used = false
    AND attempts < 5
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_code_record IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
