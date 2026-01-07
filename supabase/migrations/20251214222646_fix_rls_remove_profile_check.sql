/*
  # Fix RLS Policies - Remove Profile Dependency

  1. Problem
    - Current RLS policies check for profile existence with is_deleted = false
    - This causes "new row violates row-level security policy" errors when:
      * User profile doesn't exist (signup error, migration timing)
      * Profile is marked as deleted
      * Profiles table has issues
    - The profile check is overly restrictive and unnecessary for security

  2. Solution
    - Remove the profile existence check from all RLS policies
    - Keep only the core security check: user_id = auth.uid()
    - This ensures users can only access their own data
    - Profile status should not block data access

  3. Changes
    - Update matches table RLS policies
    - Simplify INSERT, UPDATE, DELETE policies
    - Remove EXISTS (SELECT 1 FROM profiles...) checks

  4. Security
    - Still secure: user_id = auth.uid() prevents unauthorized access
    - Users can only access their own matches
    - No cross-user data leakage
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "Users can delete own matches" ON matches;

-- Recreate policies without profile check
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own matches"
  ON matches FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add documentation
COMMENT ON POLICY "Users can view own matches" ON matches IS 'Users can only view their own matches. No profile dependency.';
COMMENT ON POLICY "Users can insert own matches" ON matches IS 'Users can only create matches with their own user_id. No profile dependency.';
COMMENT ON POLICY "Users can update own matches" ON matches IS 'Users can only update their own matches. No profile dependency.';
COMMENT ON POLICY "Users can delete own matches" ON matches IS 'Users can only delete their own matches. No profile dependency.';
