import React, { useState, useMemo, useEffect } from "react";
import { MatchState, Player } from "../matchTypes";
import {
  getCurrentRunRate,
  getRequiredRunRate,
} from "../engine/MatchEngine";
import ShareInningsCard from "../components/ShareInningsCard";
import { shareOrDownloadInningsCard } from "../utils/renderInningsCard";
import Watermark from "../components/Watermark";
import { getBowlerStats } from "../engine/playerStats";
import ScoreComparisonGraph from "../components/ScoreComparisonGraph";
import { formatPlayerName } from "../utils/nameFormatter";

function ballsToOvers(balls: number) {
  const o = Math.floor(balls / 6);
  const b = balls % 6;
  return `${o}.${b}`;
}

export default function MatchSummary({ state, isPro = false, matchId }: { state: MatchState; isPro?: boolean; matchId?: string }) {
  const teamName = (t: "A" | "B") => (t === "A" ? state.teamAName : state.teamBName);
  const isIndoor = state.format === "INDOOR";
  const showProFeatures = isIndoor || isPro;

  const startedInnings = useMemo(() => {
    return state.innings.filter(inn =>
      inn.totalBalls > 0 || inn.totalRuns > 0 || inn.deliveries.length > 0
    );
  }, [state.innings]);

  const [selectedInnings, setSelectedInnings] = useState(0);
  const [showShareCard, setShowShareCard] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [liveLinkCopied, setLiveLinkCopied] = useState(false);

  useEffect(() => {
    if (selectedInnings >= startedInnings.length && startedInnings.length > 0) {
      setSelectedInnings(0);
    }
  }, [startedInnings.length, selectedInnings]);

  async function handleGenerateCard() {
    if (startedInnings.length === 0) return;

    setIsGenerating(true);
    setShareMessage(null);

    setTimeout(async () => {
      const innings = startedInnings[selectedInnings];
      const battingTeamName = innings.battingTeam === "A" ? state.teamAName : state.teamBName;

      const result = await shareOrDownloadInningsCard("innings-card-preview", battingTeamName);

      if (result.success) {
        if (result.method === "share") {
          setShareMessage("✓ Shared successfully!");
        } else if (result.method === "download") {
          setShareMessage("✓ Downloaded! Share on WhatsApp, Instagram, or TikTok.");
        }
      } else {
        setShareMessage("✕ Failed to generate. Please try again.");
      }

      setIsGenerating(false);
      setTimeout(() => setShareMessage(null), 5000);
    }, 100);
  }

  function handleShareLiveLink() {
    if (!matchId) {
      setShareMessage("✕ Cannot share: Match not saved yet");
      setTimeout(() => setShareMessage(null), 3000);
      return;
    }

    const liveLink = `${window.location.origin}/?match=${matchId}`;

    navigator.clipboard.writeText(liveLink).then(() => {
      setLiveLinkCopied(true);
      setShareMessage("✓ Live score link copied to clipboard!");
      setTimeout(() => {
        setLiveLinkCopied(false);
        setShareMessage(null);
      }, 4000);
    }).catch(() => {
      setShareMessage("✕ Failed to copy link. Please try again.");
      setTimeout(() => setShareMessage(null), 3000);
    });
  }

  // Compute match result
  let result: string | null = null;
  let winnerTeam: "A" | "B" | null = null;
  if (startedInnings.length >= 2) {
    const i1 = startedInnings[0];
    const i2 = startedInnings[1];
    if (i1.completed && i2.completed) {
      const aScore = i1.battingTeam === "A" ? i1.totalRuns : i2.totalRuns;
      const bScore = i1.battingTeam === "B" ? i1.totalRuns : i2.totalRuns;
      if (aScore > bScore) {
        result = `${teamName("A")} won by ${aScore - bScore} runs`;
        winnerTeam = "A";
      } else if (bScore > aScore) {
        const wicketsRemaining = (i2.battingTeam === "B" ? state.teamBPlayers : state.teamAPlayers).filter(p => !p.isOut).length;
        result = `${teamName("B")} won by ${wicketsRemaining} wickets`;
        winnerTeam = "B";
      } else {
        result = "Match tied";
      }
    }
  }

  const safeSelectedInnings = Math.min(selectedInnings, startedInnings.length - 1);
  const innings = startedInnings.length > 0 ? startedInnings[safeSelectedInnings] : null;

  if (!innings) {
    return (
      <div className="relative min-h-screen text-white p-6">
        <Watermark />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Match Summary</h1>
          <div className="ww-card p-8 text-center">
            <p className="text-gray-400 text-lg">No innings data available yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const battingTeamPlayers = innings.battingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
  const bowlingTeamPlayers = innings.battingTeam === "A" ? state.teamBPlayers : state.teamAPlayers;

  // Get top batters (sorted by runs)
  const batters = battingTeamPlayers
    .filter(p => p.balls > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 3);

  // Get top bowlers
  const bowlerStatsMap = getBowlerStats(innings, bowlingTeamPlayers);
  const bowlers = Array.from(bowlerStatsMap.values())
    .filter(b => b.balls > 0)
    .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
    .slice(0, 3);

  const crr = getCurrentRunRate(innings);
  const rrr = getRequiredRunRate(innings);

  return (
    <div className="relative min-h-screen text-white pb-24">
      <Watermark />
      <div className="relative z-10 max-w-5xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Match Summary</h1>
          <p className="text-gray-400 text-lg">{state.format} • {state.teamAName} vs {state.teamBName}</p>
        </div>

        {/* Match Result Banner */}
        {result && (
          <div className={`ww-card p-6 mb-6 border-2 ${winnerTeam === "A" ? "border-green-500" : winnerTeam === "B" ? "border-yellow-500" : "border-gray-500"}`}>
            <div className="text-center">
              <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">Match Result</p>
              <h2 className="text-3xl font-bold text-yellow-400">{result}</h2>
            </div>
          </div>
        )}

        {/* Innings Tabs */}
        {startedInnings.length > 1 && (
          <div className="flex gap-2 mb-6">
            {startedInnings.map((inn, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedInnings(idx)}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all btn-press ${
                  selectedInnings === idx
                    ? "bg-green-600 text-white shadow-lg"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {teamName(inn.battingTeam)} Innings
              </button>
            ))}
          </div>
        )}

        {/* Main Score Card */}
        <div className="ww-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-300 mb-2">
                {teamName(innings.battingTeam)}
              </h2>
              <div className="text-6xl font-black text-white mb-2">
                {innings.totalRuns}
                <span className="text-4xl text-gray-400">/{innings.wickets}</span>
              </div>
              <p className="text-xl text-gray-400">
                {ballsToOvers(innings.totalBalls)} overs
                {innings.oversLimit && ` / ${innings.oversLimit}`}
              </p>
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Run Rate</p>
                <p className="text-2xl font-bold text-green-400">{crr.toFixed(2)}</p>
              </div>
              {rrr !== null && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Required RR</p>
                  <p className="text-2xl font-bold text-yellow-400">{rrr.toFixed(2)}</p>
                </div>
              )}
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Extras</p>
                <p className="text-2xl font-bold text-gray-300">
                  {innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Batters */}
        {batters.length > 0 && (
          <div className="ww-card p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-yellow-400">🏏</span> Top Batters
            </h3>
            <div className="space-y-3">
              {batters.map((batter, idx) => (
                <div key={batter.id} className="flex items-center gap-4 bg-gray-800 rounded-lg p-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{formatPlayerName(batter.name)}</p>
                    <p className="text-sm text-gray-400">
                      {batter.dismissal ? batter.dismissal : "Not Out"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{batter.runs}</p>
                    <p className="text-sm text-gray-400">
                      ({batter.balls}) • {batter.fours}×4 {batter.sixes}×6 • SR {batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Bowlers */}
        {bowlers.length > 0 && (
          <div className="ww-card p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-400">⚡</span> Top Bowlers
            </h3>
            <div className="space-y-3">
              {bowlers.map((bowler, idx) => {
                // Try bowling team first, then all players
                let player = bowlingTeamPlayers.find(p => p.id === bowler.playerId);
                if (!player) {
                  player = [...state.teamAPlayers, ...state.teamBPlayers].find(p => p.id === bowler.playerId);
                }
                return (
                  <div key={bowler.playerId} className="flex items-center gap-4 bg-gray-800 rounded-lg p-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{formatPlayerName(player?.name || `Bowler ${idx + 1}`)}</p>
                      <p className="text-sm text-gray-400">
                        {ballsToOvers(bowler.balls)} overs
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-white">
                        {bowler.wickets}<span className="text-xl text-gray-400">/{bowler.runsConceded}</span>
                      </p>
                      <p className="text-sm text-gray-400">
                        Econ {bowler.balls > 0 ? ((bowler.runsConceded / (bowler.balls / 6)).toFixed(2)) : "0.00"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Batting Scorecard */}
        <div className="ww-card p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-green-400">📋</span> Batting Scorecard - {teamName(innings.battingTeam)}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="text-left p-3 min-w-[140px]">Batter</th>
                  <th className="text-right p-3 min-w-[50px]">R</th>
                  <th className="text-right p-3 min-w-[50px]">B</th>
                  <th className="text-right p-3 min-w-[45px]">4s</th>
                  <th className="text-right p-3 min-w-[45px]">6s</th>
                  <th className="text-right p-3 min-w-[60px]">SR</th>
                  {state.format === "INDOOR" && <th className="text-right p-3 min-w-[60px]">Outs</th>}
                </tr>
              </thead>
              <tbody>
                {battingTeamPlayers
                  .filter(p => p.balls > 0 || p.runs > 0 || p.isOut)
                  .map((batter, idx) => (
                  <tr key={batter.id} className="border-t border-gray-700 hover:bg-gray-800">
                    <td className="p-3 min-w-[140px]">
                      <div>
                        <span className="font-semibold block truncate">{formatPlayerName(batter.name)}</span>
                        {batter.dismissal && (
                          <div className="text-xs text-gray-400 mt-1 break-words">{batter.dismissal}</div>
                        )}
                      </div>
                    </td>
                    <td className="text-right p-3 font-semibold whitespace-nowrap">{batter.runs}</td>
                    <td className="text-right p-3 text-gray-400 whitespace-nowrap">{batter.balls}</td>
                    <td className="text-right p-3 text-gray-400 whitespace-nowrap">{batter.fours}</td>
                    <td className="text-right p-3 text-gray-400 whitespace-nowrap">{batter.sixes}</td>
                    <td className="text-right p-3 text-gray-400 whitespace-nowrap">
                      {batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0"}
                    </td>
                    {state.format === "INDOOR" && (
                      <td className="text-right p-3 text-red-400 whitespace-nowrap">
                        {(batter.outsCount || 0) > 0 ? `×${batter.outsCount}` : "-"}
                      </td>
                    )}
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-600 font-bold">
                  <td className="p-3">Extras</td>
                  <td className="text-right p-3" colSpan={state.format === "INDOOR" ? 6 : 5}>
                    {innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes}
                    <span className="text-xs text-gray-400 ml-2">
                      (W: {innings.extras.wides}, NB: {innings.extras.noBalls}, B: {innings.extras.byes}, LB: {innings.extras.legByes})
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-gray-700 font-bold text-lg">
                  <td className="p-3">Total</td>
                  <td className="text-right p-3">{innings.totalRuns}/{innings.wickets}</td>
                  <td className="text-right p-3 text-gray-400" colSpan={state.format === "INDOOR" ? 5 : 4}>
                    ({ballsToOvers(innings.totalBalls)} overs)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Full Bowling Scorecard */}
        <div className="ww-card p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-red-400">⚡</span> Bowling Figures - {teamName(innings.bowlingTeam)}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400">
                <tr>
                  <th className="text-left p-3 min-w-[140px]">Bowler</th>
                  <th className="text-right p-3 min-w-[50px]">O</th>
                  <th className="text-right p-3 min-w-[45px]">M</th>
                  <th className="text-right p-3 min-w-[50px]">R</th>
                  <th className="text-right p-3 min-w-[45px]">W</th>
                  <th className="text-right p-3 min-w-[65px]">Econ</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(bowlerStatsMap.values())
                  .filter(b => b.balls > 0)
                  .map((bowler) => {
                    let player = bowlingTeamPlayers.find(p => p.id === bowler.playerId);
                    if (!player) {
                      player = [...state.teamAPlayers, ...state.teamBPlayers].find(p => p.id === bowler.playerId);
                    }
                    return (
                      <tr key={bowler.playerId} className="border-t border-gray-700 hover:bg-gray-800">
                        <td className="p-3 font-semibold truncate min-w-[140px]">{player?.name ? formatPlayerName(player.name) : "Unknown Bowler"}</td>
                        <td className="text-right p-3 whitespace-nowrap">{ballsToOvers(bowler.balls)}</td>
                        <td className="text-right p-3 text-gray-400 whitespace-nowrap">{bowler.maidens}</td>
                        <td className="text-right p-3 text-gray-400 whitespace-nowrap">{bowler.runsConceded}</td>
                        <td className="text-right p-3 font-semibold text-red-400 whitespace-nowrap">{bowler.wickets}</td>
                        <td className="text-right p-3 text-gray-400 whitespace-nowrap">
                          {bowler.balls > 0 ? ((bowler.runsConceded / (bowler.balls / 6)).toFixed(2)) : "0.00"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Score Comparison Graph */}
        <div className="mb-6">
          <ScoreComparisonGraph state={state} />
        </div>

        {/* Share Innings Card */}
        {showProFeatures && (
          <div className="ww-card p-6 border-2 border-yellow-600">
            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
              <span className="text-yellow-400">📤</span> Share Innings Card
            </h3>
            <p className="text-gray-400 mb-4">
              Generate a professional scorecard graphic to share on social media.
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={handleShareLiveLink}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors btn-press flex items-center gap-2"
                disabled={!matchId}
              >
                <span>🔗</span>
                <span>{liveLinkCopied ? "Link Copied!" : "Share Live Link"}</span>
              </button>
              <button
                onClick={() => setShowShareCard(!showShareCard)}
                className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-lg font-semibold transition-colors btn-press"
                disabled={isGenerating}
              >
                {showShareCard ? "Hide Preview" : "Show Preview"}
              </button>
              {showShareCard && (
                <button
                  onClick={handleGenerateCard}
                  className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors btn-press"
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate & Share"}
                </button>
              )}
            </div>

            {shareMessage && (
              <div className={`px-4 py-3 rounded-lg ${shareMessage.startsWith("✓") ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}`}>
                {shareMessage}
              </div>
            )}

            {showShareCard && innings && (
              <div className="mt-6" id="innings-card-preview">
                <ShareInningsCard state={state} inningsIndex={state.innings.indexOf(innings)} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
