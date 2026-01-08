import React, { useState, useEffect, useMemo, useRef } from "react";
import { MatchState, Player } from "../matchTypes";
import {
  listPlayerProfiles,
  PlayerProfile,
} from "../store/supabasePlayerProfiles";
import { PlayerAvatar } from "../components/PlayerAvatar";
import { TeamLogoUpload } from "../components/TeamLogoUpload";
import { PlayerEditModal } from "../components/PlayerEditModal";
import { formatPlayerName } from "../utils/nameFormatter";

interface Props {
  state: MatchState;
  setState: (s: MatchState) => void;
  isPro?: boolean;
  onDiscardMatch?: () => void;
  onSaveSetup?: () => Promise<void>;
  onStartMatch?: () => Promise<void>;
  matchId?: string | null;
}

interface ReplacingPlayer {
  playerId: string;
  team: "A" | "B";
  playerData: Player;
}

function newPlayer(name: string, format?: string, profileId?: string, photoUrl?: string, isGuest?: boolean): Player {
  return {
    id: crypto.randomUUID(),
    name,
    isOut: false,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    outsCount: format === "INDOOR" ? 0 : undefined,
    profileId,
    photoUrl,
    guest: isGuest,
  };
}

const TeamSheet: React.FC<Props> = ({
  state,
  setState,
  isPro = false,
  onDiscardMatch,
  onSaveSetup,
  onStartMatch,
  matchId,
}) => {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [showSquadPicker, setShowSquadPicker] = useState<"A" | "B" | null>(null);
  const [squadSize, setSquadSize] = useState(11);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [oversInputValue, setOversInputValue] = useState<string>("");

  const [replacingPlayer, setReplacingPlayer] = useState<ReplacingPlayer | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [addingGuestToTeam, setAddingGuestToTeam] = useState<"A" | "B" | null>(null);
  const [guestPlayerName, setGuestPlayerName] = useState("");
  const [guestNickname, setGuestNickname] = useState("");
  const [guestBattingStyle, setGuestBattingStyle] = useState("");
  const [guestBowlingStyle, setGuestBowlingStyle] = useState("");
  const [saveGuestToSquad, setSaveGuestToSquad] = useState(false);

  const [editingPlayer, setEditingPlayer] = useState<{ player: Player; team: "A" | "B" } | null>(null);

  const teamALogoInputRef = useRef<HTMLInputElement>(null);
  const teamBLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfiles() {
      setIsLoadingProfiles(true);
      try {
        const allProfiles = await listPlayerProfiles();
        setProfiles(Array.isArray(allProfiles) ? allProfiles : []);
      } catch (err) {
        console.error("Error loading profiles:", err);
        setProfiles([]);
      } finally {
        setIsLoadingProfiles(false);
      }
    }
    loadProfiles();
  }, []);

  useEffect(() => {
    if (state.oversLimit) {
      setOversInputValue(state.oversLimit.toString());
    }
  }, [state.oversLimit]);

  const selectedAIds = useMemo(() => {
    return new Set(
      state.teamAPlayers
        .map((p) => p.profileId)
        .filter((id): id is string => !!id)
    );
  }, [state.teamAPlayers]);

  const selectedBIds = useMemo(() => {
    return new Set(
      state.teamBPlayers
        .map((p) => p.profileId)
        .filter((id): id is string => !!id)
    );
  }, [state.teamBPlayers]);

  const availableProfilesForA = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p) => !selectedAIds.has(p.id) && !selectedBIds.has(p.id));
  }, [profiles, selectedAIds, selectedBIds]);

  const availableProfilesForB = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p) => !selectedAIds.has(p.id) && !selectedBIds.has(p.id));
  }, [profiles, selectedAIds, selectedBIds]);

  const availableProfilesForReplace = useMemo(() => {
    if (!replacingPlayer) return [];

    const team = replacingPlayer.team;
    const otherTeam = team === "A" ? "B" : "A";
    const otherTeamIds = team === "A" ? selectedBIds : selectedAIds;
    const currentTeamIds = team === "A" ? selectedAIds : selectedBIds;

    const beingReplacedId = replacingPlayer.playerData.profileId;

    return profiles.filter((p) => {
      if (otherTeamIds.has(p.id)) return false;
      if (currentTeamIds.has(p.id) && p.id !== beingReplacedId) return false;
      return true;
    });
  }, [profiles, replacingPlayer, selectedAIds, selectedBIds]);

  const filteredProfiles = useMemo(() => {
    let availableList: PlayerProfile[] = [];

    if (replacingPlayer) {
      availableList = availableProfilesForReplace;
    } else if (showSquadPicker === "A") {
      availableList = availableProfilesForA;
    } else if (showSquadPicker === "B") {
      availableList = availableProfilesForB;
    }

    if (!searchQuery) return availableList;
    const query = searchQuery.toLowerCase();
    return availableList.filter((p) =>
      p.name?.toLowerCase().includes(query)
    );
  }, [showSquadPicker, replacingPlayer, availableProfilesForA, availableProfilesForB, availableProfilesForReplace, searchQuery]);

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function validateAndApplyOvers(value: string): boolean {
    if (!isIndoorMode) return true;

    if (!value.trim()) {
      showToast("Overs required");
      setOversInputValue((state.oversLimit || 5).toString());
      return false;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      showToast("Invalid overs value");
      setOversInputValue((state.oversLimit || 5).toString());
      return false;
    }

    if (parsed < 1 || parsed > 18) {
      showToast("Overs must be between 1 and 18 for Indoor matches");
      setOversInputValue((state.oversLimit || 5).toString());
      return false;
    }

    setState({
      ...state,
      oversLimit: parsed,
      innings: state.innings.map(inning => ({
        ...inning,
        oversLimit: parsed,
      })),
    });
    return true;
  }

  function handleOversBlur() {
    if (!canEditOvers) return;
    validateAndApplyOvers(oversInputValue);
  }

  function canReplacePlayer(player: Player): { canReplace: boolean; reason?: string } {
    if (state.status !== "live") {
      return { canReplace: true };
    }

    const hasParticipated = (player.balls || 0) > 0 || (player.runs || 0) > 0;

    if (hasParticipated) {
      return {
        canReplace: false,
        reason: "Cannot replace a player who has already participated. Use Substitute instead.",
      };
    }

    return { canReplace: true };
  }

  function handleReplaceClick(player: Player, team: "A" | "B") {
    const replaceCheck = canReplacePlayer(player);

    if (!replaceCheck.canReplace) {
      showToast(replaceCheck.reason || "Cannot replace this player");
      return;
    }

    setReplacingPlayer({
      playerId: player.id,
      team,
      playerData: player,
    });
    setShowReplaceModal(true);
  }

  function closeReplaceFlow() {
    setReplacingPlayer(null);
    setShowReplaceModal(false);
    setShowGuestForm(false);
    setShowSquadPicker(null);
    setAddingGuestToTeam(null);
    setGuestPlayerName("");
    setGuestNickname("");
    setGuestBattingStyle("");
    setGuestBowlingStyle("");
    setSaveGuestToSquad(false);
    setSearchQuery("");
  }

  function handleAddPlayer(profile: PlayerProfile) {
    if (!showSquadPicker) return;

    const team = showSquadPicker;
    const otherTeam = team === "A" ? "B" : "A";
    const otherPlayers = team === "A" ? state.teamBPlayers : state.teamAPlayers;

    if (otherPlayers.some((p) => p.profileId === profile.id)) {
      showToast(`${profile.name} is already in Team ${otherTeam}`);
      return;
    }

    const newPlayerObj = newPlayer(
      profile.name,
      state.format,
      profile.id,
      profile.photo_url
    );

    if (team === "A") {
      setState({
        ...state,
        teamAPlayers: [...state.teamAPlayers, newPlayerObj],
      });
    } else {
      setState({
        ...state,
        teamBPlayers: [...state.teamBPlayers, newPlayerObj],
      });
    }

    showToast(`${profile.name} added to Team ${team}`);
  }

  function handleReplaceFromSquad(profile: PlayerProfile) {
    if (!replacingPlayer) return;

    const team = replacingPlayer.team;
    const otherTeam = team === "A" ? "B" : "A";
    const otherPlayers = team === "A" ? state.teamBPlayers : state.teamAPlayers;

    if (otherPlayers.some((p) => p.profileId === profile.id)) {
      showToast(`${profile.name} is already in Team ${otherTeam}`);
      return;
    }

    const newPlayerObj = newPlayer(
      profile.name,
      state.format,
      profile.id,
      profile.photo_url
    );

    const currentPlayers = team === "A" ? state.teamAPlayers : state.teamBPlayers;
    const updatedPlayers = currentPlayers.map((p) =>
      p.id === replacingPlayer.playerId ? newPlayerObj : p
    );

    if (team === "A") {
      setState({
        ...state,
        teamAPlayers: updatedPlayers,
      });
    } else {
      setState({
        ...state,
        teamBPlayers: updatedPlayers,
      });
    }

    showToast(`${replacingPlayer.playerData.name} replaced with ${profile.name}`);
    closeReplaceFlow();
  }

  function handleReplaceWithGuest() {
    if (!replacingPlayer || !guestPlayerName.trim()) {
      showToast("Please enter a player name");
      return;
    }

    const team = replacingPlayer.team;
    const newPlayerObj = newPlayer(
      guestPlayerName.trim(),
      state.format,
      undefined,
      undefined,
      true
    );

    const currentPlayers = team === "A" ? state.teamAPlayers : state.teamBPlayers;
    const updatedPlayers = currentPlayers.map((p) =>
      p.id === replacingPlayer.playerId ? newPlayerObj : p
    );

    if (team === "A") {
      setState({
        ...state,
        teamAPlayers: updatedPlayers,
      });
    } else {
      setState({
        ...state,
        teamBPlayers: updatedPlayers,
      });
    }

    showToast(`${replacingPlayer.playerData.name} replaced with ${guestPlayerName.trim()}`);
    closeReplaceFlow();
  }

  function handleAddGuestPlayer() {
    if (!addingGuestToTeam || !guestPlayerName.trim()) {
      showToast("Please enter a player name");
      return;
    }

    const team = addingGuestToTeam;
    const newPlayerObj = newPlayer(
      guestPlayerName.trim(),
      state.format,
      undefined,
      undefined,
      true
    );

    if (team === "A") {
      setState({
        ...state,
        teamAPlayers: [...state.teamAPlayers, newPlayerObj],
      });
    } else {
      setState({
        ...state,
        teamBPlayers: [...state.teamBPlayers, newPlayerObj],
      });
    }

    showToast(`${guestPlayerName.trim()} added to Team ${team} as guest`);
    closeReplaceFlow();
  }

  function handleRemovePlayer(playerId: string, team: "A" | "B") {
    const updates: Partial<MatchState> = {};

    if (team === "A") {
      updates.teamAPlayers = state.teamAPlayers.filter((p) => p.id !== playerId);
      if (state.teamACaptainId === playerId) {
        updates.teamACaptainId = null;
      }
      if (state.teamAKeeperId === playerId) {
        updates.teamAKeeperId = null;
      }
    } else {
      updates.teamBPlayers = state.teamBPlayers.filter((p) => p.id !== playerId);
      if (state.teamBCaptainId === playerId) {
        updates.teamBCaptainId = null;
      }
      if (state.teamBKeeperId === playerId) {
        updates.teamBKeeperId = null;
      }
    }

    setState({ ...state, ...updates });
    setEditingPlayer(null);
  }

  function handleToggleCaptain(playerId: string, team: "A" | "B") {
    const captainIdKey = team === "A" ? "teamACaptainId" : "teamBCaptainId";
    const currentCaptainId = state[captainIdKey];

    if (currentCaptainId === playerId) {
      setState({ ...state, [captainIdKey]: null });
    } else {
      setState({ ...state, [captainIdKey]: playerId });
    }
  }

  function handleToggleWicketkeeper(playerId: string, team: "A" | "B") {
    const keeperIdKey = team === "A" ? "teamAKeeperId" : "teamBKeeperId";
    const currentKeeperId = state[keeperIdKey];

    if (currentKeeperId === playerId) {
      setState({ ...state, [keeperIdKey]: null });
    } else {
      setState({ ...state, [keeperIdKey]: playerId });
    }
  }

  function handleTeamNameChange(team: "A" | "B", name: string) {
    if (team === "A") {
      setState({ ...state, teamAName: name });
    } else {
      setState({ ...state, teamBName: name });
    }
  }

  function handleLogoUpload(team: "A" | "B", url: string | null) {
    if (team === "A") {
      setState({ ...state, teamALogo: url });
    } else {
      setState({ ...state, teamBLogo: url });
    }
  }

  async function handleSave() {
    if (!onSaveSetup) return;

    if (isIndoorMode && canEditOvers) {
      if (!validateAndApplyOvers(oversInputValue)) {
        return;
      }
    }

    setIsSaving(true);
    try {
      await onSaveSetup();
      showToast("Match setup saved successfully!");
    } catch (err) {
      showToast("Error saving setup. Please try again.");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStart() {
    if (!onStartMatch) return;

    if (state.teamAPlayers.length === 0 || state.teamBPlayers.length === 0) {
      showToast("Both teams must have at least one player");
      return;
    }

    if (!state.teamACaptainId || !state.teamBCaptainId) {
      showToast("Both teams must have a captain assigned");
      return;
    }

    if (isIndoorMode && canEditOvers) {
      if (!validateAndApplyOvers(oversInputValue)) {
        return;
      }
    }

    setIsSaving(true);
    try {
      await onStartMatch();
    } catch (err) {
      showToast("Error starting match. Please try again.");
      console.error("Start error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  const isDraft = state.status === "draft" || !state.status;
  const isScheduled = state.status === "scheduled";
  const isLive = state.status === "live";
  const isCompleted = state.status === "completed" || state.status === "Completed";
  const canEdit = isDraft || isLive;
  const isIndoorMode = state.format === "INDOOR";
  const canEditOvers = isIndoorMode && (isDraft || isScheduled) && !isLive && !isCompleted;

  function renderPlayerRow(player: Player, team: "A" | "B") {
    const bgColor = team === "A" ? "bg-green-900/20" : "bg-blue-900/20";
    const borderColor = team === "A" ? "border-green-800/30" : "border-blue-800/30";

    const isCaptain = (team === "A" ? state.teamACaptainId : state.teamBCaptainId) === player.id;
    const isWicketkeeper = (team === "A" ? state.teamAKeeperId : state.teamBKeeperId) === player.id;

    return (
      <div
        key={player.id}
        className={`${bgColor} rounded-lg p-3 flex items-center gap-3 ${borderColor} border`}
      >
        <PlayerAvatar
          name={player.name}
          photoUrl={player.photoUrl}
          size="sm"
        />

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="font-semibold text-white truncate">
            {formatPlayerName(player.name)}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {player.guest && (
              <span className="text-xs bg-slate-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                Guest
              </span>
            )}
            {isCaptain && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                C
              </span>
            )}
            {isWicketkeeper && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                WK
              </span>
            )}
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => setEditingPlayer({ player, team })}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 backdrop-blur-sm rounded-xl p-6 border border-green-700/50 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Match Setup</h2>

        <div className="space-y-6">
          <div className="bg-green-950/50 rounded-lg p-4 border border-green-800/30">
            <h3 className="text-lg font-semibold mb-4 text-green-300">Team A</h3>
            <input
              type="text"
              value={state.teamAName}
              onChange={(e) => handleTeamNameChange("A", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-green-900/30 border border-green-700 rounded-lg px-4 py-2 text-white mb-4 disabled:opacity-50"
              placeholder="Team A Name"
            />

            <div className="mb-4">
              <TeamLogoUpload
                team="A"
                logoUrl={state.teamALogo}
                onLogoChange={(url) => handleLogoUpload("A", url)}
                teamName={state.teamAName}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-green-200">
                  Players ({state.teamAPlayers.length})
                </h4>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSquadPicker("A");
                      }}
                      className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      + Squad
                    </button>
                    <button
                      onClick={() => {
                        setAddingGuestToTeam("A");
                        setShowGuestForm(true);
                      }}
                      className="bg-slate-600 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      + Guest
                    </button>
                  </div>
                )}
              </div>

              {state.teamAPlayers.length === 0 ? (
                <div className="text-center py-8 text-green-300/60">
                  No players added yet
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {state.teamAPlayers.map((player) => renderPlayerRow(player, "A"))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-950/50 rounded-lg p-4 border border-blue-800/30">
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Team B</h3>
            <input
              type="text"
              value={state.teamBName}
              onChange={(e) => handleTeamNameChange("B", e.target.value)}
              disabled={!canEdit}
              className="w-full bg-blue-900/30 border border-blue-700 rounded-lg px-4 py-2 text-white mb-4 disabled:opacity-50"
              placeholder="Team B Name"
            />

            <div className="mb-4">
              <TeamLogoUpload
                team="B"
                logoUrl={state.teamBLogo}
                onLogoChange={(url) => handleLogoUpload("B", url)}
                teamName={state.teamBName}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-200">
                  Players ({state.teamBPlayers.length})
                </h4>
                {canEdit && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSquadPicker("B");
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      + Squad
                    </button>
                    <button
                      onClick={() => {
                        setAddingGuestToTeam("B");
                        setShowGuestForm(true);
                      }}
                      className="bg-slate-600 hover:bg-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      + Guest
                    </button>
                  </div>
                )}
              </div>

              {state.teamBPlayers.length === 0 ? (
                <div className="text-center py-8 text-blue-300/60">
                  No players added yet
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {state.teamBPlayers.map((player) => renderPlayerRow(player, "B"))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/30">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">Match Format</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-2">
                  Format
                </label>
                <div className="bg-slate-900/30 border border-slate-700 rounded-lg px-4 py-2 text-white">
                  {state.format === "INDOOR" ? "Indoor Cricket" : state.format === "T20" ? "T20 (20 overs)" : state.format === "ODI" ? "ODI (50 overs)" : "Test"}
                </div>
              </div>

              {isIndoorMode && (
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Overs per Innings
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={oversInputValue}
                    onChange={(e) => {
                      if (!canEditOvers) {
                        showToast("Cannot change overs after match has started");
                        return;
                      }
                      setOversInputValue(e.target.value);
                    }}
                    onBlur={handleOversBlur}
                    disabled={!canEditOvers}
                    placeholder="5"
                    className="w-full bg-slate-900/30 border border-slate-700 rounded-lg px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!canEditOvers && (
                    <p className="text-xs text-slate-500 mt-1">
                      {isLive || isCompleted ? "Overs are locked after the match starts" : "Overs editing is only available for Indoor mode"}
                    </p>
                  )}
                  {canEditOvers && (
                    <p className="text-xs text-slate-400 mt-1">
                      Indoor mode: 1-18 overs
                    </p>
                  )}
                </div>
              )}

              {!isIndoorMode && (
                <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg px-4 py-3">
                  <p className="text-sm text-blue-300">
                    <span className="font-semibold">ICC Rules:</span> Overs are fixed for {state.format} format
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {(isDraft || isScheduled) && (
          <div className="mt-6 space-y-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isSaving ? "Saving..." : "Save Setup"}
            </button>
            <button
              onClick={handleStart}
              disabled={isSaving}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {isSaving ? "Starting..." : "Start Match"}
            </button>
            {onDiscardMatch && (
              <button
                onClick={onDiscardMatch}
                disabled={isSaving}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Discard Match
              </button>
            )}
          </div>
        )}
      </div>

      {showReplaceModal && replacingPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                Replace {replacingPlayer.playerData.name}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setShowSquadPicker(replacingPlayer.team);
                  setSearchQuery("");
                }}
                className="w-full bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg font-semibold transition-colors text-white text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold">Choose from Cricket Squad</div>
                  <div className="text-sm text-green-200">Select an existing player</div>
                </div>
                <span className="text-2xl">→</span>
              </button>

              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setShowGuestForm(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg font-semibold transition-colors text-white text-left flex items-center justify-between"
              >
                <div>
                  <div className="font-bold">Add Guest Player</div>
                  <div className="text-sm text-blue-200">Create a temporary player</div>
                </div>
                <span className="text-2xl">→</span>
              </button>

              <button
                onClick={closeReplaceFlow}
                className="w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuestForm && (replacingPlayer || addingGuestToTeam) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                {replacingPlayer ? "Replace with Guest Player" : "Add Guest Player"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Player Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={guestPlayerName}
                  onChange={(e) => setGuestPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Nickname <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={guestNickname}
                  onChange={(e) => setGuestNickname(e.target.value)}
                  placeholder="e.g., Big Hitter"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Batting Style <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <select
                  value={guestBattingStyle}
                  onChange={(e) => setGuestBattingStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Not specified</option>
                  <option value="Right-hand bat">Right-hand bat</option>
                  <option value="Left-hand bat">Left-hand bat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Bowling Style <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <select
                  value={guestBowlingStyle}
                  onChange={(e) => setGuestBowlingStyle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white"
                >
                  <option value="">Not specified</option>
                  <option value="Right-arm fast">Right-arm fast</option>
                  <option value="Right-arm medium">Right-arm medium</option>
                  <option value="Right-arm off-break">Right-arm off-break</option>
                  <option value="Right-arm leg-break">Right-arm leg-break</option>
                  <option value="Left-arm fast">Left-arm fast</option>
                  <option value="Left-arm medium">Left-arm medium</option>
                  <option value="Left-arm orthodox">Left-arm orthodox</option>
                  <option value="Left-arm chinaman">Left-arm chinaman</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-3 border border-slate-700">
                <input
                  type="checkbox"
                  id="saveToSquad"
                  checked={saveGuestToSquad}
                  onChange={(e) => setSaveGuestToSquad(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="saveToSquad" className="text-sm text-slate-300">
                  Also save to Cricket Squad
                </label>
              </div>

              <div className="space-y-2">
                <button
                  onClick={replacingPlayer ? handleReplaceWithGuest : handleAddGuestPlayer}
                  disabled={!guestPlayerName.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition-colors text-white"
                >
                  {replacingPlayer ? "Replace Player" : "Add to Team"}
                </button>
                <button
                  onClick={closeReplaceFlow}
                  className="w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSquadPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {replacingPlayer
                    ? `Replace ${replacingPlayer.playerData.name}`
                    : `Add Player to Team ${showSquadPicker}`}
                </h2>
                <button
                  onClick={closeReplaceFlow}
                  className="text-2xl hover:bg-slate-700 rounded-lg p-2 transition-colors text-white"
                >
                  ×
                </button>
              </div>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="p-6 space-y-4">
              {isLoadingProfiles ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                  <p className="text-lg font-semibold text-white">Loading profiles...</p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-white">
                    {searchQuery ? "No players found matching your search" : "No available players"}
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    {profiles.length === 0
                      ? "Create player profiles first in the Player Profiles section"
                      : "All players have been assigned to teams"}
                  </p>
                  <button
                    onClick={closeReplaceFlow}
                    className="mt-4 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold text-white"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="bg-slate-900 rounded-lg p-3 flex items-center gap-3 border border-slate-700"
                    >
                      <PlayerAvatar
                        name={profile.name}
                        photoUrl={profile.photo_url}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white">{profile.name}</div>
                        <div className="text-sm text-slate-400">
                          {profile.role || "Player"}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          replacingPlayer
                            ? handleReplaceFromSquad(profile)
                            : handleAddPlayer(profile)
                        }
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-colors text-white"
                      >
                        {replacingPlayer ? "Replace" : "Add"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingPlayer && (
        <PlayerEditModal
          player={editingPlayer.player}
          team={editingPlayer.team}
          isCaptain={
            (editingPlayer.team === "A" ? state.teamACaptainId : state.teamBCaptainId) ===
            editingPlayer.player.id
          }
          isWicketkeeper={
            (editingPlayer.team === "A" ? state.teamAKeeperId : state.teamBKeeperId) ===
            editingPlayer.player.id
          }
          onClose={() => setEditingPlayer(null)}
          onToggleCaptain={() => handleToggleCaptain(editingPlayer.player.id, editingPlayer.team)}
          onToggleWicketkeeper={() =>
            handleToggleWicketkeeper(editingPlayer.player.id, editingPlayer.team)
          }
          onReplace={() => {
            handleReplaceClick(editingPlayer.player, editingPlayer.team);
            setEditingPlayer(null);
          }}
          onRemove={() => handleRemovePlayer(editingPlayer.player.id, editingPlayer.team)}
          onAddToSquad={
            editingPlayer.player.guest
              ? () => {
                  showToast("Guest to Squad feature coming soon");
                  setEditingPlayer(null);
                }
              : undefined
          }
        />
      )}

      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl max-w-md pointer-events-auto">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✓</span>
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSheet;
