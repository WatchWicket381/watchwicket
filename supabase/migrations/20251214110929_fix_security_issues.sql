/*
  # Fix Security Issues

  1. Purpose
    - Remove unused indexes to reduce maintenance overhead
    - Fix function search_path security issue

  2. Changes
    - Drop 12 unused indexes identified by security scan
    - Set immutable search_path on trigger function

  3. Security Improvements
    - Reduced attack surface by removing unused indexes
    - Protected trigger function from search_path attacks

  4. Notes
    - Indexes can be recreated if needed based on query patterns
    - Function search_path now secure and immutable
*/

-- Drop unused indexes
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

-- Fix function search_path security issue
-- Recreate function with SECURITY DEFINER and immutable search_path
CREATE OR REPLACE FUNCTION prevent_completed_match_updates()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
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
$$;

-- Add comment
COMMENT ON FUNCTION prevent_completed_match_updates() IS 'Prevents modifications to completed matches. SECURITY DEFINER with immutable search_path.';
