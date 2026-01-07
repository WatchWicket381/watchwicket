/*
  # Fix Soft Delete for Completed Matches

  ## Problem
  - The trigger `prevent_completed_match_updates()` blocks ALL updates to completed matches
  - This prevents users from soft-deleting completed matches
  - When users try to delete a completed match, the database raises an exception
  - This causes matches to reappear after refresh

  ## Solution
  - Update the trigger to allow soft deletes even for completed matches
  - Soft delete is safe because it only sets `status='deleted'` and `deleted_at` timestamp
  - This doesn't modify the actual match data, scores, or other immutable fields
  - The match data remains intact and immutable, just hidden from the user's view

  ## Changes
  1. Update trigger function to allow status='deleted' and deleted_at timestamp changes
  2. Ensure all other fields remain protected when match is completed
  3. Allow visibility changes as before

  ## Security
  - Completed match data remains immutable (scores, match_data, etc.)
  - Only soft delete operation is allowed (status='deleted' + deleted_at)
  - Visibility toggles still allowed
  - All other modifications blocked
*/

-- Update trigger function to allow soft deletes
CREATE OR REPLACE FUNCTION prevent_completed_match_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow insert operations
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Block updates if OLD status is completed or completed_at is set
  IF OLD.status = 'completed' OR OLD.completed_at IS NOT NULL THEN
    -- Allow soft delete: only status='deleted' and deleted_at can change
    IF NEW.status = 'deleted' AND NEW.deleted_at IS NOT NULL THEN
      -- Ensure all other fields remain unchanged
      NEW.completed_at = OLD.completed_at;
      NEW.match_data = OLD.match_data;
      NEW.team_a_name = OLD.team_a_name;
      NEW.team_b_name = OLD.team_b_name;
      NEW.team_a_logo_url = OLD.team_a_logo_url;
      NEW.team_b_logo_url = OLD.team_b_logo_url;
      NEW.legal_balls = OLD.legal_balls;
      NEW.has_activity = OLD.has_activity;
      NEW.format = OLD.format;
      NEW.match_type = OLD.match_type;
      RETURN NEW;
    END IF;

    -- Allow visibility changes only
    IF NEW.allow_player_stats_view != OLD.allow_player_stats_view OR
       NEW.allow_team_scorecard_view != OLD.allow_team_scorecard_view THEN
      NEW.status = OLD.status;
      NEW.completed_at = OLD.completed_at;
      NEW.match_data = OLD.match_data;
      NEW.team_a_name = OLD.team_a_name;
      NEW.team_b_name = OLD.team_b_name;
      NEW.legal_balls = OLD.legal_balls;
      NEW.has_activity = OLD.has_activity;
      RETURN NEW;
    END IF;

    -- Block all other updates
    RAISE EXCEPTION 'Cannot modify completed match. Match is immutable once completed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION prevent_completed_match_updates() IS 
  'Prevents modifications to completed matches to ensure data integrity. Allows soft deletes (status=deleted) and visibility changes only.';