import React, { useEffect, useState } from "react";
import { getMyLinkedProfiles, getAllPlayerStats, PlayerProfile, PlayerStats } from "../store/supabasePlayerProfiles";
import { useAuth } from "../contexts/AuthContext";

interface MyStatsProps {
  onClose: () => void;
}

const MyStats: React.FC<MyStatsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [linkedProfiles, setLinkedProfiles] = useState<PlayerProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<"ALL" | "INDOOR" | "T20" | "ODI">("ALL");

  useEffect(() => {
    loadLinkedProfiles();
  }, [user]);

  useEffect(() => {
    if (selectedProfile) {
      loadStats(selectedProfile.id);
    }
  }, [selectedProfile]);

  async function loadLinkedProfiles() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const profiles = await getMyLinkedProfiles(user.id);
    setLinkedProfiles(profiles);

    if (profiles.length > 0) {
      setSelectedProfile(profiles[0]);
    }

    setLoading(false);
  }

  async function loadStats(profileId: string) {
    const allStats = await getAllPlayerStats(profileId);
    setStats(allStats);
  }

  const currentStats = stats.find((s) => s.format === selectedFormat);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center">
        <div className="text-white text-xl">Loading stats...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">My Stats</h1>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">Please sign in to view your stats</p>
          </div>
        </div>
      </div>
    );
  }

  if (linkedProfiles.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">My Stats</h1>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No Linked Profile</h3>
            <p className="text-slate-400">
              Your account is not yet linked to a player profile. Ask a match owner to link your account to your player profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">My Stats</h1>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {linkedProfiles.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Profile
            </label>
            <select
              value={selectedProfile?.id || ""}
              onChange={(e) => {
                const profile = linkedProfiles.find((p) => p.id === e.target.value);
                setSelectedProfile(profile || null);
              }}
              className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-700"
            >
              {linkedProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} {profile.nickname ? `(${profile.nickname})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedProfile && (
          <>
            <div className="bg-slate-800 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4">
                {selectedProfile.photo_url && (
                  <img
                    src={selectedProfile.photo_url}
                    alt={selectedProfile.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedProfile.name}</h2>
                  {selectedProfile.nickname && (
                    <p className="text-slate-400">"{selectedProfile.nickname}"</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    <span>{selectedProfile.role}</span>
                    <span>•</span>
                    <span>{selectedProfile.batting_style}</span>
                    {selectedProfile.bowling_style && (
                      <>
                        <span>•</span>
                        <span>{selectedProfile.bowling_style}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex gap-2 overflow-x-auto">
                {["ALL", "INDOOR", "T20", "ODI"].map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format as typeof selectedFormat)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedFormat === format
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {currentStats ? (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Batting</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-slate-400 text-sm">Matches</div>
                      <div className="text-white text-2xl font-bold">{currentStats.batting_matches}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Innings</div>
                      <div className="text-white text-2xl font-bold">{currentStats.batting_innings}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Runs</div>
                      <div className="text-white text-2xl font-bold">{currentStats.batting_runs}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Average</div>
                      <div className="text-white text-2xl font-bold">
                        {currentStats.batting_average.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Strike Rate</div>
                      <div className="text-white text-2xl font-bold">
                        {currentStats.batting_strike_rate.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Highest</div>
                      <div className="text-white text-2xl font-bold">{currentStats.batting_highest}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">50s / 100s</div>
                      <div className="text-white text-2xl font-bold">
                        {currentStats.batting_fifties} / {currentStats.batting_hundreds}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">4s / 6s</div>
                      <div className="text-white text-2xl font-bold">
                        {currentStats.batting_fours} / {currentStats.batting_sixes}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Bowling</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-slate-400 text-sm">Matches</div>
                      <div className="text-white text-2xl font-bold">{currentStats.bowling_matches}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Overs</div>
                      <div className="text-white text-2xl font-bold">{currentStats.bowling_overs.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Wickets</div>
                      <div className="text-white text-2xl font-bold">{currentStats.bowling_wickets}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Runs</div>
                      <div className="text-white text-2xl font-bold">{currentStats.bowling_runs}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Economy</div>
                      <div className="text-white text-2xl font-bold">
                        {currentStats.bowling_economy.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Best</div>
                      <div className="text-white text-2xl font-bold">
                        {currentStats.bowling_best_wickets}/{currentStats.bowling_best_runs}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">4W / 5W</div>
                      <div className="text-white text-2xl font-bold">
                        {currentStats.bowling_four_w} / {currentStats.bowling_five_w}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Fielding</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-slate-400 text-sm">Catches</div>
                      <div className="text-white text-2xl font-bold">{currentStats.fielding_catches}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Stumpings</div>
                      <div className="text-white text-2xl font-bold">{currentStats.fielding_stumpings}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-sm">Run Outs</div>
                      <div className="text-white text-2xl font-bold">{currentStats.fielding_run_outs}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl p-8 text-center">
                <p className="text-slate-400">No stats available for this format</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyStats;
