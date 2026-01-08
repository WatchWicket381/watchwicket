import React, { useMemo, useState } from "react";
import { MatchState, Delivery, Player, Inning } from "../matchTypes";
import { formatPlayerName } from "../utils/nameFormatter";

type Props = { state: MatchState };

function ballsToOvers(balls: number) {
  const o = Math.floor(balls / 6);
  const b = balls % 6;
  return `${o}.${b}`;
}

export default function Scorecard({ state }: Props) {
  const startedInnings = useMemo(() => {
    return state.innings.filter(inn =>
      inn.totalBalls > 0 || inn.totalRuns > 0 || inn.deliveries.length > 0
    );
  }, [state.innings]);

  const [selectedInningsIndex, setSelectedInningsIndex] = useState(0);

  if (startedInnings.length === 0) {
    return (
      <div className="p-4 text-white">
        <h2 className="text-2xl font-bold mb-3">Scorecard</h2>
        <div className="text-center py-8 text-gray-400">
          No innings started yet. Start scoring to see the scorecard.
        </div>
      </div>
    );
  }

  const inn = startedInnings[Math.min(selectedInningsIndex, startedInnings.length - 1)];
  const isIndoor = state.format === "INDOOR";

  // Helpers to fetch team rosters
  const battingPlayers = inn.battingTeam === "A" ? state.teamAPlayers : state.teamBPlayers;
  // Bowling team is the OPPOSITE of batting team (the fielding team)
  const bowlingPlayers = inn.battingTeam === "A" ? state.teamBPlayers : state.teamAPlayers;

  // ---- Bowling aggregation from deliveries ----
  const bowling = useMemo(() => {
    const map = new Map<
      string,
      { name: string; balls: number; runs: number; wickets: number; wides: number; noballs: number; isCaptain?: boolean; isKeeper?: boolean }
    >();

    const nameOf = (id?: string) => (bowlingPlayers.find(p => p.id === id)?.name ?? "—");
    const playerData = (id?: string) => bowlingPlayers.find(p => p.id === id);

    inn.deliveries.forEach((d: Delivery) => {
      const id = d.bowlerId || "_unknown";
      if (!map.has(id)) {
        const player = playerData(id);
        map.set(id, {
          name: nameOf(id),
          balls: 0,
          runs: 0,
          wickets: 0,
          wides: 0,
          noballs: 0,
          isCaptain: player?.isCaptain,
          isKeeper: player?.isKeeper
        });
      }
      const row = map.get(id)!;

      // runs conceded = all runs on the ball
      row.runs += d.runs;

      // legal ball adds to ball count
      if (d.isLegal) row.balls += 1;

      // wicket to bowler if legal delivery created it (simple version)
      if (d.isWicket && d.isLegal) row.wickets += 1;

      if (!d.isLegal && d.display.startsWith("Wd")) row.wides += 1;
      if (!d.isLegal && d.display.startsWith("Nb")) row.noballs += 1;
    });

    return Array.from(map.entries())
      .filter(([id]) => id !== "_unknown") // hide unknown rows if any
      .map(([id, r]) => ({
        id,
        ...r,
        oversText: ballsToOvers(r.balls),
        econ: r.balls ? (r.runs / (r.balls / 6)).toFixed(2) : "–",
      }));
  }, [inn.deliveries, bowlingPlayers]);

  // ---- Batting: taken from player objects (engine updates them) ----
  const batting = useMemo(() => {
    const isCurrentInnings = state.currentInnings === state.innings.indexOf(inn);

    return battingPlayers.map((p: Player) => {
      let statusText = p.isOut ? (p.dismissal || "out") : "not out";

      // Only show striker/non-striker indicators for the current innings
      if (isCurrentInnings) {
        if (p.id === state.strikerId) {
          statusText += " 🏏";
        } else if (p.id === state.nonStrikerId) {
          statusText += " (at crease)";
        }
      }

      return {
        id: p.id,
        name: p.name,
        r: p.runs,
        b: p.balls,
        fours: p.fours,
        sixes: p.sixes,
        sr: p.balls ? ((p.runs / p.balls) * 100).toFixed(1) : "–",
        out: statusText,
        outsCount: p.outsCount || 0,
        isCaptain: p.isCaptain,
        isKeeper: p.isKeeper,
      };
    });
  }, [battingPlayers, state.strikerId, state.nonStrikerId]);

  const battingTeamName = inn.battingTeam === "A" ? state.teamAName : state.teamBName;
  const bowlingTeamName = inn.battingTeam === "A" ? state.teamBName : state.teamAName;

  return (
    <div className="p-4 text-white max-w-full overflow-x-hidden">
      <h2 className="text-2xl font-bold mb-4">Scorecard</h2>

      {startedInnings.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {startedInnings.map((inning, idx) => {
            const teamName = inning.battingTeam === "A" ? state.teamAName : state.teamBName;
            const isSelected = idx === selectedInningsIndex;
            return (
              <button
                key={idx}
                onClick={() => setSelectedInningsIndex(idx)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {teamName} Innings
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-lg font-bold">{battingTeamName} Innings</div>
        <div className="text-sm text-gray-400">vs {bowlingTeamName}</div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Batting</h3>
        <div className="overflow-x-auto rounded border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-2">Batter</th>
                <th className="text-right p-2">R</th>
                <th className="text-right p-2">B</th>
                <th className="text-right p-2">4s</th>
                <th className="text-right p-2">6s</th>
                <th className="text-right p-2 hidden sm:table-cell">SR</th>
                {isIndoor && <th className="text-center p-2 hidden sm:table-cell">Outs</th>}
                <th className="text-left p-2 hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {batting.map((b) => (
                <tr key={b.id} className="odd:bg-gray-900">
                  <td className="p-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="font-medium flex items-center gap-1">
                        <span className="truncate" title={b.name}>{formatPlayerName(b.name)}</span>
                        {b.isCaptain && <span className="text-amber-400 text-xs">(C)</span>}
                        {b.isKeeper && <span className="text-sky-400 text-xs">(WK)</span>}
                        {isIndoor && b.outsCount > 0 && (
                          <span className="text-gray-400 text-xs sm:hidden">×{b.outsCount}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 leading-tight md:hidden">
                        {b.out}
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right font-semibold">{b.r}</td>
                  <td className="p-2 text-right">{b.b}</td>
                  <td className="p-2 text-right">{b.fours}</td>
                  <td className="p-2 text-right">{b.sixes}</td>
                  <td className="p-2 text-right hidden sm:table-cell">{b.sr}</td>
                  {isIndoor && (
                    <td className="p-2 text-center hidden sm:table-cell">×{b.outsCount}</td>
                  )}
                  <td className="p-2 hidden md:table-cell">
                    <div className="text-xs text-gray-400 leading-tight">
                      {b.out}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Yet to Bat section for Indoor Mode (only for current innings) */}
      {isIndoor && state.currentInnings === state.innings.indexOf(inn) && (() => {
        const yetToBat = battingPlayers.filter(p =>
          (p.outsCount || 0) === 0 &&
          p.runs === 0 &&
          p.balls === 0 &&
          p.id !== state.strikerId &&
          p.id !== state.nonStrikerId
        );

        if (yetToBat.length > 0) {
          return (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Yet to Bat</h3>
              <div className="rounded border border-gray-700 bg-gray-900 p-3">
                <div className="flex flex-wrap gap-2">
                  {yetToBat.map((p) => (
                    <span key={p.id} className="text-sm text-gray-300">
                      {formatPlayerName(p.name)}
                      {p.isCaptain && " (C)"}
                      {p.isKeeper && " (WK)"}
                    </span>
                  )).reduce((prev, curr, idx) => {
                    return idx === 0 ? [curr] : [...prev, <span key={`sep-${idx}`} className="text-gray-600">,</span>, curr];
                  }, [] as React.ReactNode[])}
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div>
        <h3 className="text-lg font-semibold mb-2">Bowling</h3>
        <div className="overflow-x-auto rounded border border-gray-700">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-2" style={{ width: '35%' }}>Bowler</th>
                <th className="text-right p-2" style={{ width: '12%' }}>O</th>
                <th className="text-right p-2" style={{ width: '10%' }}>R</th>
                <th className="text-right p-2" style={{ width: '8%' }}>W</th>
                <th className="text-right p-2 hidden xs:table-cell" style={{ width: '8%' }}>Wd</th>
                <th className="text-right p-2 hidden xs:table-cell" style={{ width: '8%' }}>Nb</th>
                <th className="text-right p-2" style={{ width: '12%' }}>Econ</th>
              </tr>
            </thead>
            <tbody>
              {bowling.map((r) => (
                <tr key={r.id} className="odd:bg-gray-900">
                  <td className="p-2">
                    <div className="font-medium flex items-center gap-1" title={r.name}>
                      <span className="truncate">{formatPlayerName(r.name)}</span>
                      {r.isCaptain && <span className="text-amber-400 text-xs">(C)</span>}
                      {r.isKeeper && <span className="text-sky-400 text-xs">(WK)</span>}
                    </div>
                  </td>
                  <td className="p-2 text-right">{r.oversText}</td>
                  <td className="p-2 text-right font-semibold">{r.runs}</td>
                  <td className="p-2 text-right font-semibold">{r.wickets}</td>
                  <td className="p-2 text-right hidden xs:table-cell">{r.wides}</td>
                  <td className="p-2 text-right hidden xs:table-cell">{r.noballs}</td>
                  <td className="p-2 text-right">{r.econ}</td>
                </tr>
              ))}
              {bowling.length === 0 && (
                <tr>
                  <td className="p-2 text-center text-gray-400" colSpan={7}>No bowling yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-300">
          <span className="font-medium">Total:</span> <span className="text-xl font-bold text-white">{inn.totalRuns}/{inn.wickets}</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          in <span className="font-semibold">{ballsToOvers(inn.totalBalls)}</span> overs
        </div>
        {inn.extras.wides + inn.extras.noBalls + inn.extras.byes + inn.extras.legByes > 0 && (
          <div className="text-xs text-gray-400 mt-2">
            Extras: {inn.extras.wides + inn.extras.noBalls + inn.extras.byes + inn.extras.legByes}
            {' '}(Wd {inn.extras.wides}, Nb {inn.extras.noBalls}, B {inn.extras.byes}, Lb {inn.extras.legByes})
          </div>
        )}
      </div>
    </div>
  );
}
