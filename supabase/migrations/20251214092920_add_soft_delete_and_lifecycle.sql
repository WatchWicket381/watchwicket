/*
  # Add Soft Delete and Match Lifecycle Support

  ## Changes

  1. New Columns
     - `deleted_at` (timestamptz, nullable) - When the match was soft-deleted
     - `legal_balls` (integer, default 0) - Count of legal balls bowled in the match
     - `completed_at` (timestamptz, nullable) - When the match was marked as completed

  2. Status Values (Updated)
     - `draft` - Match created but not started
     - `live` - First legal ball bowled (was "In Progress")
     - `completed` - Match ended and saved (was "Completed")
     - `deleted` - Soft-deleted by user

  3. Purpose
     - Enable soft delete (set deleted_at + status='deleted' instead of hard delete)
     - Track match lifecycle properly (draft -> live -> completed)
     - Ensure only completed, non-deleted matches with legal_balls > 0 count toward stats
     - Allow recovery of accidentally deleted matches

  4. Migration Strategy
     - Add new columns safely with IF NOT EXISTS checks
     - Update existing data to match new status values
     - Backfill legal_balls from match_data where possible
     - Add indexes for efficient filtering

  5. Important Notes
     - Stats queries MUST filter: status='completed' AND deleted_at IS NULL AND legal_balls > 0
     - Match list queries MUST filter: deleted_at IS NULL
     - Soft delete preserves data for potential recovery
*/

-- Add deleted_at column for soft delete tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE matches ADD COLUMN deleted_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Add legal_balls column to track actual gameplay
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'legal_balls'
  ) THEN
    ALTER TABLE matches ADD COLUMN legal_balls INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add completed_at column to track when match was completed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE matches ADD COLUMN completed_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Migrate existing status values to new lifecycle model
UPDATE matches
SET status = 'draft'
WHERE status = 'Upcoming';

UPDATE matches
SET status = 'live'
WHERE status = 'In Progress';

UPDATE matches
SET status = 'completed'
WHERE status = 'Completed';

-- Backfill completed_at for existing completed matches
UPDATE matches
SET completed_at = updated_at
WHERE status = 'completed'
  AND completed_at IS NULL;

-- Backfill legal_balls from match_data for existing matches
UPDATE matches
SET legal_balls = (
  SELECT COALESCE(
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(match_data->'innings') AS inning,
           jsonb_array_elements(inning->'deliveries') AS delivery
      WHERE (delivery->>'isLegal')::boolean = true
    ),
    0
  )
)
WHERE legal_balls = 0 OR legal_balls IS NULL;

-- Set has_activity to true for matches with legal_balls > 0
UPDATE matches
SET has_activity = true
WHERE legal_balls > 0 AND (has_activity IS NULL OR has_activity = false);

-- Add indexes for efficient filtering of deleted and completed matches
CREATE INDEX IF NOT EXISTS idx_matches_deleted_at
ON matches(user_id, deleted_at)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_matches_completed_stats
ON matches(user_id, status, legal_balls)
WHERE status = 'completed' AND deleted_at IS NULL AND legal_balls > 0;

-- Add check constraint to ensure deleted matches have deleted_at set
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_deleted_consistency'
  ) THEN
    ALTER TABLE matches
    ADD CONSTRAINT matches_deleted_consistency
    CHECK (
      (status = 'deleted' AND deleted_at IS NOT NULL) OR
      (status != 'deleted')
    );
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN matches.deleted_at IS 'Timestamp when match was soft-deleted (NULL = not deleted)';
COMMENT ON COLUMN matches.legal_balls IS 'Count of legal balls bowled in this match';
COMMENT ON COLUMN matches.completed_at IS 'Timestamp when match was marked as completed';
COMMENT ON COLUMN matches.status IS 'Match lifecycle: draft, live, completed, deleted';
