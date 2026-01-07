/*
  # Fix RLS Policy to Prevent Completed Match Updates

  1. Changes
    - Drop existing UPDATE policy for matches table
    - Create new UPDATE policy that prevents updates when status = 'completed'
    
  2. Security
    - Users can only update their own matches
    - Updates are blocked when match status is 'completed'
    - Protects match data integrity once completed
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own matches" ON matches;

-- Create new update policy with completed match protection
CREATE POLICY "Users can update own non-completed matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND status != 'completed');
