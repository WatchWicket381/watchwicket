/*
  # Create matches table for storing user cricket matches

  1. New Tables
    - `matches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `match_type` (text) - INDOOR, T20, ODI, TEST
      - `team_a_name` (text)
      - `team_b_name` (text)
      - `status` (text) - Upcoming, In Progress, Completed
      - `format` (text)
      - `match_data` (jsonb) - Full match state
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on matches table
    - Users can only view their own matches
    - Users can only create/update/delete their own matches
*/

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_type text NOT NULL DEFAULT 'INDOOR',
  team_a_name text NOT NULL DEFAULT 'Team A',
  team_b_name text NOT NULL DEFAULT 'Team B',
  status text NOT NULL DEFAULT 'Upcoming',
  format text NOT NULL DEFAULT 'INDOOR',
  match_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS matches_user_id_idx ON matches(user_id);
CREATE INDEX IF NOT EXISTS matches_updated_at_idx ON matches(updated_at DESC);
