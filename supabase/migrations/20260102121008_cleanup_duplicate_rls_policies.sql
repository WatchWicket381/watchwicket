/*
  # Clean Up Duplicate RLS Policies

  ## Changes
  - Remove duplicate anonymous read policies
  - Consolidate authenticated user read policies
  - Ensure clean, minimal RLS policy set

  ## Final Policy Set
  1. Anonymous: Read public matches only (is_public=true AND deleted_at IS NULL)
  2. Authenticated: Read own matches OR public matches
  3. Authenticated: Insert own matches
  4. Authenticated: Update own non-completed matches
  5. Authenticated: Delete own draft/scheduled matches
*/

-- Drop duplicate/redundant policies
DROP POLICY IF EXISTS "Anyone can view public matches" ON matches;
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Authenticated users can view public matches" ON matches;

-- Recreate clean authenticated read policy
CREATE POLICY "Authenticated users can view own or public matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    (is_public = true AND deleted_at IS NULL)
  );