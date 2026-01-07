/*
  # Fix Security Issues

  1. Drop Unused Indexes
    - Remove indexes that are not being utilized
    - Reduces database overhead and maintenance cost
    - Improves write performance

  2. Fix Function Search Path Security
    - Set immutable search_path for trigger function
    - Prevents search_path manipulation attacks
    - Ensures function always uses correct schema

  3. Changes
    - Drop 12 unused indexes
    - Recreate trigger function with secure search_path
*/

-- Drop unused indexes to improve performance and reduce overhead
DROP INDEX IF EXISTS idx_matches_completed;
DROP INDEX IF EXISTS idx_matches_active_status;
DROP INDEX IF EXISTS idx_matches_resumable;
DROP INDEX IF EXISTS idx_league_fixtures_league_id;
DROP INDEX IF EXISTS idx_leagues_user_id;
DROP INDEX IF EXISTS idx_matches_fixture_id;
DROP INDEX IF EXISTS idx_matches_league_id;
DROP INDEX IF EXISTS idx_player_profiles_linked_user_id;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_matches_deleted_at;
DROP INDEX IF EXISTS idx_matches_completed_stats;
DROP INDEX IF EXISTS idx_matches_activity_status;

-- Recreate the trigger function with secure search_path
CREATE OR REPLACE FUNCTION prevent_completed_match_updates()
RETURNS TRIGGER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Allow insert operations
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Block updates if OLD status is completed or completed_at is set
  IF OLD.status = 'completed' OR OLD.completed_at IS NOT NULL THEN
    -- Allow only specific safe operations (like visibility toggles)
    IF NEW.allow_player_stats_view != OLD.allow_player_stats_view OR
       NEW.allow_team_scorecard_view != OLD.allow_team_scorecard_view THEN
      -- Allow visibility changes only
      NEW.status = OLD.status;
      NEW.completed_at = OLD.completed_at;
      NEW.match_data = OLD.match_data;
      NEW.team_a_name = OLD.team_a_name;
      NEW.team_b_name = OLD.team_b_name;
      NEW.legal_balls = OLD.legal_balls;
      NEW.has_activity = OLD.has_activity;
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Cannot modify completed match. Match is immutable once completed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function comment
COMMENT ON FUNCTION prevent_completed_match_updates() IS 'Prevents modifications to completed matches with secure search_path to ensure data integrity';

-- Add helpful indexes based on actual query patterns
-- Index for listing user matches ordered by updated_at
CREATE INDEX IF NOT EXISTS idx_matches_user_updated 
  ON matches(user_id, updated_at DESC) 
  WHERE deleted_at IS NULL;

-- Index for finding completed matches for stats
CREATE INDEX IF NOT EXISTS idx_matches_user_completed 
  ON matches(user_id, status, completed_at DESC) 
  WHERE status = 'completed' AND deleted_at IS NULL;

-- Index for league-related queries
CREATE INDEX IF NOT EXISTS idx_matches_league_fixture 
  ON matches(league_id, fixture_id) 
  WHERE league_id IS NOT NULL;
