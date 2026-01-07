import React, { useState, useEffect } from "react";
import {
  listPlayerProfiles,
  createPlayerProfile,
  updatePlayerProfile,
  deletePlayerProfile,
  getAllPlayerStats,
  linkPlayerToUser,
  PlayerProfile,
  PlayerStats,
} from "../store/supabasePlayerProfiles";
import { supabase } from "../supabaseClient";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { PlayerPhotoUpload } from "../components/PlayerPhotoUpload";
import { formatPlayerName } from "../utils/nameFormatter";

interface Props {
  onBack: () => void;
}

const CricketSquad: React.FC<Props> = ({ onBack }) => {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerProfile | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [allPlayerStats, setAllPlayerStats] = useState<PlayerStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "matches" | "recent">("name");

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);
    const profiles = await listPlayerProfiles();
    setPlayers(profiles);
    setLoading(false);
  }

  async function handleViewPlayer(player: PlayerProfile) {
    setSelectedPlayer(player);
    const stats = await getAllPlayerStats(player.id);
    setAllPlayerStats(stats);
  }

  function getPlayerInitials(name: string): string {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading Player Profiles...</div>
      </div>
    );
  }

  if (selectedPlayer) {
    return (
      <PlayerDetailsView
        player={selectedPlayer}
        allStats={allPlayerStats}
        onBack={() => {
          setSelectedPlayer(null);
          setAllPlayerStats([]);
        }}
        onEdit={() => {
          setEditingPlayer(selectedPlayer);
          setSelectedPlayer(null);
        }}
        onDelete={async () => {
          const confirmed = confirm(
            `Are you sure you want to delete ${selectedPlayer.name}? This will remove all their stats permanently.`
          );
          if (confirmed) {
            await deletePlayerProfile(selectedPlayer.id);
            setSelectedPlayer(null);
            loadPlayers();
          }
        }}
      />
    );
  }

  if (showAddModal || editingPlayer) {
    return (
      <PlayerFormModal
        player={editingPlayer}
        onClose={() => {
          setShowAddModal(false);
          setEditingPlayer(null);
        }}
        onSave={async (playerData) => {
          if (editingPlayer) {
            await updatePlayerProfile(editingPlayer.id, playerData);
          } else {
            await createPlayerProfile(playerData);
          }
          setShowAddModal(false);
          setEditingPlayer(null);
          loadPlayers();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white flex flex-col pb-20">
      <header className="bg-green-900/50 backdrop-blur-sm py-4 shadow-lg border-b border-green-800/50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-green-300 hover:text-white p-2 hover:bg-green-800/50 rounded-lg transition-colors text-2xl"
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-bold">Player Profiles</h1>
              <p className="text-sm text-green-300">Manage your player roster</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg"
          >
            + Add Player
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-green-950/50 border border-green-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-green-400"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-green-950/50 border border-green-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
            >
              <option value="name">Sort by Name</option>
              <option value="matches">Sort by Matches</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>

          {sortedPlayers.length === 0 ? (
            <div className="bg-green-900/40 rounded-xl p-12 text-center border border-green-800/50">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">No Players Yet</h3>
              <p className="text-green-300 mb-6">
                {searchQuery
                  ? "No players match your search"
                  : "Add your first player to build your squad"}
              </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Add First Player
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                onClick={() => handleViewPlayer(player)}
                className="bg-green-900/40 rounded-xl p-5 hover:bg-green-900/60 transition-colors cursor-pointer border border-green-800/50 shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <PlayerAvatar
                      name={player.name}
                      photoUrl={player.photo_url}
                      size="md"
                    />
                    {player.photo_url && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center border-2 border-green-900">
                        <span className="text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate">{formatPlayerName(player.name)}</h3>
                    {player.nickname && (
                      <p className="text-sm text-green-300 truncate">"{player.nickname}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-green-800 px-2 py-1 rounded">
                        {player.role}
                      </span>
                      <span className="text-xs text-green-400">{player.batting_style}</span>
                      {player.jersey_number && (
                        <span className="text-xs text-green-400">#{player.jersey_number}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

interface PlayerFormModalProps {
  player: PlayerProfile | null;
  onClose: () => void;
  onSave: (data: Omit<PlayerProfile, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ player, onClose, onSave }) => {
  const [name, setName] = useState(player?.name || "");
  const [nickname, setNickname] = useState(player?.nickname || "");
  const [role, setRole] = useState<PlayerProfile["role"]>(player?.role || "Batsman");
  const [battingStyle, setBattingStyle] = useState<PlayerProfile["batting_style"]>(
    player?.batting_style || "RHB"
  );
  const [bowlingStyle, setBowlingStyle] = useState(player?.bowling_style || "");
  const [photoUrl, setPhotoUrl] = useState(player?.photo_url || "");
  const [jerseyNumber, setJerseyNumber] = useState(player?.jersey_number?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Player name is required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        role,
        batting_style: battingStyle,
        bowling_style: bowlingStyle.trim() || undefined,
        photo_url: photoUrl.trim() || undefined,
        jersey_number: jerseyNumber ? parseInt(jerseyNumber) : undefined,
        is_guest: false,
      });
    } catch (err) {
      console.error("Error saving player:", err);
      setError("Failed to save player. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4 pb-24">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
          <h2 className="text-2xl font-bold">
            {player ? "Edit Player" : "Add New Player"}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-slate-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Optional"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as PlayerProfile["role"])}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Keeper">Keeper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Batting Style *</label>
                <select
                  value={battingStyle}
                  onChange={(e) => setBattingStyle(e.target.value as PlayerProfile["batting_style"])}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="RHB">Right-handed (RHB)</option>
                  <option value="LHB">Left-handed (LHB)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Bowling Style</label>
              <input
                type="text"
                value={bowlingStyle}
                onChange={(e) => setBowlingStyle(e.target.value)}
                placeholder="e.g., Right-arm fast, Left-arm spin"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Jersey Number</label>
              <input
                type="number"
                value={jerseyNumber}
                onChange={(e) => setJerseyNumber(e.target.value)}
                placeholder="Optional"
                min="1"
                max="999"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <PlayerPhotoUpload
              currentPhotoUrl={photoUrl}
              playerId={player?.id}
              playerName={name || "New Player"}
              onPhotoUploaded={(url) => setPhotoUrl(url)}
              onPhotoRemoved={() => setPhotoUrl("")}
            />
          </div>

          <div className="border-t border-slate-700 bg-slate-800 px-6 py-4 flex-shrink-0 rounded-b-xl">
            {error && (
              <div className="mb-4 bg-red-900/50 border border-red-700 rounded-lg px-4 py-3 text-red-200 text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {saving ? "Saving..." : player ? "Update Player" : "Add Player"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PlayerDetailsViewProps {
  player: PlayerProfile;
  allStats: PlayerStats[];
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const PlayerDetailsView: React.FC<PlayerDetailsViewProps> = ({
  player,
  allStats,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<"ALL" | "INDOOR" | "T20" | "ODI">("ALL");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkedUserEmail, setLinkedUserEmail] = useState<string>("");
  const [currentPlayer, setCurrentPlayer] = useState<PlayerProfile>(player);

  const stats = allStats.find((s) => s.format === selectedFormat) || null;

  useEffect(() => {
    loadLinkedUserEmail();
  }, [player]);

  async function loadLinkedUserEmail() {
    if (player.linked_user_id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", player.linked_user_id)
        .maybeSingle();

      if (data) {
        setLinkedUserEmail(data.full_name || data.email || "Unknown User");
      } else {
        const { data: authUser } = await supabase.auth.admin.getUserById(
          player.linked_user_id
        );
        if (authUser) {
          setLinkedUserEmail(authUser.user?.email || "Unknown User");
        }
      }
    }
  }

  async function handleUnlink() {
    const confirmed = confirm(
      `Are you sure you want to unlink ${currentPlayer.name} from their user account?`
    );
    if (confirmed) {
      const updated = await linkPlayerToUser(currentPlayer.id, null);
      if (updated) {
        setCurrentPlayer(updated);
        setLinkedUserEmail("");
      }
    }
  }

  function getPlayerInitials(name: string): string {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 py-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-2xl hover:bg-slate-700 rounded-lg p-2 transition-colors"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold">Player Profile</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-6">
            <PlayerAvatar
              name={currentPlayer.name}
              photoUrl={currentPlayer.photo_url}
              size="xl"
            />
            <div className="flex-1">
              <h2 className="text-3xl font-bold">{currentPlayer.name}</h2>
              {currentPlayer.nickname && (
                <p className="text-lg text-slate-400">"{currentPlayer.nickname}"</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-slate-700 px-3 py-1 rounded-lg text-sm font-semibold">
                  {currentPlayer.role}
                </span>
                <span className="bg-slate-700 px-3 py-1 rounded-lg text-sm">
                  {currentPlayer.batting_style}
                </span>
                {currentPlayer.bowling_style && (
                  <span className="bg-slate-700 px-3 py-1 rounded-lg text-sm">
                    {currentPlayer.bowling_style}
                  </span>
                )}
                {currentPlayer.jersey_number && (
                  <span className="bg-slate-700 px-3 py-1 rounded-lg text-sm">
                    #{currentPlayer.jersey_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Account Linking</h3>
              <p className="text-sm text-slate-400">
                Link this player profile to a user account
              </p>
            </div>
          </div>
          {currentPlayer.linked_user_id ? (
            <div className="flex items-center justify-between bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div>
                <div className="text-sm text-slate-400">Linked to</div>
                <div className="text-white font-semibold">{linkedUserEmail}</div>
              </div>
              <button
                onClick={handleUnlink}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Unlink
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 mb-4">
                This player profile is not linked to any user account. Link it to allow the player to view their stats.
              </p>
              <button
                onClick={() => setShowLinkModal(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Link to User Account
              </button>
            </div>
          )}
        </div>

        {showLinkModal && (
          <LinkPlayerModal
            player={currentPlayer}
            onClose={() => setShowLinkModal(false)}
            onLinked={(updated) => {
              setCurrentPlayer(updated);
              setShowLinkModal(false);
              loadLinkedUserEmail();
            }}
          />
        )}

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-700">
            {(["ALL", "INDOOR", "T20", "ODI"] as const).map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                  selectedFormat === format
                    ? "bg-green-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {format === "ALL" ? "Overall" : format}
              </button>
            ))}
          </div>

          <div className="p-6">
            {!stats ? (
              <div className="text-center text-slate-400 py-8">Loading stats...</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4">Batting</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Matches" value={stats.batting_matches} />
                    <StatCard label="Innings" value={stats.batting_innings} />
                    <StatCard label="Runs" value={stats.batting_runs} />
                    <StatCard label="Highest" value={stats.batting_highest} />
                    <StatCard
                      label="Average"
                      value={stats.batting_average.toFixed(2)}
                    />
                    <StatCard
                      label="Strike Rate"
                      value={stats.batting_strike_rate.toFixed(2)}
                    />
                    <StatCard label="50s" value={stats.batting_fifties} />
                    <StatCard label="100s" value={stats.batting_hundreds} />
                    <StatCard label="Fours" value={stats.batting_fours} />
                    <StatCard label="Sixes" value={stats.batting_sixes} />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Bowling</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Matches" value={stats.bowling_matches} />
                    <StatCard label="Wickets" value={stats.bowling_wickets} />
                    <StatCard
                      label="Best"
                      value={
                        stats.bowling_best_wickets > 0
                          ? `${stats.bowling_best_wickets}/${stats.bowling_best_runs}`
                          : "-"
                      }
                    />
                    <StatCard
                      label="Economy"
                      value={stats.bowling_economy.toFixed(2)}
                    />
                    <StatCard label="4W" value={stats.bowling_four_w} />
                    <StatCard label="5W" value={stats.bowling_five_w} />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4">Fielding</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard label="Catches" value={stats.fielding_catches} />
                    <StatCard label="Stumpings" value={stats.fielding_stumpings} />
                    <StatCard label="Run Outs" value={stats.fielding_run_outs} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
    <div className="text-sm text-slate-400 mb-1">{label}</div>
    <div className="text-xl font-bold">{value}</div>
  </div>
);

interface LinkPlayerModalProps {
  player: PlayerProfile;
  onClose: () => void;
  onLinked: (player: PlayerProfile) => void;
}

const LinkPlayerModal: React.FC<LinkPlayerModalProps> = ({ player, onClose, onLinked }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLink() {
    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: profiles, error: searchError } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", email.trim())
        .limit(1);

      if (searchError) {
        console.error("Error searching for user:", searchError);
        setError("An error occurred while searching for the user");
      } else if (profiles && profiles.length > 0) {
        const updated = await linkPlayerToUser(player.id, profiles[0].id);
        if (updated) {
          onLinked(updated);
        } else {
          setError("Failed to link player profile");
        }
      } else {
        setError("No WatchWicket account found for that email");
      }
    } catch (err) {
      console.error("Error linking player:", err);
      setError("An error occurred while linking the player");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl max-w-md w-full">
        <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Link Player to User Account</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-slate-700 rounded-lg p-2 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-4">
              Enter the email address of the user account you want to link to{" "}
              <span className="font-semibold text-white">{formatPlayerName(player.name)}</span>.
            </p>
            <label className="block text-sm font-semibold mb-2">User Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="user@example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400">
              The user must have an account on WatchWicket. Once linked, they will be able to view
              their stats from matches where you've enabled stat visibility.
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLink}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? "Linking..." : "Link Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CricketSquad;
