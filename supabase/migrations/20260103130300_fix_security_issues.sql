/*
  # Fix Security and Performance Issues

  ## Changes Made
  
  ### 1. Add Missing Foreign Key Indexes
  - Add index on league_fixtures(league_id)
  - Add index on leagues(user_id)
  - Add index on matches(fixture_id)
  - Add index on player_profiles(linked_user_id)
  - Add index on subscriptions(user_id)
  
  ### 2. Optimize RLS Policies
  - Update matches table RLS policies to use (select auth.uid()) instead of auth.uid()
  - This prevents re-evaluation of auth function for each row
  
  ### 3. Remove Unused Indexes
  - Drop idx_matches_user_updated
  - Drop idx_matches_user_completed
  - Drop idx_matches_user_created
  - Drop idx_matches_public_id
  
  ### 4. Fix Function Security
  - Set search_path on prevent_completed_match_updates function
  
  ## Security Notes
  - Foreign key indexes improve query performance and prevent slow queries
  - RLS optimization reduces database load at scale
  - Unused indexes waste storage and slow down writes
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_league_fixtures_league_id 
  ON league_fixtures(league_id);

CREATE INDEX IF NOT EXISTS idx_leagues_user_id 
  ON leagues(user_id);

CREATE INDEX IF NOT EXISTS idx_matches_fixture_id 
  ON matches(fixture_id);

CREATE INDEX IF NOT EXISTS idx_player_profiles_linked_user_id 
  ON player_profiles(linked_user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
  ON subscriptions(user_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES ON MATCHES TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anonymous users can view public matches" ON matches;
DROP POLICY IF EXISTS "Authenticated users can view own or public matches" ON matches;
DROP POLICY IF EXISTS "Users can insert own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches including soft delete" ON matches;
DROP POLICY IF EXISTS "Users can delete own draft or scheduled matches" ON matches;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Anonymous users can view public matches"
  ON matches
  FOR SELECT
  TO anon
  USING (
    is_public = true AND deleted_at IS NULL
  );

CREATE POLICY "Authenticated users can view own or public matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id OR 
    (is_public = true AND deleted_at IS NULL)
  );

CREATE POLICY "Users can insert own matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

CREATE POLICY "Users can update own matches including soft delete"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own draft or scheduled matches"
  ON matches
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) AND 
    status IN ('draft', 'scheduled')
  );

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_matches_user_updated;
DROP INDEX IF EXISTS idx_matches_user_completed;
DROP INDEX IF EXISTS idx_matches_user_created;
DROP INDEX IF EXISTS idx_matches_public_id;

-- =====================================================
-- 4. FIX FUNCTION SECURITY
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_completed_match_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow insert operations
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Block updates if OLD status is completed or completed_at is set
  IF OLD.status = 'completed' OR OLD.completed_at IS NOT NULL THEN
    -- Allow soft delete: only status='deleted' and deleted_at can change
    IF NEW.status = 'deleted' AND NEW.deleted_at IS NOT NULL THEN
      -- Ensure all other fields remain unchanged
      NEW.completed_at = OLD.completed_at;
      NEW.match_data = OLD.match_data;
      NEW.team_a_name = OLD.team_a_name;
      NEW.team_b_name = OLD.team_b_name;
      NEW.team_a_logo_url = OLD.team_a_logo_url;
      NEW.team_b_logo_url = OLD.team_b_logo_url;
      NEW.legal_balls = OLD.legal_balls;
      NEW.has_activity = OLD.has_activity;
      NEW.format = OLD.format;
      NEW.match_type = OLD.match_type;
      RETURN NEW;
    END IF;

    -- Allow visibility and public status changes only
    IF (NEW.allow_player_stats_view != OLD.allow_player_stats_view OR
        NEW.allow_team_scorecard_view != OLD.allow_team_scorecard_view OR
        NEW.is_public != OLD.is_public) THEN
      -- Keep all other critical fields unchanged
      NEW.status = OLD.status;
      NEW.completed_at = OLD.completed_at;
      NEW.match_data = OLD.match_data;
      NEW.team_a_name = OLD.team_a_name;
      NEW.team_b_name = OLD.team_b_name;
      NEW.legal_balls = OLD.legal_balls;
      NEW.has_activity = OLD.has_activity;
      RETURN NEW;
    END IF;

    -- Block all other updates
    RAISE EXCEPTION 'Cannot modify completed match. Match is immutable once completed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION prevent_completed_match_updates() IS 
  'Prevents modifications to completed matches. Allows soft deletes, visibility changes, and public status toggles only. Uses fixed search_path for security.';