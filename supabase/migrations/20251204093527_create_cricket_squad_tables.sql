/*
  # Cricket Squad - Player Management System

  1. New Tables
    - `player_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, player full name)
      - `nickname` (text, optional)
      - `role` (text, player role: Batsman, Bowler, All-rounder, Keeper)
      - `batting_style` (text, RHB or LHB)
      - `bowling_style` (text, optional, e.g., "Right-arm fast", "Left-arm spin")
      - `photo_url` (text, optional avatar/photo URL)
      - `jersey_number` (integer, optional)
      - `is_guest` (boolean, default false, for temporary players)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `player_stats`
      - `id` (uuid, primary key)
      - `player_id` (uuid, foreign key to player_profiles)
      - `format` (text, "INDOOR", "T20", "ODI", or "ALL" for cumulative)
      - Batting stats (matches, innings, not_outs, runs, balls, highest, fifties, hundreds, fours, sixes, average, strike_rate)
      - Bowling stats (overs, balls, runs_conceded, wickets, best_wickets, best_runs, economy, four_w, five_w)
      - Fielding stats (catches, stumpings, run_outs)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own player profiles
    - Stats are automatically calculated and updated
    
  3. Indexes
    - Index on user_id for fast profile lookups
    - Index on player_id and format for stat queries
*/

-- Create player_profiles table
CREATE TABLE IF NOT EXISTS player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  nickname text,
  role text NOT NULL DEFAULT 'Batsman',
  batting_style text DEFAULT 'RHB',
  bowling_style text,
  photo_url text,
  jersey_number integer,
  is_guest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES player_profiles(id) ON DELETE CASCADE NOT NULL,
  format text NOT NULL DEFAULT 'ALL',
  
  -- Batting stats
  batting_matches integer DEFAULT 0,
  batting_innings integer DEFAULT 0,
  batting_not_outs integer DEFAULT 0,
  batting_runs integer DEFAULT 0,
  batting_balls integer DEFAULT 0,
  batting_highest integer DEFAULT 0,
  batting_fifties integer DEFAULT 0,
  batting_hundreds integer DEFAULT 0,
  batting_fours integer DEFAULT 0,
  batting_sixes integer DEFAULT 0,
  batting_average numeric(10, 2) DEFAULT 0,
  batting_strike_rate numeric(10, 2) DEFAULT 0,
  
  -- Bowling stats
  bowling_matches integer DEFAULT 0,
  bowling_overs numeric(10, 1) DEFAULT 0,
  bowling_balls integer DEFAULT 0,
  bowling_runs integer DEFAULT 0,
  bowling_wickets integer DEFAULT 0,
  bowling_best_wickets integer DEFAULT 0,
  bowling_best_runs integer DEFAULT 999,
  bowling_economy numeric(10, 2) DEFAULT 0,
  bowling_four_w integer DEFAULT 0,
  bowling_five_w integer DEFAULT 0,
  
  -- Fielding stats
  fielding_catches integer DEFAULT 0,
  fielding_stumpings integer DEFAULT 0,
  fielding_run_outs integer DEFAULT 0,
  
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(player_id, format)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_format ON player_stats(player_id, format);

-- Enable RLS
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_profiles
CREATE POLICY "Users can view own player profiles"
  ON player_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own player profiles"
  ON player_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own player profiles"
  ON player_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own player profiles"
  ON player_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for player_stats
CREATE POLICY "Users can view stats for own players"
  ON player_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create stats for own players"
  ON player_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update stats for own players"
  ON player_stats
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete stats for own players"
  ON player_stats
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM player_profiles
      WHERE player_profiles.id = player_stats.player_id
      AND player_profiles.user_id = auth.uid()
    )
  );

-- Function to automatically initialize stats for new players
CREATE OR REPLACE FUNCTION initialize_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Create stats entries for each format
  INSERT INTO player_stats (player_id, format) VALUES (NEW.id, 'ALL');
  INSERT INTO player_stats (player_id, format) VALUES (NEW.id, 'INDOOR');
  INSERT INTO player_stats (player_id, format) VALUES (NEW.id, 'T20');
  INSERT INTO player_stats (player_id, format) VALUES (NEW.id, 'ODI');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize stats when a player is created
DROP TRIGGER IF EXISTS trigger_initialize_player_stats ON player_profiles;
CREATE TRIGGER trigger_initialize_player_stats
  AFTER INSERT ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_player_stats();

-- Function to update player profile updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for player_profiles updated_at
DROP TRIGGER IF EXISTS trigger_update_player_profile_timestamp ON player_profiles;
CREATE TRIGGER trigger_update_player_profile_timestamp
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_player_profile_timestamp();

-- Function to update player stats updated_at timestamp
CREATE OR REPLACE FUNCTION update_player_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for player_stats updated_at
DROP TRIGGER IF EXISTS trigger_update_player_stats_timestamp ON player_stats;
CREATE TRIGGER trigger_update_player_stats_timestamp
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats_timestamp();
