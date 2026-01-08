import React, { useState, useEffect } from "react";
import { listPlayerProfiles, PlayerProfile } from "../store/supabasePlayerProfiles";
import { useAuth } from "../contexts/AuthContext";

interface TeamsProps {
  onClose: () => void;
}

interface Team {
  id: string;
  name: string;
  players: string[];
  created_at: string;
}

const Teams: React.FC<TeamsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const profiles = await listPlayerProfiles();
    setPlayers(profiles);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-950 text-white flex items-center justify-center">
        <div className="text-xl">Loading Teams...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-950 text-white flex flex-col pb-20">
        <header className="bg-green-900/50 backdrop-blur-sm py-4 shadow-lg border-b border-green-800/50">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-green-300 hover:text-white p-2 hover:bg-green-800/50 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-white">Teams</h1>
            <div className="w-16"></div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-green-900/40 rounded-xl p-8 text-center max-w-md border border-green-800/50">
            <p className="text-green-300">Please sign in to manage teams</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-950 text-white flex flex-col pb-20">
      <header className="bg-green-900/50 backdrop-blur-sm py-4 shadow-lg border-b border-green-800/50">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-green-300 hover:text-white p-2 hover:bg-green-800/50 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">Teams</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            + Create Team
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {teams.length === 0 ? (
            <div className="bg-green-900/40 rounded-2xl p-12 text-center border border-green-800/50">
              <div className="text-6xl mb-4">🏏</div>
              <h3 className="text-xl font-semibold mb-2 text-white">No Teams Yet</h3>
              <p className="text-green-300 mb-6">
                Create your first team to organize players for matches
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
              >
                Create Your First Team
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-green-900/40 rounded-xl p-6 border border-green-800/50 hover:bg-green-900/50 transition-colors"
                >
                  <h3 className="text-xl font-bold mb-2">{team.name}</h3>
                  <p className="text-green-300 text-sm">
                    {team.players.length} {team.players.length === 1 ? "player" : "players"}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-green-900/30 rounded-2xl p-8 border border-green-800/50">
            <div className="text-center">
              <div className="text-5xl mb-4">🚧</div>
              <h3 className="text-xl font-bold mb-2 text-white">Team Management Coming Soon</h3>
              <p className="text-green-300 text-sm">
                Full team roster management, team stats, and team-based match scheduling will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreateTeamModal
          players={players}
          onClose={() => setShowCreateModal(false)}
          onCreate={(team) => {
            setTeams([...teams, team]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

interface CreateTeamModalProps {
  players: PlayerProfile[];
  onClose: () => void;
  onCreate: (team: Team) => void;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({ players, onClose, onCreate }) => {
  const [teamName, setTeamName] = useState("");

  function handleCreate() {
    if (!teamName.trim()) return;

    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: teamName.trim(),
      players: [],
      created_at: new Date().toISOString(),
    };

    onCreate(newTeam);
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-green-900 rounded-xl max-w-md w-full border border-green-800">
        <div className="border-b border-green-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create New Team</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-green-800 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              className="w-full bg-green-950 border border-green-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
          </div>

          <div className="bg-green-950 rounded-lg p-4 border border-green-800">
            <p className="text-xs text-green-300">
              You have {players.length} {players.length === 1 ? "player" : "players"} in your squad.
              Full roster management will be available in a future update.
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-green-800 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!teamName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Create Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
