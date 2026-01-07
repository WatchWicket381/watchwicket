/*
  # Add Soft Delete and User Settings

  1. Changes to profiles table
    - Add `is_deleted` column (boolean, default false)
    - User accounts can be soft-deleted without removing data

  2. New Tables
    - `user_settings`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `show_ball_confirmations` (boolean, default true)
      - `enable_haptic_feedback` (boolean, default true)
      - `play_boundary_sounds` (boolean, default true)
      - `default_allow_player_stats_view` (boolean, default false)
      - `default_allow_team_scorecard_view` (boolean, default false)
      - `email_weekly_stats` (boolean, default false)
      - `email_product_updates` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  3. Security
    - Enable RLS on `user_settings` table
    - Add policy for users to read/write their own settings
    - Update existing RLS policies to exclude deleted users
*/

-- Add is_deleted column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
END $$;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_ball_confirmations boolean DEFAULT true,
  enable_haptic_feedback boolean DEFAULT true,
  play_boundary_sounds boolean DEFAULT true,
  default_allow_player_stats_view boolean DEFAULT false,
  default_allow_team_scorecard_view boolean DEFAULT false,
  email_weekly_stats boolean DEFAULT false,
  email_product_updates boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update existing RLS policies to exclude deleted users
-- Matches policy
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can insert own matches" ON matches;
CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can update own matches" ON matches;
CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can delete own matches" ON matches;
CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );

-- Player profiles policies
DROP POLICY IF EXISTS "Users can view own player profiles" ON player_profiles;
CREATE POLICY "Users can view own player profiles"
  ON player_profiles FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can insert own player profiles" ON player_profiles;
CREATE POLICY "Users can insert own player profiles"
  ON player_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can update own player profiles" ON player_profiles;
CREATE POLICY "Users can update own player profiles"
  ON player_profiles FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  )
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can delete own player profiles" ON player_profiles;
CREATE POLICY "Users can delete own player profiles"
  ON player_profiles FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_deleted = false
    )
  );