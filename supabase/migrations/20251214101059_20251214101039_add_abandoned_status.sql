/*
  # Add Abandoned Status for Match Lifecycle

  ## Changes

  1. Status Values (Enhanced)
     - Existing: `draft`, `live`, `completed`, `deleted`
     - New: `abandoned` - Match started but user cancelled/discarded it

  2. Purpose
     - Allow users to discard matches they don't want to continue
     - Prevent abandoned matches from showing resume prompts
     - Ensure abandoned matches never appear in stats or match lists

  3. Resume Logic Requirements
     - Show resume prompt ONLY for:
       * status = 'live' OR
       * (status = 'draft' AND has_activity = true AND legal_balls > 0)
     - NEVER show resume prompt for:
       * status = 'abandoned'
       * status = 'deleted'
       * deleted_at IS NOT NULL

  4. Stats Safety
     - Only matches with status='completed' AND legal_balls > 0 count toward stats
     - Abandoned, deleted, and draft matches are excluded
*/

-- Update the constraint to allow 'abandoned' status
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'matches_deleted_consistency'
  ) THEN
    ALTER TABLE matches DROP CONSTRAINT matches_deleted_consistency;
  END IF;

  -- Add updated constraint that handles deleted and abandoned statuses
  ALTER TABLE matches
  ADD CONSTRAINT matches_deleted_consistency
  CHECK (
    (status = 'deleted' AND deleted_at IS NOT NULL) OR
    (status != 'deleted')
  );
END $$;

-- Add index for filtering out abandoned matches from match lists
CREATE INDEX IF NOT EXISTS idx_matches_active_status
ON matches(user_id, status, created_at DESC)
WHERE status IN ('draft', 'live', 'completed') AND deleted_at IS NULL;

-- Add index for resume logic (live or active drafts)
CREATE INDEX IF NOT EXISTS idx_matches_resumable
ON matches(user_id, status, has_activity, legal_balls)
WHERE (status = 'live' OR (status = 'draft' AND has_activity = true)) AND deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN matches.status IS 'Match lifecycle: draft, live, completed, abandoned, deleted';
