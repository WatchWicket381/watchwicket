import React from 'react';
import { MatchState, Inning } from '../matchTypes';

interface Props {
  state: MatchState;
}

export interface WormDataPoint {
  over: number;
  runs: number;
  wickets: number;
}

export interface WormData {
  teamA: WormDataPoint[];
  teamB: WormDataPoint[];
}

export function buildWormData(state: MatchState): WormData {
  const teamA: WormDataPoint[] = [];
  const teamB: WormDataPoint[] = [];

  if (state.innings.length === 0) {
    return { teamA, teamB };
  }

  const innings1 = state.innings[0];
  teamA.push(...getCumulativeDataPoints(innings1));

  if (state.innings.length > 1) {
    const innings2 = state.innings[1];
    teamB.push(...getCumulativeDataPoints(innings2));
  }

  return { teamA, teamB };
}

function getCumulativeDataPoints(inning: Inning): WormDataPoint[] {
  const result: WormDataPoint[] = [{ over: 0, runs: 0, wickets: 0 }];

  let totalRuns = 0;
  let totalWickets = 0;
  let legalBalls = 0;

  for (const delivery of inning.deliveries) {
    totalRuns += delivery.runs;

    if (delivery.isLegal) {
      legalBalls++;

      if (delivery.isWicket) {
        totalWickets++;
      }

      const completedOvers = Math.floor(legalBalls / 6);
      const ballsInCurrentOver = legalBalls % 6;

      if (ballsInCurrentOver === 0) {
        result.push({
          over: completedOvers,
          runs: totalRuns,
          wickets: totalWickets,
        });
      }
    }
  }

  if (legalBalls > 0 && legalBalls % 6 !== 0) {
    const currentOver = Math.ceil(legalBalls / 6);
    result.push({
      over: currentOver,
      runs: totalRuns,
      wickets: totalWickets,
    });
  }

  return result;
}

const ScoreComparisonGraph: React.FC<Props> = ({ state }) => {
  if (state.innings.length === 0) return null;

  const wormData = buildWormData(state);
  const { teamA: team1Data, teamB: team2Data } = wormData;

  if (team1Data.length === 0) return null;

  const innings1 = state.innings[0];
  const innings2 = state.innings.length > 1 ? state.innings[1] : null;

  const team1Name = innings1.battingTeam === 'A' ? state.teamAName : state.teamBName;
  const team2Name = innings2 ? (innings2.battingTeam === 'A' ? state.teamAName : state.teamBName) : '';

  const maxOvers = Math.max(
    team1Data.length > 0 ? team1Data[team1Data.length - 1].over : 0,
    team2Data.length > 0 ? team2Data[team2Data.length - 1].over : 0,
    state.oversLimit || 5,
    5
  );

  const maxRuns = Math.max(
    team1Data.length > 0 ? team1Data[team1Data.length - 1].runs : 0,
    team2Data.length > 0 ? team2Data[team2Data.length - 1].runs : 0,
    50
  );

  const getXPosition = (over: number) => {
    return (over / maxOvers) * 100;
  };

  const getYPosition = (runs: number) => {
    return 100 - (runs / maxRuns) * 100;
  };

  const createPath = (data: WormDataPoint[]) => {
    if (data.length === 0) return '';

    let path = `M 0 100`;

    for (const point of data) {
      const x = getXPosition(point.over);
      const y = getYPosition(point.runs);
      path += ` L ${x} ${y}`;
    }

    return path;
  };

  return (
    <div className="ww-card p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-blue-400">📊</span> Score Progression
      </h3>

      <div className="relative" style={{ height: '300px' }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
          {[maxRuns, Math.floor(maxRuns * 0.75), Math.floor(maxRuns * 0.5), Math.floor(maxRuns * 0.25), 0].map((val, idx) => (
            <div key={idx} className="text-right pr-2">{val}</div>
          ))}
        </div>

        {/* Graph area */}
        <div className="absolute left-14 right-0 top-0 bottom-8">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <div
                key={idx}
                className="absolute left-0 right-0 border-t border-gray-700/50"
                style={{ bottom: `${ratio * 100}%` }}
              />
            ))}
          </div>

          {/* SVG for lines */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Team 1 line */}
            {team1Data.length > 0 && (
              <path
                d={createPath(team1Data)}
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Team 2 line */}
            {team2Data.length > 0 && (
              <path
                d={createPath(team2Data)}
                fill="none"
                stroke="rgb(234, 179, 8)"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
                strokeDasharray="2,2"
              />
            )}

            {/* Wicket markers for team 1 */}
            {team1Data.map((point, idx) => {
              if (idx === 0) return null;
              const prevWickets = idx > 0 ? team1Data[idx - 1].wickets : 0;
              if (point.wickets > prevWickets) {
                return (
                  <circle
                    key={`t1-w-${idx}`}
                    cx={getXPosition(point.over)}
                    cy={getYPosition(point.runs)}
                    r="1.5"
                    fill="rgb(239, 68, 68)"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }
              return null;
            })}

            {/* Wicket markers for team 2 */}
            {team2Data.map((point, idx) => {
              if (idx === 0) return null;
              const prevWickets = idx > 0 ? team2Data[idx - 1].wickets : 0;
              if (point.wickets > prevWickets) {
                return (
                  <circle
                    key={`t2-w-${idx}`}
                    cx={getXPosition(point.over)}
                    cy={getYPosition(point.runs)}
                    r="1.5"
                    fill="rgb(239, 68, 68)"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }
              return null;
            })}

            {/* Data points for team 1 */}
            {team1Data.map((point, idx) => (
              <circle
                key={`t1-${idx}`}
                cx={getXPosition(point.over)}
                cy={getYPosition(point.runs)}
                r="0.8"
                fill="rgb(34, 197, 94)"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Data points for team 2 */}
            {team2Data.map((point, idx) => (
              <circle
                key={`t2-${idx}`}
                cx={getXPosition(point.over)}
                cy={getYPosition(point.runs)}
                r="0.8"
                fill="rgb(234, 179, 8)"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute left-14 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-400 pt-1 px-1">
          {Array.from({ length: Math.min(maxOvers + 1, 11) }).map((_, idx) => {
            const overNum = Math.floor((idx / Math.min(maxOvers, 10)) * maxOvers);
            return (
              <div key={idx}>
                {overNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-green-600 to-green-400 rounded" />
          <span className="text-gray-300">{team1Name}</span>
        </div>
        {innings2 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded" />
            <span className="text-gray-300">{team2Name}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs font-bold">✖</span>
          <span className="text-gray-400">Wicket</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreComparisonGraph;
