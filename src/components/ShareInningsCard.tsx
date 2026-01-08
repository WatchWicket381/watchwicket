import React from "react";
import { MatchState } from "../matchTypes";
import { getBowlerStats } from "../engine/playerStats";
import watchwicketLogo from "../assets/file_00000000711072438e9d72dabae9eda2.png";
import { formatPlayerName } from "../utils/nameFormatter";

interface Props {
  state: MatchState;
  inningsIndex?: number;
}

function ballsToOvers(balls: number): string {
  const o = Math.floor(balls / 6);
  const b = balls % 6;
  return `${o}.${b}`;
}

const ShareInningsCard: React.FC<Props> = ({ state, inningsIndex }) => {
  const innings = state.innings[inningsIndex ?? state.currentInnings];
  if (!innings) return null;

  const battingTeamName = innings.battingTeam === "A" ? state.teamAName : state.teamBName;
  const bowlingTeamName = innings.battingTeam === "A" ? state.teamBName : state.teamAName;
  const battingPlayers = innings.battingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
  const bowlingPlayers = innings.battingTeam === "A" ? state.teamBPlayers : state.teamAPlayers;

  // Get top batters
  const topBatters = battingPlayers
    .filter(p => p.balls > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 2);

  // Get top bowlers
  const bowlerStatsMap = getBowlerStats(innings, bowlingPlayers);
  const topBowlers = Array.from(bowlerStatsMap.values())
    .filter(b => b.balls > 0)
    .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
    .slice(0, 2);

  const crr = innings.totalBalls > 0 ? innings.totalRuns / (innings.totalBalls / 6) : 0;
  const totalExtras = innings.extras.wides + innings.extras.noBalls + innings.extras.byes + innings.extras.legByes;

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-gradient-to-br from-green-900 via-gray-900 to-green-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <img
          src={watchwicketLogo}
          alt="WatchWicket"
          className="w-[400px] h-auto"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-6 text-center border-b-2 border-yellow-500 pb-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img
              src={watchwicketLogo}
              alt="WatchWicket"
              className="w-12 h-12 object-contain"
            />
            <h3 className="text-base uppercase tracking-widest text-gray-300 font-bold">
              WatchWicket ScoreBox
            </h3>
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{state.format} Match</h1>
          <p className="text-lg text-gray-300">{state.teamAName} vs {state.teamBName}</p>
        </div>

        {/* Main Score */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 mb-6 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-100 mb-3">{battingTeamName}</h2>
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-7xl font-black text-white">{innings.totalRuns}</span>
              <div className="text-left">
                <div className="text-4xl font-bold text-green-200">/{innings.wickets}</div>
                <div className="text-xl text-green-200">({ballsToOvers(innings.totalBalls)})</div>
              </div>
            </div>
            <div className="flex justify-center gap-6 text-sm text-green-100">
              <div>
                <span className="opacity-75">RR:</span> <span className="font-bold">{crr.toFixed(2)}</span>
              </div>
              {innings.oversLimit && (
                <div>
                  <span className="opacity-75">Overs:</span> <span className="font-bold">{ballsToOvers(innings.totalBalls)}/{innings.oversLimit}</span>
                </div>
              )}
              <div>
                <span className="opacity-75">Extras:</span> <span className="font-bold">{totalExtras}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Batters */}
        {topBatters.length > 0 && (
          <div className="bg-gray-800 bg-opacity-70 rounded-lg p-5 mb-4 shadow-md">
            <h3 className="text-yellow-400 font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>🏏</span> Top Batters
            </h3>
            <div className="space-y-2">
              {topBatters.map((batter) => (
                <div key={batter.id} className="flex items-center justify-between bg-gray-900 bg-opacity-50 rounded-lg p-3">
                  <div className="flex-1">
                    <p className="font-bold text-white text-lg">{formatPlayerName(batter.name)}</p>
                    <p className="text-xs text-gray-400">
                      {batter.dismissal || "Not Out"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">{batter.runs}<span className="text-sm text-gray-400">({batter.balls})</span></p>
                    <p className="text-xs text-gray-400">
                      {batter.fours}×4, {batter.sixes}×6 • SR {batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(0) : "0"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Bowlers */}
        {topBowlers.length > 0 && (
          <div className="bg-gray-800 bg-opacity-70 rounded-lg p-5 mb-4 shadow-md">
            <h3 className="text-red-400 font-bold text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <span>⚡</span> Best Bowling ({bowlingTeamName})
            </h3>
            <div className="space-y-2">
              {topBowlers.map((bowler) => {
                const player = bowlingPlayers.find(p => p.id === bowler.playerId);
                const economy = bowler.balls > 0 ? (bowler.runsConceded / (bowler.balls / 6)).toFixed(2) : "0.00";
                return (
                  <div key={bowler.playerId} className="flex items-center justify-between bg-gray-900 bg-opacity-50 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="font-bold text-white text-lg">{player?.name ? formatPlayerName(player.name) : "Unknown"}</p>
                      <p className="text-xs text-gray-400">{ballsToOvers(bowler.balls)} overs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">
                        {bowler.wickets}<span className="text-lg text-gray-400">/{bowler.runsConceded}</span>
                      </p>
                      <p className="text-xs text-gray-400">Econ {economy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Scored with</p>
          <div className="flex items-center justify-center gap-2">
            <img
              src={watchwicketLogo}
              alt="WatchWicket"
              className="w-8 h-8 object-contain"
            />
            <p className="text-lg font-bold text-green-400">WatchWicket ScoreBox</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareInningsCard;
