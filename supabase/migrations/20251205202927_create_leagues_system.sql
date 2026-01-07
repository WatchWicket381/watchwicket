/*
  # Create Leagues System

  1. New Tables
    - `leagues`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, required)
      - `format` (text, enum-like: INDOOR/T20/ODI)
      - `overs` (int)
      - `start_date` (date, nullable)
      - `end_date` (date, nullable)
      - `location` (text, nullable)
      - `created_at` (timestamptz)
    
    - `league_teams`
      - `id` (uuid, primary key)
      - `league_id` (uuid, foreign key to leagues)
      - `team_id` (uuid, foreign key to teams)
      - `created_at` (timestamptz)
      - Unique constraint on (league_id, team_id)
    
    - `league_fixtures`
      - `id` (uuid, primary key)
      - `league_id` (uuid, foreign key to leagues)
      - `home_team_id` (uuid, foreign key to teams)
      - `away_team_id` (uuid, foreign key to teams)
      - `match_id` (uuid, foreign key to matches, nullable)
      - `round` (text, nullable)
      - `match_date` (date, required)
      - `match_time` (time, required)
      - `venue` (text, nullable)
      - `notes` (text, nullable)
      - `status` (text, default SCHEDULED)
      - `created_at` (timestamptz)
    
    - `league_standings`
      - `id` (uuid, primary key)
      - `league_id` (uuid, foreign key to leagues)
      - `team_id` (uuid, foreign key to teams)
      - `matches_played` (int, default 0)
      - `wins` (int, default 0)
      - `losses` (int, default 0)
      - `ties` (int, default 0)
      - `no_results` (int, default 0)
      - `points` (int, default 0)
      - `runs_for` (int, default 0)
      - `runs_against` (int, default 0)
      - `overs_faced` (numeric, default 0)
      - `overs_bowled` (numeric, default 0)
      - `net_run_rate` (numeric, default 0)
      - `updated_at` (timestamptz)

  2. Changes to Existing Tables
    - Add `league_id` and `fixture_id` to matches table

  3. Security
    - Enable RLS on all new tables
    - Add policies for league owners to manage their leagues
*/

-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  format text DEFAULT 'INDOOR' CHECK (format IN ('INDOOR', 'T20', 'ODI')),
  overs int DEFAULT 10,
  start_date date,
  end_date date,
  location text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leagues"
  ON leagues FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leagues"
  ON leagues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leagues"
  ON leagues FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own leagues"
  ON leagues FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create league_teams table
CREATE TABLE IF NOT EXISTS league_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  team_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(league_id, team_id)
);

ALTER TABLE league_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view league teams"
  ON league_teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_teams.league_id
      AND leagues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert league teams"
  ON league_teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_teams.league_id
      AND leagues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete league teams"
  ON league_teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_teams.league_id
      AND leagues.user_id = auth.uid()
    )
  );

-- Create league_fixtures table
CREATE TABLE IF NOT EXISTS league_fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  home_team_id uuid NOT NULL,
  away_team_id uuid NOT NULL,
  match_id uuid,
  round text,
  match_date date NOT NULL,
  match_time time NOT NULL,
  venue text,
  notes text,
  status text DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE league_fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view league fixtures"
  ON league_fixtures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_fixtures.league_id
      AND leagues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert league fixtures"
  ON league_fixtures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_fixtures.league_id
      AND leagues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update league fixtures"
  ON league_fixtures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_fixtures.league_id
      AND leagues.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_fixtures.league_id
      AND leagues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete league fixtures"
  ON league_fixtures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_fixtures.league_id
      AND leagues.user_id = auth.uid()
    )
  );

-- Create league_standings table
CREATE TABLE IF NOT EXISTS league_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id uuid REFERENCES leagues(id) ON DELETE CASCADE NOT NULL,
  team_id uuid NOT NULL,
  matches_played int DEFAULT 0,
  wins int DEFAULT 0,
  losses int DEFAULT 0,
  ties int DEFAULT 0,
  no_results int DEFAULT 0,
  points int DEFAULT 0,
  runs_for int DEFAULT 0,
  runs_against int DEFAULT 0,
  overs_faced numeric DEFAULT 0,
  overs_bowled numeric DEFAULT 0,
  net_run_rate numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(league_id, team_id)
);

ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view league standings"
  ON league_standings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_standings.league_id
      AND leagues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert league standings"
  ON league_standings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_standings.league_id
      AND leagues.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update league standings"
  ON league_standings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_standings.league_id
      AND leagues.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leagues
      WHERE leagues.id = league_standings.league_id
      AND leagues.user_id = auth.uid()
    )
  );

-- Add league columns to matches table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'league_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN league_id uuid REFERENCES leagues(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'fixture_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN fixture_id uuid REFERENCES league_fixtures(id) ON DELETE SET NULL;
  END IF;
END $$;