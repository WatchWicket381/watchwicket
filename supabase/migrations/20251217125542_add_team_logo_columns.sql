/*
  # Add team logo support to matches table

  1. Changes
    - Add `team_a_logo_url` (text, nullable) - Stores Team A logo as base64 or URL
    - Add `team_b_logo_url` (text, nullable) - Stores Team B logo as base64 or URL

  2. Notes
    - Logos are optional fields
    - Can store base64-encoded images or external URLs
    - Existing matches will have NULL logos (no logo set)
    - Logos locked when match status is "completed"
*/

-- Add team logo columns to matches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'team_a_logo_url'
  ) THEN
    ALTER TABLE matches ADD COLUMN team_a_logo_url text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'team_b_logo_url'
  ) THEN
    ALTER TABLE matches ADD COLUMN team_b_logo_url text DEFAULT NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN matches.team_a_logo_url IS 'Team A logo stored as base64 data URI or external URL';
COMMENT ON COLUMN matches.team_b_logo_url IS 'Team B logo stored as base64 data URI or external URL';
