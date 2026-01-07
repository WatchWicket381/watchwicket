/*
  # Fix RLS to Allow Deleting Completed Matches

  ## Problem
  - Current UPDATE policy blocks all updates when status='completed'
  - This prevents soft-deleting completed matches
  - The USING clause filters out completed matches before the trigger even runs

  ## Solution
  - Update the RLS policy to allow updates to completed matches for soft delete operations
  - Use a more permissive USING clause that allows access to completed matches for soft delete
  - Let the trigger handle the detailed validation of what can be changed

  ## Changes
  1. Drop existing UPDATE policy
  2. Create new policy that allows:
     - Updates to non-completed matches (full access)
     - Updates to completed matches (trigger will validate what can change)
  3. The trigger will ensure only safe operations (soft delete, visibility) are allowed on completed matches

  ## Security
  - Users can only update their own matches (user_id = auth.uid())
  - Trigger enforces immutability for completed matches
  - Only soft delete and visibility changes allowed on completed matches
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own non-completed matches" ON matches;

-- Create new update policy that allows access to completed matches for soft delete
CREATE POLICY "Users can update own matches including soft delete"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- Add comment
COMMENT ON POLICY "Users can update own matches including soft delete" ON matches IS
  'Users can update their own matches. Trigger enforces immutability for completed matches, allowing only soft deletes and visibility changes.';