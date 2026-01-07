/*
  # Add Completed Match Immutability Protection

  1. Purpose
    - Prevent updates to completed matches to maintain data integrity
    - Ensure completed_at timestamp never changes once set
    - Block all modifications to matches with status='completed' or completed_at IS NOT NULL

  2. Changes
    - Add trigger function to validate updates
    - Block updates when match is completed
    - Allow reads but prevent modifications

  3. Security
    - Completed matches become immutable
    - Preserves match history integrity
    - Prevents accidental data corruption

  4. Migration Safety
    - Uses IF NOT EXISTS checks
    - Non-destructive changes only
    - Preserves existing data
*/

-- Create trigger function to prevent updates to completed matches
CREATE OR REPLACE FUNCTION prevent_completed_match_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow insert operations
  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;

  -- Block updates if OLD status is completed or completed_at is set
  IF OLD.status = 'completed' OR OLD.completed_at IS NOT NULL THEN
    -- Allow only specific safe operations (like visibility toggles)
    IF NEW.allow_player_stats_view != OLD.allow_player_stats_view OR
       NEW.allow_team_scorecard_view != OLD.allow_team_scorecard_view THEN
      -- Allow visibility changes only
      NEW.status = OLD.status;
      NEW.completed_at = OLD.completed_at;
      NEW.match_data = OLD.match_data;
      NEW.team_a_name = OLD.team_a_name;
      NEW.team_b_name = OLD.team_b_name;
      NEW.legal_balls = OLD.legal_balls;
      NEW.has_activity = OLD.has_activity;
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Cannot modify completed match. Match is immutable once completed.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS protect_completed_matches ON matches;

CREATE TRIGGER protect_completed_matches
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION prevent_completed_match_updates();

-- Add comment for documentation
COMMENT ON FUNCTION prevent_completed_match_updates() IS 'Prevents modifications to completed matches to ensure data integrity';
