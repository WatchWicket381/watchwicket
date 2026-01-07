/*
  # Fix Match Status Default Value

  1. Purpose
    - Update default status from 'Upcoming' to 'draft' for consistency
    - Align database default with application MatchStatus type

  2. Changes
    - Alter matches table status column default value
    - Change from 'Upcoming' to 'draft'

  3. Migration Safety
    - Non-destructive change
    - Only affects new records
    - Existing data preserved
*/

-- Update the default value for status column
ALTER TABLE matches
  ALTER COLUMN status SET DEFAULT 'draft';

-- Add comment for documentation
COMMENT ON COLUMN matches.status IS 'Match lifecycle status: draft (not started), live (in progress), completed (finished), abandoned (cancelled), deleted (soft-deleted)';
