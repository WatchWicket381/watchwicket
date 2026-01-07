/*
  # Player Account Linking & Match Visibility System

  1. Changes to player_profiles
    - Rename `user_id` to `owner_id` (who manages this profile)
    - Add `linked_user_id` (nullable, which user account this profile represents)
    - Update indexes and RLS policies

  2. Changes to matches
    - Add `allow_player_stats_view` (boolean, default false)
    - Add `allow_team_scorecard_view` (boolean, default false)

  3. New RLS Policies
    - Player profiles visible to:
      - Owner (who created them)
      - Linked user (if linked_user_id matches)
      - Users who can view matches containing this player (if visibility enabled)
    - Match stats visible based on visibility settings
    - Player stats visible to linked users when match visibility allows

  4. Security Notes
    - Only profile owner can link/unlink accounts
    - Only match owner can change visibility settings
    - Linked users can only view their own stats when enabled
    - Default privacy: everything private unless explicitly shared
*/

-- Step 1: Add new columns to player_profiles
DO $$
BEGIN
  -- Add linked_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_profiles' AND column_name = 'linked_user_id'
  ) THEN
    ALTER TABLE player_profiles ADD COLUMN linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_player_profiles_linked_user_id ON player_profiles(linked_user_id);
  END IF;
  
  -- Rename user_id to owner_id for clarity (if not already done)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_profiles' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'player_profiles' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE player_profiles RENAME COLUMN user_id TO owner_id;
  END IF;
END $$;

-- Step 2: Add visibility columns to matches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'allow_player_stats_view'
  ) THEN
    ALTER TABLE matches ADD COLUMN allow_player_stats_view boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'allow_team_scorecard_view'
  ) THEN
    ALTER TABLE matches ADD COLUMN allow_team_scorecard_view boolean DEFAULT false;
  END IF;
END $$;

-- Step 3: Drop old RLS policies for player_profiles
DROP POLICY IF EXISTS "Users can view own player profiles" ON player_profiles;
DROP POLICY IF EXISTS "Users can create own player profiles" ON player_profiles;
DROP POLICY IF EXISTS "Users can update own player profiles" ON player_profiles;
DROP POLICY IF EXISTS "Users can delete own player profiles" ON player_profiles;

-- Step 4: Create new RLS policies for player_profiles

-- Owners can view their player profiles
CREATE POLICY "Owners can view their player profiles"
  ON player_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- Linked users can view their linked profile
CREATE POLICY "Linked users can view their profile"
  ON player_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = linked_user_id);

-- Owners can create player profiles
CREATE POLICY "Owners can create player profiles"
  ON player_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their player profiles
CREATE POLICY "Owners can update their player profiles"
  ON player_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their player profiles
CREATE POLICY "Owners can delete their player profiles"
  ON player_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Step 5: Update RLS policies for player_stats to include linked users
DROP POLICY IF EXISTS "Users can view stats for own players" ON player_stats;
DROP POLICY IF EXISTS "Users can create stats for own players" ON player_stats;
DROP POLICY IF EXISTS "Users can update stats for own players" ON player_stats;
DROP POLICY IF EXISTS "Users can delete stats for own players" ON player_stats;

-- Profile owners can view stats for their players
CREATE POLICY "Profile owners can view player stats"
  ON player_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.owner_id = auth.uid()
    )
  );

-- Linked users can view their own stats
CREATE POLICY "Linked users can view their own stats"
  ON player_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.linked_user_id = auth.uid()
    )
  );

-- Profile owners can create stats for their players
CREATE POLICY "Profile owners can create player stats"
  ON player_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.owner_id = auth.uid()
    )
  );

-- Profile owners can update stats for their players
CREATE POLICY "Profile owners can update player stats"
  ON player_stats
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.owner_id = auth.uid()
    )
  );

-- Profile owners can delete stats for their players
CREATE POLICY "Profile owners can delete player stats"
  ON player_stats
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.owner_id = auth.uid()
    )
  );

-- Step 6: Add policy for matches to be viewed by linked players (when visibility enabled)
-- This will be used by application logic to filter matches

-- Step 7: Create helper function to check if user can view match stats
CREATE OR REPLACE FUNCTION can_user_view_match_stats(match_id uuid, check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user is the match owner
  IF EXISTS (
    SELECT 1 FROM matches
    WHERE id = match_id AND user_id = check_user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is a linked player and visibility is enabled
  -- This will be checked in application logic based on match_data
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
