import React, { useState, useEffect } from "react";
import { updateMatchVisibility } from "../store/supabaseMatches";

interface MatchSharingModalProps {
  matchId: string;
  currentAllowPlayerStats: boolean;
  currentAllowTeamScorecard: boolean;
  currentIsPublic: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const MatchSharingModal: React.FC<MatchSharingModalProps> = ({
  matchId,
  currentAllowPlayerStats,
  currentAllowTeamScorecard,
  currentIsPublic,
  onClose,
  onUpdated,
}) => {
  const [allowPlayerStats, setAllowPlayerStats] = useState(currentAllowPlayerStats);
  const [allowTeamScorecard, setAllowTeamScorecard] = useState(currentAllowTeamScorecard);
  const [isPublic, setIsPublic] = useState(currentIsPublic);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");
    setSuccess(false);

    const result = await updateMatchVisibility(matchId, allowPlayerStats, allowTeamScorecard, isPublic);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onUpdated();
        onClose();
      }, 1000);
    } else {
      setError(result.error || "Failed to update sharing settings");
    }

    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full">
        <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Match Sharing Settings</h2>
            <p className="text-sm text-slate-400">Control who can view this match</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-slate-700 rounded-lg p-2 transition-colors text-white"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-emerald-900 bg-opacity-30 rounded-lg p-4 border border-emerald-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  Make Match Public
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded">NEW</span>
                </h3>
                <p className="text-sm text-slate-400">
                  Display this match on the public homepage for everyone to view. Live matches will appear in the live section, and completed matches in results.
                </p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  isPublic ? "bg-emerald-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isPublic ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Allow Players to View Their Stats
                </h3>
                <p className="text-sm text-slate-400">
                  Players with linked accounts can view their own batting, bowling, and fielding
                  statistics from this match. They will not see other players' private stats.
                </p>
              </div>
              <button
                onClick={() => setAllowPlayerStats(!allowPlayerStats)}
                className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  allowPlayerStats ? "bg-green-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    allowPlayerStats ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Allow Team Members to View Scorecards
                </h3>
                <p className="text-sm text-slate-400">
                  Linked players in teams can view full scorecards and match summaries for their
                  team. Opposition details will be shown at the same level as the public scorecard.
                </p>
              </div>
              <button
                onClick={() => setAllowTeamScorecard(!allowTeamScorecard)}
                className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  allowTeamScorecard ? "bg-green-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    allowTeamScorecard ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-400 text-xl">ℹ️</div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-1">Privacy First</h4>
                <p className="text-sm text-blue-200">
                  Both settings are OFF by default. Your matches remain private until you explicitly
                  share them. You maintain full control over your match data.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4 text-green-300 text-sm">
              Settings updated successfully!
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 text-white"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchSharingModal;
