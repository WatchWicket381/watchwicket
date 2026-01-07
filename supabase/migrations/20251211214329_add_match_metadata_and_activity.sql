/*
  # Add Match Metadata and Activity Tracking

  ## Changes

  1. New Columns
     - `match_location` (text, optional) - Where the match was played
     - `match_date` (date, optional) - Date when the match was played
     - `match_time` (time, optional) - Time when the match started
     - `has_activity` (boolean, default false) - Whether any balls have been bowled

  2. Purpose
     - Track match location, date, and time for completed matches
     - Ensure stats only count matches with actual gameplay activity
     - Prevent incomplete/abandoned matches from affecting statistics

  3. Notes
     - `has_activity` is set to true when the first delivery is recorded
     - These fields are static after match completion
     - Only matches with `has_activity = true` AND `status = 'Completed'` count toward stats
*/

-- Add match metadata columns
DO $$
BEGIN
  -- Add match location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'match_location'
  ) THEN
    ALTER TABLE matches ADD COLUMN match_location TEXT;
  END IF;

  -- Add match date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'match_date'
  ) THEN
    ALTER TABLE matches ADD COLUMN match_date DATE;
  END IF;

  -- Add match time
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'match_time'
  ) THEN
    ALTER TABLE matches ADD COLUMN match_time TIME;
  END IF;

  -- Add has_activity flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'has_activity'
  ) THEN
    ALTER TABLE matches ADD COLUMN has_activity BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Update existing completed matches to have activity
UPDATE matches
SET has_activity = true
WHERE status = 'Completed'
  AND has_activity IS NULL;

-- Add index for filtering by activity and status (for stats queries)
CREATE INDEX IF NOT EXISTS idx_matches_activity_status
ON matches(user_id, has_activity, status)
WHERE has_activity = true AND status = 'Completed';

-- Add comment for documentation
COMMENT ON COLUMN matches.has_activity IS 'Indicates if any deliveries have been recorded in this match';
COMMENT ON COLUMN matches.match_location IS 'Location where the match was played';
COMMENT ON COLUMN matches.match_date IS 'Date when the match was played';
COMMENT ON COLUMN matches.match_time IS 'Time when the match started';
