/*
  # Add Performance Indexes for Matches Table

  1. Purpose
    - Optimize My Matches list query performance
    - Speed up user-specific match lookups
    - Improve sorting by timestamp fields

  2. New Indexes
    - matches(user_id, updated_at DESC) - Primary list query
    - matches(user_id, status) - Filter by status
    - matches(user_id, created_at DESC) - Alternative sort
    - matches(status) - Global status filters

  3. Performance Impact
    - My Matches query: ~10-100x faster with large datasets
    - Enables efficient pagination
    - Reduces table scans for filtered queries

  4. Notes
    - Indexes are created IF NOT EXISTS to be idempotent
    - DESC indexes optimize ORDER BY DESC queries
*/

-- Primary index for My Matches list (user_id + updated_at DESC)
CREATE INDEX IF NOT EXISTS idx_matches_user_updated 
  ON matches(user_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Index for filtering by status per user
CREATE INDEX IF NOT EXISTS idx_matches_user_status
  ON matches(user_id, status)
  WHERE deleted_at IS NULL;

-- Alternative index for creation date sorting
CREATE INDEX IF NOT EXISTS idx_matches_user_created
  ON matches(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for completed_at queries (stats, etc)
CREATE INDEX IF NOT EXISTS idx_matches_user_completed
  ON matches(user_id, completed_at DESC)
  WHERE deleted_at IS NULL AND completed_at IS NOT NULL;

-- Index for global status lookups (admin, analytics)
CREATE INDEX IF NOT EXISTS idx_matches_status
  ON matches(status)
  WHERE deleted_at IS NULL;

-- Add comment
COMMENT ON INDEX idx_matches_user_updated IS 
  'Optimizes My Matches list query ordered by updated_at';
COMMENT ON INDEX idx_matches_user_status IS 
  'Optimizes status-filtered match queries per user';
COMMENT ON INDEX idx_matches_user_created IS 
  'Optimizes match list ordered by creation date';
COMMENT ON INDEX idx_matches_user_completed IS 
  'Optimizes completed match queries for stats';
COMMENT ON INDEX idx_matches_status IS 
  'Optimizes global status filters';