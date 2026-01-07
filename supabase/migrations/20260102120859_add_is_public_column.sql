/*
  # Add is_public Column and Public Access Policies

  ## Changes

  1. New Column
     - `is_public` (boolean, default false) - Whether the match is publicly viewable

  2. New RLS Policies
     - Allow anonymous users to read public matches where is_public=true
     - Maintain existing ownership-based read/write policies for authenticated users

  3. Purpose
     - Enable public viewing of live matches without authentication
     - Support the public homepage /live matches feature
     - Preserve privacy by default (is_public=false)

  ## Security
     - Only match owners can set is_public=true
     - Anonymous users can ONLY read (SELECT), never write
     - Public matches are filtered: is_public=true AND deleted_at IS NULL
*/

-- Add is_public column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE matches ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for public match queries
CREATE INDEX IF NOT EXISTS idx_matches_public_status
  ON matches(is_public, status, updated_at DESC)
  WHERE is_public = true AND deleted_at IS NULL;

-- Drop existing anonymous read policy if it exists
DROP POLICY IF EXISTS "Anonymous users can view public matches" ON matches;

-- Create policy for anonymous users to read public matches
CREATE POLICY "Anonymous users can view public matches"
  ON matches
  FOR SELECT
  TO anon
  USING (is_public = true AND deleted_at IS NULL);

-- Add comment
COMMENT ON COLUMN matches.is_public IS 'Whether this match is publicly viewable (default: false, owner-only)';