import React from "react";
import {
  addDelivery,
  setNextBatter,
  setNextBowler,
  endInnings,
  startNextInnings,
  getMatchResult,
  currentInning,
  getCurrentRunRate,
  getRequiredRunRate,
  getOversDisplay,
  getPartnership,
  getProjectedScore,
  undoLastDelivery,
  applyToss,
} from "../engine/MatchEngine";
import { MatchState, Player, DismissalType } from "../matchTypes";
import EnhancedScoringEffects, { EffectType } from "../components/EnhancedScoringEffects";
import UndoOverModal from "../components/UndoOverModal";
import Watermark from "../components/Watermark";
import { soundManager } from "../utils/soundManager";
import { playSixSound, playFourSound, playWicketSound } from "../utils/soundEffects";
import { playSixSfx, playFourSfx, playWicketSfx } from "../services/sfx";
import { useToast } from "../components/Toast";
import { formatPlayerName } from "../utils/nameFormatter";
import CurrentPlayersCard from "../components/broadcast/CurrentPlayersCard";
import ScoringKeypad from "../components/broadcast/ScoringKeypad";
import MatchStatsCard from "../components/broadcast/MatchStatsCard";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabaseClient";

interface Props {
  state: MatchState;
  setState: (s: MatchState) => void;
  isPro?: boolean;
  onMatchComplete?: () => void;
}

const LiveScore: React.FC<Props> = ({ state, setState, isPro = false, onMatchComplete }) => {
  const inning = currentInning(state);
  const isIndoor = state.format === "INDOOR";
  const showProFeatures = isIndoor || isPro;
  const { showToast } = useToast();
  const { user } = useAuth();
  const [commentaryText, setCommentaryText] = React.useState("");
  const [showDismissalModal, setShowDismissalModal] = React.useState(false);
  const [dismissalType, setDismissalType] = React.useState<DismissalType | "">("");
  const [selectedFielderId, setSelectedFielderId] = React.useState<string>("");
  const [runOutBatterId, setRunOutBatterId] = React.useState<string>("");
  const [battersCrossed, setBattersCrossed] = React.useState(false);
  const [tossWinner, setTossWinner] = React.useState<"A" | "B" | "">("");
  const [tossDecision, setTossDecision] = React.useState<"BAT" | "BOWL" | "">("");
  const [scoringEffect, setScoringEffect] = React.useState<EffectType | null>(null);
  const [enableVisualEffects, setEnableVisualEffects] = React.useState(true);

  const [pendingExtraType, setPendingExtraType] = React.useState<"wide" | "noball" | "bye" | "legbye" | null>(null);
  const [pendingRuns, setPendingRuns] = React.useState<number | null>(null);
  const [pendingWallBonus, setPendingWallBonus] = React.useState(false);

  const [lastOverSnapshot, setLastOverSnapshot] = React.useState<MatchState | null>(null);
  const [showUndoOverModal, setShowUndoOverModal] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      supabase
        .from('user_settings')
        .select('enable_visual_effects')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setEnableVisualEffects(data.enable_visual_effects ?? true);
          }
        });
    }
  }, [user]);

  // Helpers
  function getBattingTeam(): Player[] {
    return inning.battingTeam === "A"
      ? state.teamAPlayers
      : state.teamBPlayers;
  }

  function getBowlingTeam(): Player[] {
    return inning.bowlingTeam === "A"
      ? state.teamAPlayers
      : state.teamBPlayers;
  }

  const battingTeam = getBattingTeam();
  const bowlingTeam = getBowlingTeam();

  // Get current players
  const striker = battingTeam.find(p => p.id === state.strikerId);
  const nonStriker = battingTeam.find(p => p.id === state.nonStrikerId);
  const bowler = bowlingTeam.find(p => p.id === state.bowlerId);

  const bowlingTeamKeeperId = inning.bowlingTeam === "A" ? state.teamAKeeperId : state.teamBKeeperId;
  const bowlingTeamKeeper = bowlingTeam.find(p => p.id === bowlingTeamKeeperId);

  const isMatchCompleted = state.status === 'completed' || state.status === 'Completed';
  const canScore = Boolean(state.strikerId && state.nonStrikerId && state.bowlerId && !inning.completed && !isMatchCompleted);

  function getPlayerDisplayName(player: Player | undefined): string {
    if (!player) return "";
    let displayName = formatPlayerName(player.name);
    if (player.isCaptain && player.isKeeper) {
      displayName += " (C) (WK)";
    } else if (player.isCaptain) {
      displayName += " (C)";
    } else if (player.isKeeper) {
      displayName += " (WK)";
    }
    return displayName;
  }

  // Next batter dropdown
  function handleNextBatter(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const newState = setNextBatter(state, id);
    setState(newState);
  }

  // Next bowler dropdown (new over)
  function handleNextBowler(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const newState = setNextBowler(state, id);
    setState(newState);
  }

  function handleDismissal() {
    if (!dismissalType) return;

    playWicketSfx();
    playWicketSound();
    if (enableVisualEffects) {
      setScoringEffect("wicket");
    }

    const fielderPlayer = selectedFielderId ? bowlingTeam.find(p => p.id === selectedFielderId) : null;

    let dismissalText = "Wicket";

    if (dismissalType === "Bowled") {
      dismissalText = `b ${bowler?.name || "bowler"}`;
    } else if (dismissalType === "Caught") {
      if (fielderPlayer) {
        const isKeeper = fielderPlayer.id === bowlingTeamKeeperId;
        dismissalText = isKeeper
          ? `c †${fielderPlayer.name} b ${bowler?.name || "bowler"}`
          : `c ${fielderPlayer.name} b ${bowler?.name || "bowler"}`;
      } else {
        dismissalText = `c & b ${bowler?.name || "bowler"}`;
      }
    } else if (dismissalType === "LBW") {
      dismissalText = `lbw b ${bowler?.name || "bowler"}`;
    } else if (dismissalType === "Run Out") {
      dismissalText = fielderPlayer ? `run out (${fielderPlayer.name})` : "run out";
    } else if (dismissalType === "Stumped") {
      const keeper = bowlingTeamKeeper || fielderPlayer;
      dismissalText = keeper
        ? `st †${keeper.name} b ${bowler?.name || "bowler"}`
        : `st b ${bowler?.name || "bowler"}`;
    } else if (dismissalType === "Hit Wicket") {
      dismissalText = `hit wicket b ${bowler?.name || "bowler"}`;
    } else {
      dismissalText = dismissalType;
    }

    // For run-out, use the selected batter; otherwise use striker
    const dismissedBatterId = dismissalType === "Run Out" && runOutBatterId
      ? runOutBatterId
      : state.strikerId;

    if (inning.legalBalls % 6 === 5) {
      setLastOverSnapshot(JSON.parse(JSON.stringify(state)));
    ``} else if (inning.legalBalls % 6 === 0 && lastOverSnapshot) {
      setLastOverSnapshot(null);
    }

    const del = {
      runs: 0,
      isLegal: true,
      isWicket: true,
      batterId: dismissedBatterId || undefined,
      bowlerId: state.bowlerId || undefined,
      dismissal: dismissalText,
      dismissalType: dismissalType,
      fielderId: selectedFielderId || null,
      display: "W",
      extraType: null,
    };

    const newState = addDelivery(state, del);

    // For run-out: handle striker rotation based on crossing
    if (dismissalType === "Run Out" && battersCrossed) {
      // If batters crossed, swap the remaining batters
      const temp = newState.strikerId;
      newState.strikerId = newState.nonStrikerId;
      newState.nonStrikerId = temp;
    }

    // Auto-generate commentary
    const currentOvers = Math.floor(newState.innings[newState.currentInnings].totalBalls / 6);
    const currentBalls = newState.innings[newState.currentInnings].totalBalls % 6;

    let autoComment = `WICKET! ${dismissalText}`;
    if (striker?.isCaptain) {
      autoComment += " — Captain departs!";
    }

    newState.commentary.push({
      over: currentOvers,
      ball: currentBalls,
      text: autoComment,
      auto: true,
    });

    soundManager.play('wicket');

    setState(newState);
    setShowDismissalModal(false);
    setDismissalType("");
    setSelectedFielderId("");
    setRunOutBatterId("");
    setBattersCrossed(false);
  }

  function handleMatchComplete() {
    if (state.status === 'completed' || state.status === 'Completed') {
      return;
    }
    const newState = { ...state, status: 'completed' };
    setState(newState);
    if (onMatchComplete) {
      onMatchComplete();
    }
  }

  // Add delivery wrapper
  function score(params: {
    runs: number;
    legal: boolean;
    display: string;
    extraType?: "wide" | "noball" | "bye" | "legbye" | null;
    wallBonus?: boolean;
    runsForRotation?: number;
  }) {
    if (params.runs === 6 && !params.extraType) {
      playSixSound();
      if (enableVisualEffects) {
        setScoringEffect("six");
      }
    }

    if (params.runs === 4 && !params.extraType) {
      playFourSound();
      if (enableVisualEffects) {
        setScoringEffect("four");
      }
    }

    if (params.legal && inning.legalBalls % 6 === 5) {
      setLastOverSnapshot(JSON.parse(JSON.stringify(state)));
    } else if (params.legal && inning.legalBalls % 6 === 0 && lastOverSnapshot) {
      setLastOverSnapshot(null);
    }

    const del = {
  runs: params.runs,
  isLegal: params.legal,
  isWicket: false,
  batterId: state.strikerId || undefined,
  bowlerId: state.bowlerId || undefined,
  dismissal: null,
  display: params.display,
  extraType: params.extraType || null,

  // keep boolean safe
  wallBonus: params.wallBonus ?? undefined,

  // ✅ OPTION 1 FIX: forward rotation info
  runsForRotation: params.runsForRotation ??
    (params.wallBonus ? 1 : params.runs),
};


    const newState = addDelivery(state, del);

    // Auto-generate commentary for special events
    const currentOvers = Math.floor(newState.innings[newState.currentInnings].totalBalls / 6);
    const currentBalls = newState.innings[newState.currentInnings].totalBalls % 6;

    let autoComment = "";
    if (params.runs === 6 && !params.extraType) {
      autoComment = "SIX! What a shot!";
      if (striker?.isCaptain) {
        autoComment += " Captain leading from the front!";
      }
      soundManager.play('six');
    } else if (params.runs === 4 && !params.extraType) {
      autoComment = "FOUR! Beautiful boundary!";
      if (striker?.isCaptain) {
        autoComment += " Captain showing the way!";
      }
      soundManager.play('four');
    }

    if (autoComment) {
      newState.commentary.push({
        over: currentOvers,
        ball: currentBalls,
        text: autoComment,
        auto: true,
      });
    }

    setState(newState);
  }

  function clearPendingDelivery() {
    setPendingExtraType(null);
    setPendingRuns(null);
    setPendingWallBonus(false);
  }

  function confirmPendingDelivery() {
    const runs = pendingRuns !== null ? pendingRuns : 0;
    let totalRuns = runs;
    let isLegal = true;
    let display = String(runs);

    if (pendingExtraType === "noball") {
      totalRuns = 1 + runs;
      isLegal = false;
      display = runs > 0 ? `Nb+${runs}` : "Nb";
    } else if (pendingExtraType === "wide") {
      totalRuns = 1 + runs;
      isLegal = false;
      display = runs > 0 ? `Wd+${runs}` : "Wd";
    } else if (pendingExtraType === "bye") {
      isLegal = true;
      display = runs > 0 ? `B${runs}` : "B";
    } else if (pendingExtraType === "legbye") {
      isLegal = true;
      display = runs > 0 ? `Lb${runs}` : "Lb";
    } else if (pendingWallBonus) {
      totalRuns = runs + 2; // Wall bonus: player runs + wall adds 1 = 2 total runs
      isLegal = true;
      display = "W+1";
    } else if (runs === 0) {
      display = "0";
    }

    if (runs === 6 && !pendingExtraType) {
      playSixSfx();
    } else if (runs === 4 && !pendingExtraType) {
      playFourSfx();
    }

    score({
      runs: totalRuns,
      legal: isLegal,
      display,
      extraType: pendingExtraType,
      wallBonus: pendingWallBonus,
      runsForRotation: pendingWallBonus ? 1 : undefined,
    });

    clearPendingDelivery();
  }

  function addCommentary() {
    if (!commentaryText.trim()) return;

    const currentOvers = Math.floor(inning.legalBalls / 6);
    const currentBalls = inning.legalBalls % 6;

    setState({
      ...state,
      commentary: [
        ...state.commentary,
        {
          over: currentOvers,
          ball: currentBalls,
          text: commentaryText.trim(),
          auto: false,
        },
      ],
    });

    setCommentaryText("");
  }

  // Over display
  const overs = Math.floor(inning.totalBalls / 6);
  const balls = inning.totalBalls % 6;

  // Stats
  const crr = getCurrentRunRate(inning);
  const rrr = getRequiredRunRate(inning);
  const partnership = getPartnership(state);
  const projected = getProjectedScore(inning);

  const tossSet = state.toss?.winnerTeam && state.toss?.decision;
  const hasLegalBalls = inning.totalBalls > 0;

  function handleApplyToss() {
    if (!tossWinner || !tossDecision) return;
    const newState = { ...state };
    applyToss(newState, tossWinner, tossDecision);
    setState(newState);
    setTossWinner("");
    setTossDecision("");
  }

  const requiresFielder = dismissalType === "Caught" || dismissalType === "Run Out" || dismissalType === "Stumped";

  return (
    <div className="p-4 text-white relative livescore-broadcast">
      <Watermark />
      {/* Toss Setup Panel */}
      {!tossSet && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-bold mb-3">Match Setup - Toss</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Toss Winner:</label>
              <select
                value={tossWinner}
                onChange={(e) => setTossWinner(e.target.value as "A" | "B" | "")}
                className="bg-slate-700 px-3 py-2 rounded w-full"
              >
                <option value="">-- Select Team --</option>
                <option value="A">{state.teamAName}</option>
                <option value="B">{state.teamBName}</option>
              </select>
            </div>
            <div>
              <label className="text-sm block mb-1">Decision:</label>
              <select
                value={tossDecision}
                onChange={(e) => setTossDecision(e.target.value as "BAT" | "BOWL" | "")}
                className="bg-slate-700 px-3 py-2 rounded w-full"
              >
                <option value="">-- Select Decision --</option>
                <option value="BAT">Bat First</option>
                <option value="BOWL">Bowl First</option>
              </select>
            </div>
            <button
              onClick={handleApplyToss}
              disabled={!tossWinner || !tossDecision}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded font-semibold w-full"
            >
              Apply Toss
            </button>
          </div>
        </div>
      )}

      {/* Warning when toss not set */}
      {!tossSet && hasLegalBalls && (
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3 mb-4 text-yellow-200">
          Set toss winner and decision to start the match.
        </div>
      )}

      {/* Scoring guard warning */}
      {!canScore && !inning.completed && (
        <div className="bg-orange-900 border border-orange-700 rounded-lg p-3 mb-4 text-orange-200">
          {!state.strikerId && "Select striker to continue scoring."}
          {!state.nonStrikerId && state.strikerId && "Select non-striker to continue scoring."}
          {!state.bowlerId && state.strikerId && state.nonStrikerId && "Select bowler to continue scoring."}
        </div>
      )}

      {/* Innings Complete Banner */}
      {inning.completed && (
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
          <h3 className="text-xl font-bold text-blue-200 mb-2">Innings Complete!</h3>
          <div className="text-blue-300 mb-3">
            {inning.battingTeam === "A" ? state.teamAName : state.teamBName} scored {inning.totalRuns}/{inning.wickets} in {getOversDisplay(inning.totalBalls)} overs
          </div>
          {state.currentInnings === 0 && state.inningsCount === 2 && (
            <button
              onClick={() => {
                const newState = { ...state };
                startNextInnings(newState);
                setState(newState);
              }}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold w-full"
            >
              Start 2nd Innings
            </button>
          )}
          {state.currentInnings === 1 && (() => {
            const result = getMatchResult(state);
            const isCompleted = state.status === 'completed' || state.status === 'Completed';
            if (result) {
              if (isCompleted) {
                return (
                  <div>
                    <div className="text-lg font-bold text-green-300 mb-3">{result}</div>
                    <div className="bg-gray-700 px-6 py-3 rounded-lg font-bold w-full text-center text-gray-400">
                      Match Completed (View Only)
                    </div>
                  </div>
                );
              }
              return (
                <div>
                  <div className="text-lg font-bold text-green-300 mb-3">{result}</div>
                  <button
                    onClick={handleMatchComplete}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold w-full"
                  >
                    End Match
                  </button>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Main Broadcast Layout: 2-Column Grid */}
      <div className="broadcast-main-grid">
        {/* Left Column: Match Info */}
        <div className="space-y-4">
          {/* Current Players */}
          <CurrentPlayersCard
            striker={striker}
            nonStriker={nonStriker}
            bowler={bowler}
            onChangeStriker={() => setState({ ...state, strikerId: null })}
            onChangeNonStriker={() => setState({ ...state, nonStrikerId: null })}
            onChangeBowler={() => setState({ ...state, bowlerId: null })}
          />

          {/* Match Stats */}
          <MatchStatsCard
            inning={inning}
            showProFeatures={showProFeatures}
            partnership={partnership}
            projected={projected}
            format={state.format}
          />
        </div>

        {/* Right Column: Scoring Controls */}
        <div className="space-y-4">
          <ScoringKeypad
            canScore={canScore}
            tossSet={!!tossSet}
            isIndoor={isIndoor}
            pendingRuns={pendingRuns}
            pendingExtraType={pendingExtraType}
            pendingWallBonus={pendingWallBonus}
            onRunClick={(runs) => {
              // If an extra is selected, set pending runs for confirmation
              if (pendingExtraType !== null) {
                setPendingRuns(runs);
                setPendingWallBonus(false);
                return;
              }

              // Direct scoring for normal runs (no confirmation needed)
              if (inning.legalBalls % 6 === 5) {
                setLastOverSnapshot(JSON.parse(JSON.stringify(state)));
              } else if (inning.legalBalls % 6 === 0 && lastOverSnapshot) {
                setLastOverSnapshot(null);
              }

              if (runs === 6) {
                playSixSfx();
              } else if (runs === 4) {
                playFourSfx();
              }

              score({
                runs: runs,
                legal: true,
                display: runs === 0 ? '0' : String(runs),
                extraType: null,
                wallBonus: false
              });
            }}
            onWallBonusClick={() => {
              // Direct scoring for W+1 (no confirmation needed)
              if (inning.legalBalls % 6 === 5) {
                setLastOverSnapshot(JSON.parse(JSON.stringify(state)));
              } else if (inning.legalBalls % 6 === 0 && lastOverSnapshot) {
                setLastOverSnapshot(null);
              }

              score({
                runs: 2,
                legal: true,
                display: 'W+1',
                extraType: null,
                wallBonus: true,
                runsForRotation: 1
              });
            }}
            onWicketClick={() => setShowDismissalModal(true)}
            onExtraClick={(type) => setPendingExtraType(pendingExtraType === type ? null : type)}
          />

          {/* Current Ball Display - Only for Extras */}
          {pendingExtraType !== null && (
            <div className="broadcast-glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  Extra Delivery
                </h3>
                <button
                  onClick={clearPendingDelivery}
                  className="text-slate-400 hover:text-white text-xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Extra Type:</span>
                  <span className="font-bold text-white capitalize">
                    {pendingExtraType === "noball" ? "No Ball" : pendingExtraType === "legbye" ? "Leg Bye" : pendingExtraType}
                  </span>
                </div>
                {pendingRuns !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Additional Runs:</span>
                    <span className="font-bold text-white">{pendingRuns}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Total Runs:</span>
                    <span className="font-bold text-emerald-400 text-lg">
                      {(pendingExtraType === "noball" || pendingExtraType === "wide")
                        ? (1 + (pendingRuns || 0))
                        : (pendingRuns !== null ? pendingRuns : 0)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={confirmPendingDelivery}
                className="w-full bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-6 py-3 rounded-xl font-bold mt-4 shadow-lg transition-all"
              >
                Confirm Extra
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="broadcast-glass-card rounded-xl p-4">
            <div className="grid grid-cols-2 gap-3">
              {showProFeatures ? (
                <button
                  className="bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-800 p-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  onClick={() => {
                    if (inning.deliveries.length === 0) return;
                    const lastDelivery = inning.deliveries[inning.deliveries.length - 1];
                    const overJustCompleted = inning.legalBalls % 6 === 0 && lastDelivery.isLegal && lastOverSnapshot;
                    if (overJustCompleted) {
                      setShowUndoOverModal(true);
                    } else {
                      const newState = undoLastDelivery(state);
                      setState(newState);
                    }
                  }}
                  disabled={inning.deliveries.length === 0 || inning.completed}
                >
                  Undo Last Ball
                </button>
              ) : (
                <button
                  className="bg-gray-700/80 p-3 rounded-xl font-semibold flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
                  disabled
                  title="Available in WatchWicket Pro"
                >
                  <span>🔒</span>
                  <span>Undo</span>
                </button>
              )}
              <button
                className="bg-gradient-to-br from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-800 p-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                onClick={() => {
                  const newState = { ...state };
                  endInnings(newState);
                  setState(newState);
                }}
                disabled={inning.totalBalls === 0 || inning.completed}
              >
                End Innings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bowler selector (only when needed) */}
      {!state.bowlerId && (
        <div className="mt-4">
          <label className="text-sm block mb-1">
            Select Bowler:
          </label>
          <select
            onChange={handleNextBowler}
            className="bg-gray-700 p-2 rounded w-full"
          >
            <option value="">-- Choose Bowler --</option>
            {bowlingTeam.map((p) => (
              <option value={p.id} key={p.id}>
                {getPlayerDisplayName(p)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Batter selector if missing */}
      {(!state.strikerId || !state.nonStrikerId) && (
        <div className="mt-4">
          <label className="text-sm block mb-1">
            Select Next Batter:
          </label>
          <select
            onChange={handleNextBatter}
            className="bg-gray-700 p-2 rounded w-full"
          >
            <option value="">-- Choose Batter --</option>
            {isIndoor ? (
              <>
                {/* In Indoor Mode, ALL players can bat (except current striker/non-striker) */}
                {/* Players can bat multiple times after being dismissed */}
                {(() => {
                  // Available batters: everyone except current striker and non-striker
                  const availableBatters = battingTeam.filter(p =>
                    p.id !== state.strikerId &&
                    p.id !== state.nonStrikerId
                  );

                  // Group by status for better UX
                  const yetToBat = availableBatters.filter(p => (p.outsCount || 0) === 0 && !p.isOut);
                  const canBatAgain = availableBatters.filter(p => (p.outsCount || 0) > 0 && !p.isOut);
                  const currentlyOut = availableBatters.filter(p => p.isOut);

                  return (
                    <>
                      {yetToBat.length > 0 && (
                        <>
                          <option disabled style={{ fontWeight: 'bold', backgroundColor: '#374151' }}>
                            ─── Yet to Bat ───
                          </option>
                          {yetToBat.map(p => (
                            <option value={p.id} key={p.id}>
                              {getPlayerDisplayName(p)}
                            </option>
                          ))}
                        </>
                      )}
                      {canBatAgain.length > 0 && (
                        <>
                          <option disabled style={{ fontWeight: 'bold', backgroundColor: '#374151' }}>
                            ─── Can Bat Again ───
                          </option>
                          {canBatAgain.map(p => (
                            <option value={p.id} key={p.id}>
                              {getPlayerDisplayName(p)} (out ×{p.outsCount})
                            </option>
                          ))}
                        </>
                      )}
                      {currentlyOut.length > 0 && (
                        <>
                          <option disabled style={{ fontWeight: 'bold', backgroundColor: '#374151' }}>
                            ─── Currently Out ───
                          </option>
                          {currentlyOut.map(p => (
                            <option value={p.id} key={p.id}>
                              {getPlayerDisplayName(p)} (out ×{p.outsCount || 1})
                            </option>
                          ))}
                        </>
                      )}
                      {availableBatters.length === 0 && (
                        <option disabled>No batters available</option>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              battingTeam
                .filter((p) => !p.isOut && p.id !== state.strikerId && p.id !== state.nonStrikerId)
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {getPlayerDisplayName(p)}
                  </option>
                ))
            )}
          </select>
        </div>
      )}

      {/* Pending Delivery Display - Only for Extras */}
      {pendingExtraType !== null && (
        <div className="bg-blue-900 border-2 border-blue-600 rounded-lg p-4 mt-4 animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-blue-200">Extra Delivery</h3>
            <button
              onClick={clearPendingDelivery}
              className="text-blue-300 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-300">Extra Type:</span>
              <span className="font-bold text-white capitalize">{pendingExtraType === "noball" ? "No Ball" : pendingExtraType === "legbye" ? "Leg Bye" : pendingExtraType}</span>
            </div>
            {pendingRuns !== null && (
              <div className="flex items-center gap-2">
                <span className="text-blue-300">Additional Runs:</span>
                <span className="font-bold text-white">{pendingRuns}</span>
              </div>
            )}
            <div className="pt-2 border-t border-blue-700">
              <div className="flex items-center gap-2">
                <span className="text-blue-300">Total Runs:</span>
                <span className="font-bold text-white text-lg">
                  {(pendingExtraType === "noball" || pendingExtraType === "wide")
                    ? (1 + (pendingRuns || 0))
                    : (pendingRuns !== null ? pendingRuns : 0)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={confirmPendingDelivery}
            className="w-full bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-bold mt-4"
          >
            Confirm Extra
          </button>
        </div>
      )}

      {/* Commentary Input */}
      <div className="mt-6 bg-gray-800 rounded p-4">
        <h3 className="text-lg font-semibold mb-2">Add Commentary</h3>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-700 px-3 py-2 rounded text-white"
            placeholder="Enter commentary for this ball..."
            value={commentaryText}
            onChange={(e) => setCommentaryText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCommentary();
            }}
          />
          <button
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold"
            onClick={addCommentary}
          >
            Add
          </button>
        </div>
      </div>

      {/* Recent Commentary */}
      {state.commentary.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded p-4">
          <h3 className="text-lg font-semibold mb-3">Recent Commentary</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...state.commentary].reverse().slice(0, 20).map((comment, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-sm ${
                  comment.auto ? "bg-gray-700" : "bg-slate-700"
                }`}
              >
                <span className="text-gray-400 font-semibold">
                  Over {comment.over}.{comment.ball}
                </span>
                <span className="mx-2">–</span>
                <span className="text-white">{comment.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dismissal Modal */}
      {showDismissalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Wicket - How was the batter out?</h3>

            {!dismissalType ? (
              <div className="space-y-2">
                <button
                  className="w-full bg-red-700 hover:bg-red-800 p-3 rounded font-semibold"
                  onClick={() => setDismissalType("Bowled")}
                >
                  Bowled
                </button>
                <button
                  className="w-full bg-red-700 hover:bg-red-800 p-3 rounded font-semibold"
                  onClick={() => setDismissalType("Caught")}
                >
                  Caught
                </button>
                <button
                  className="w-full bg-red-700 hover:bg-red-800 p-3 rounded font-semibold"
                  onClick={() => setDismissalType("LBW")}
                >
                  LBW
                </button>
                <button
                  className="w-full bg-orange-700 hover:bg-orange-800 p-3 rounded font-semibold"
                  onClick={() => setDismissalType("Run Out")}
                >
                  Run Out
                </button>
                <button
                  className="w-full bg-purple-700 hover:bg-purple-800 p-3 rounded font-semibold"
                  onClick={() => {
                    setDismissalType("Stumped");
                    if (bowlingTeamKeeperId) {
                      setSelectedFielderId(bowlingTeamKeeperId);
                    }
                  }}
                >
                  Stumped
                </button>
                <button
                  className="w-full bg-red-700 hover:bg-red-800 p-3 rounded font-semibold"
                  onClick={() => setDismissalType("Hit Wicket")}
                >
                  Hit Wicket
                </button>
                <button
                  className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded font-semibold"
                  onClick={() => setDismissalType("Other")}
                >
                  Other
                </button>
                <button
                  className="w-full bg-gray-700 hover:bg-gray-600 p-3 rounded mt-2"
                  onClick={() => {
                    setShowDismissalModal(false);
                    setDismissalType("");
                    setSelectedFielderId("");
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-sm text-gray-400">Dismissal Type:</div>
                  <div className="text-lg font-semibold">{dismissalType}</div>
                </div>

                {dismissalType === "Run Out" && (
                  <>
                    <div>
                      <label className="text-sm block mb-2">Which batter is out?</label>
                      <select
                        value={runOutBatterId}
                        onChange={(e) => setRunOutBatterId(e.target.value)}
                        className="bg-gray-700 p-2 rounded w-full"
                      >
                        <option value="">-- Select Batter --</option>
                        <option value={state.strikerId || ""}>
                          Striker: {striker ? getPlayerDisplayName(striker) : "Not selected"}
                        </option>
                        <option value={state.nonStrikerId || ""}>
                          Non-Striker: {nonStriker ? getPlayerDisplayName(nonStriker) : "Not selected"}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={battersCrossed}
                          onChange={(e) => setBattersCrossed(e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm">Batters crossed</span>
                      </label>
                    </div>
                    <div>
                      <label className="text-sm block mb-2">Fielder (optional):</label>
                      <select
                        value={selectedFielderId}
                        onChange={(e) => setSelectedFielderId(e.target.value)}
                        className="bg-gray-700 p-2 rounded w-full"
                      >
                        <option value="">-- Select Fielder --</option>
                        {bowlingTeam.map((p) => (
                          <option value={p.id} key={p.id}>
                            {getPlayerDisplayName(p)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {requiresFielder && dismissalType !== "Run Out" && (
                  <div>
                    <label className="text-sm block mb-2">
                      {dismissalType === "Stumped" ? "Wicket Keeper:" : "Fielder:"}
                    </label>
                    <select
                      value={selectedFielderId}
                      onChange={(e) => setSelectedFielderId(e.target.value)}
                      className="bg-gray-700 p-2 rounded w-full"
                    >
                      <option value="">-- Select {dismissalType === "Stumped" ? "Keeper" : "Fielder"} --</option>
                      {bowlingTeam.map((p) => (
                        <option value={p.id} key={p.id}>
                          {getPlayerDisplayName(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-green-700 hover:bg-green-800 p-3 rounded font-semibold"
                    onClick={handleDismissal}
                  >
                    Save
                  </button>
                  <button
                    className="flex-1 bg-gray-700 hover:bg-gray-600 p-3 rounded"
                    onClick={() => {
                      setDismissalType("");
                      setSelectedFielderId("");
                      setRunOutBatterId("");
                      setBattersCrossed(false);
                    }}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoring Effect Overlay */}
      {scoringEffect && (
        <EnhancedScoringEffects
          type={scoringEffect}
          onComplete={() => setScoringEffect(null)}
          batterHandedness="RHB"
        />
      )}

      {/* Undo Over Confirmation Modal */}
      <UndoOverModal
        show={showUndoOverModal}
        onConfirm={() => {
          if (lastOverSnapshot) {
            setState(lastOverSnapshot);
            setLastOverSnapshot(null);
          }
          setShowUndoOverModal(false);
        }}
        onCancel={() => {
          setShowUndoOverModal(false);
        }}
      />

      <style>{`
        /* Broadcast theme styling for LiveScore */
        .livescore-broadcast .bg-blue-900 {
          background: rgba(20, 40, 60, 0.4) !important;
          border: 1px solid rgba(59, 130, 246, 0.2) !important;
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .livescore-broadcast .bg-yellow-900 {
          background: rgba(60, 50, 20, 0.4) !important;
          border: 1px solid rgba(234, 179, 8, 0.2) !important;
          backdrop-filter: blur(16px);
        }

        .livescore-broadcast .bg-orange-900 {
          background: rgba(60, 40, 20, 0.4) !important;
          border: 1px solid rgba(249, 115, 22, 0.2) !important;
          backdrop-filter: blur(16px);
        }

        .livescore-broadcast .bg-gray-800 {
          background: rgba(15, 25, 20, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .livescore-broadcast .bg-gray-900 {
          background: rgba(10, 20, 15, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
        }

        .livescore-broadcast .bg-slate-700 {
          background: rgba(51, 65, 85, 0.6) !important;
          border: 1px solid rgba(148, 163, 184, 0.1);
        }

        .livescore-broadcast .bg-gray-700 {
          background: rgba(55, 65, 81, 0.6) !important;
          border: 1px solid rgba(156, 163, 175, 0.1);
        }

        /* Enhanced scoring buttons */
        .livescore-broadcast button[class*="bg-green-7"] {
          background: linear-gradient(135deg, rgba(22, 163, 74, 0.9), rgba(21, 128, 61, 0.9)) !important;
          border: 1px solid rgba(34, 197, 94, 0.3);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
          transition: all 0.15s ease;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .livescore-broadcast button[class*="bg-green-7"]:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(22, 163, 74, 1), rgba(21, 128, 61, 1)) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
        }

        .livescore-broadcast button[class*="bg-green-7"]:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.4);
        }

        .livescore-broadcast button[class*="bg-gray-6"] {
          background: rgba(75, 85, 99, 0.8) !important;
          border: 1px solid rgba(156, 163, 175, 0.2);
          font-weight: 700;
        }

        .livescore-broadcast button[class*="bg-gray-6"]:hover:not(:disabled) {
          background: rgba(75, 85, 99, 1) !important;
          border-color: rgba(156, 163, 175, 0.3);
        }

        .livescore-broadcast button[class*="bg-red-7"] {
          background: linear-gradient(135deg, rgba(185, 28, 28, 0.9), rgba(153, 27, 27, 0.9)) !important;
          border: 1px solid rgba(239, 68, 68, 0.3);
          box-shadow: 0 4px 12px rgba(185, 28, 28, 0.3);
          font-weight: 700;
        }

        .livescore-broadcast button[class*="bg-red-7"]:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(185, 28, 28, 1), rgba(153, 27, 27, 1)) !important;
          box-shadow: 0 6px 16px rgba(185, 28, 28, 0.4);
          transform: translateY(-1px);
        }

        .livescore-broadcast button[class*="bg-blue-7"] {
          background: linear-gradient(135deg, rgba(29, 78, 216, 0.9), rgba(30, 64, 175, 0.9)) !important;
          border: 1px solid rgba(59, 130, 246, 0.3);
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.3);
          font-weight: 600;
        }

        .livescore-broadcast button[class*="bg-blue-7"]:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(29, 78, 216, 1), rgba(30, 64, 175, 1)) !important;
          box-shadow: 0 6px 16px rgba(29, 78, 216, 0.4);
        }

        .livescore-broadcast button[class*="bg-yellow-6"] {
          background: linear-gradient(135deg, rgba(202, 138, 4, 0.9), rgba(161, 98, 7, 0.9)) !important;
          border: 1px solid rgba(234, 179, 8, 0.3);
          box-shadow: 0 4px 12px rgba(202, 138, 4, 0.3);
          font-weight: 700;
        }

        .livescore-broadcast button[class*="bg-yellow-6"]:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(202, 138, 4, 1), rgba(161, 98, 7, 1)) !important;
          box-shadow: 0 6px 16px rgba(202, 138, 4, 0.4);
        }

        .livescore-broadcast button[class*="bg-orange-6"] {
          background: linear-gradient(135deg, rgba(234, 88, 12, 0.9), rgba(194, 65, 12, 0.9)) !important;
          border: 1px solid rgba(249, 115, 22, 0.3);
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
          font-weight: 600;
        }

        .livescore-broadcast button[class*="bg-orange-6"]:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(234, 88, 12, 1), rgba(194, 65, 12, 1)) !important;
          box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
        }

        .livescore-broadcast button[class*="bg-purple-7"] {
          background: linear-gradient(135deg, rgba(126, 34, 206, 0.9), rgba(107, 33, 168, 0.9)) !important;
          border: 1px solid rgba(168, 85, 247, 0.3);
          box-shadow: 0 4px 12px rgba(126, 34, 206, 0.3);
          font-weight: 600;
        }

        .livescore-broadcast button[class*="bg-purple-7"]:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(126, 34, 206, 1), rgba(107, 33, 168, 1)) !important;
          box-shadow: 0 6px 16px rgba(126, 34, 206, 0.4);
        }

        /* Scoring button grid - larger tap targets */
        .livescore-broadcast .grid.grid-cols-4 button,
        .livescore-broadcast .grid.grid-cols-3 button {
          min-height: 3.5rem;
          font-size: 1.25rem;
          border-radius: 0.75rem;
        }

        /* Current ball panel */
        .livescore-broadcast .bg-gradient-to-r.from-blue-800 {
          background: linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(29, 78, 216, 0.6)) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
          box-shadow: 0 8px 24px rgba(29, 78, 216, 0.2);
        }

        /* Inputs */
        .livescore-broadcast input,
        .livescore-broadcast select {
          background: rgba(51, 65, 85, 0.7) !important;
          border: 1px solid rgba(148, 163, 184, 0.2);
          backdrop-filter: blur(8px);
        }

        .livescore-broadcast input:focus,
        .livescore-broadcast select:focus {
          border-color: rgba(16, 185, 129, 0.5);
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        /* Modal backgrounds */
        .livescore-broadcast .fixed .bg-gray-800 {
          background: rgba(20, 30, 25, 0.98) !important;
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Ensure text readability */
        .livescore-broadcast h2,
        .livescore-broadcast h3,
        .livescore-broadcast .text-white {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        /* Active/selected state for scoring buttons */
        .livescore-broadcast button.ring-2.ring-blue-400 {
          border-color: rgba(96, 165, 250, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2), 0 4px 12px rgba(59, 130, 246, 0.4) !important;
        }

        /* Disabled button styling */
        .livescore-broadcast button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.3);
        }

        /* Improve commentary section */
        .livescore-broadcast .space-y-2 > div {
          border-left: 2px solid rgba(16, 185, 129, 0.3);
          transition: all 0.2s ease;
        }

        .livescore-broadcast .space-y-2 > div:hover {
          border-left-color: rgba(16, 185, 129, 0.6);
          background: rgba(15, 25, 20, 0.6) !important;
        }

        /* Broadcast Layout Grid */
        .broadcast-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-top: 1rem;
        }

        @media (min-width: 1024px) {
          .broadcast-main-grid {
            grid-template-columns: 2fr 3fr;
            gap: 1.5rem;
          }
        }

        .broadcast-glass-card {
          background: rgba(15, 25, 20, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        /* Mobile optimization - controls at top */
        @media (max-width: 1023px) {
          .broadcast-main-grid {
            display: flex;
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );
};

export default LiveScore;
