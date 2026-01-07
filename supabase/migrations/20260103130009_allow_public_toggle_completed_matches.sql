/*
  # Allow Toggling Public Status on Completed Matches

  ## Problem
  - Users need to be able to make completed matches public to share them
  - Current trigger blocks ALL changes to completed matches except soft delete and visibility
  - The `is_public` field should be changeable like visibility settings

  ## Solution
  - Update trigger to allow changing `is_public` field on completed matches
  - This is safe as it doesn't modify match data, scores, or other immutable fields

  ## Changes
  - Add `is_public` to the list of allowed changes for completed matches
  - Similar to visibility toggles (allow_player_stats_view, allow_team_scorecard_view)
*/

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

    -- Allow visibility and public status changes only
    IF (NEW.allow_player_stats_view != OLD.allow_player_stats_view OR
        NEW.allow_team_scorecard_view != OLD.allow_team_scorecard_view OR
        NEW.is_public != OLD.is_public) THEN
      -- Keep all other critical fields unchanged
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

COMMENT ON FUNCTION prevent_completed_match_updates() IS 
  'Prevents modifications to completed matches. Allows soft deletes, visibility changes, and public status toggles only.';