/*
  # Fix UPDATE Policy to Allow Match Completion

  1. Problem
    - Current UPDATE policy blocks updates when NEW status = 'completed'
    - This prevents transitioning matches TO completed status
    - The WITH CHECK clause is checking the wrong row (new instead of existing)

  2. Solution
    - USING clause: Check if EXISTING row is not already completed
    - WITH CHECK clause: Allow any status, just verify user_id
    - This allows transitioning TO completed, but blocks updates AFTER completed

  3. Changes
    - Drop existing UPDATE policy
    - Create new policy that checks existing row status in USING
    - Allow completion in WITH CHECK

  4. Security
    - Users can only update their own matches
    - Once a match is completed, further updates are blocked
    - Application code also enforces this (defense in depth)
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own non-completed matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;

-- Create new update policy with correct logic
CREATE POLICY "Users can update own matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND status != 'completed'
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Add comment
COMMENT ON POLICY "Users can update own matches" ON matches IS
  'Users can update their own matches. Once completed, updates are blocked by USING clause.';