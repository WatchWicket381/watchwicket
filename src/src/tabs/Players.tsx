import React, { useState } from "react";
import { listProfiles } from "../store/playerProfiles";
import { PlayerProfile } from "../types/playerProfile";
import { getPlayerCareerStats } from "../engine/playerStats";
import { formatPlayerName } from "../utils/nameFormatter";

interface Props {
  isPro: boolean;
  onUpgrade: () => void;
}

const Players: React.FC<Props> = ({ isPro, onUpgrade }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<PlayerProfile | null>(null);

  if (!isPro) {
    return (
      <div className="p-6 text-white max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 border border-slate-700 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold mb-3">Player Profiles</h2>
          <p className="text-slate-300 mb-6 text-lg">
            Unlock WatchWicket Pro to track player careers across all your matches.
          </p>

          <div className="bg-slate-700 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold mb-3 text-lg">Pro Features:</h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Create detailed player profiles with batting/bowling styles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Track career statistics across all matches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>View last 5 matches for each player</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Link players to profiles for automatic stat tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Batting averages, strike rates, and bowling economy</span>
              </li>
            </ul>
          </div>

          <button
            onClick={onUpgrade}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all shadow-lg"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  const profiles = listProfiles();
  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedProfile) {
    const stats = getPlayerCareerStats(selectedProfile.id);

    return (
      <div className="p-4 text-white">
        <button
          onClick={() => setSelectedProfile(null)}
          className="text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-1"
        >
          ← Back to Players
        </button>

        <div className="bg-slate-800 rounded-lg p-6 mb-4">
          <h2 className="text-3xl font-bold mb-2">{formatPlayerName(selectedProfile.name)}</h2>
          {selectedProfile.nickname && (
            <p className="text-slate-400 italic mb-2">"{selectedProfile.nickname}"</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedProfile.battingStyle && (
              <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded text-sm">
                {selectedProfile.battingStyle}
              </span>
            )}
            {selectedProfile.bowlingStyle && (
              <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-sm">
                {selectedProfile.bowlingStyle}
              </span>
            )}
            {selectedProfile.roles?.map(role => (
              <span
                key={role}
                className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-sm"
              >
                {role}
              </span>
            ))}
            {selectedProfile.jerseyNumber && (
              <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-sm">
                #{selectedProfile.jerseyNumber}
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-5">
            <h3 className="text-xl font-bold mb-3 text-blue-400">Batting</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Matches:</span>
                <span className="font-semibold">{stats.batting.matches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Innings:</span>
                <span className="font-semibold">{stats.batting.innings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Runs:</span>
                <span className="font-semibold">{stats.batting.runs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Average:</span>
                <span className="font-semibold">{stats.batting.average.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Strike Rate:</span>
                <span className="font-semibold">{stats.batting.strikeRate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Highest:</span>
                <span className="font-semibold">{stats.batting.highest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">50s / 100s:</span>
                <span className="font-semibold">
                  {stats.batting.fifties} / {stats.batting.hundreds}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">4s / 6s:</span>
                <span className="font-semibold">
                  {stats.batting.fours} / {stats.batting.sixes}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-5">
            <h3 className="text-xl font-bold mb-3 text-green-400">Bowling</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Matches:</span>
                <span className="font-semibold">{stats.bowling.matches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Overs:</span>
                <span className="font-semibold">{stats.bowling.overs.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Runs:</span>
                <span className="font-semibold">{stats.bowling.runs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wickets:</span>
                <span className="font-semibold">{stats.bowling.wickets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Best:</span>
                <span className="font-semibold">
                  {stats.bowling.bestWickets > 0
                    ? `${stats.bowling.bestWickets}/${stats.bowling.bestRuns}`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Economy:</span>
                <span className="font-semibold">{stats.bowling.economy.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">4W / 5W:</span>
                <span className="font-semibold">
                  {stats.bowling.fourW} / {stats.bowling.fiveW}
                </span>
              </div>
            </div>
          </div>
        </div>

        {stats.recent.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-5">
            <h3 className="text-xl font-bold mb-4">Recent Matches</h3>
            <div className="space-y-3">
              {stats.recent.map((match, idx) => (
                <div key={idx} className="border-b border-slate-700 pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold">vs {match.opponent}</span>
                      <span className="text-slate-400 text-sm ml-2">
                        ({match.format})
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(match.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm space-y-1">
                    {match.battingRuns !== undefined && (
                      <div className="text-slate-300">
                        <span className="text-blue-400">Batting:</span> {match.battingRuns} (
                        {match.battingBalls})
                        {match.dismissal && (
                          <span className="text-slate-400 ml-1">- {match.dismissal}</span>
                        )}
                      </div>
                    )}
                    {match.bowlingWickets !== undefined && (
                      <div className="text-slate-300">
                        <span className="text-green-400">Bowling:</span>{" "}
                        {match.bowlingOvers?.toFixed(1)}-{match.bowlingRuns}-
                        {match.bowlingWickets}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Player Profiles</h2>

      <input
        type="text"
        placeholder="Search players..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full bg-slate-800 px-4 py-2 rounded-lg mb-4"
      />

      {filteredProfiles.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-lg font-semibold mb-2">No players yet</h3>
          <p className="text-slate-400">
            Link players from the Team Sheet to create profiles automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProfiles.map(profile => {
            const stats = getPlayerCareerStats(profile.id);
            return (
              <div
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className="bg-slate-800 hover:bg-slate-750 rounded-lg p-4 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{formatPlayerName(profile.name)}</h3>
                    {profile.nickname && (
                      <p className="text-sm text-slate-400 italic">"{profile.nickname}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {profile.roles?.map(role => (
                        <span
                          key={role}
                          className="text-xs bg-slate-700 px-2 py-0.5 rounded"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-slate-400">
                      {stats.batting.matches} {stats.batting.matches === 1 ? "match" : "matches"}
                    </div>
                    <div className="text-blue-400">
                      {stats.batting.runs} runs @ {stats.batting.average.toFixed(1)}
                    </div>
                    {stats.bowling.wickets > 0 && (
                      <div className="text-green-400">
                        {stats.bowling.wickets} wickets
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Players;
