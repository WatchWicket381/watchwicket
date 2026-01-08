import React from "react";
import watchwicketLogo from "../assets/file_00000000711072438e9d72dabae9eda2.png";
import { MatchSummary } from "../store/matches";

interface DashboardProps {
  onClose: () => void;
  onStartMatch: () => void;
  onViewFixtures: () => void;
  onViewTeams: () => void;
  onViewMatchSummary: () => void;
  activeMatch: MatchSummary | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  onClose,
  onStartMatch,
  onViewFixtures,
  onViewTeams,
  onViewMatchSummary,
  activeMatch
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950 z-50 overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <button
            onClick={onClose}
            className="text-green-300 hover:text-white text-3xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-md">
            <div className="relative z-10 space-y-8">
              <div className="text-center mb-12">
                <img
                  src={watchwicketLogo}
                  alt="WatchWicket"
                  className="w-48 h-48 object-contain mx-auto drop-shadow-2xl mb-6"
                />
                <h2 className="text-4xl font-black text-white mb-2">DASHBOARD</h2>
              </div>

              {activeMatch && (
                <div className="bg-gradient-to-r from-green-800/60 to-green-700/60 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-500 shadow-2xl mb-6">
                  <div className="text-center">
                    <p className="text-green-200 text-sm uppercase tracking-wide mb-2">
                      LIVE MATCH
                    </p>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {activeMatch.teamAName} vs {activeMatch.teamBName}
                    </h3>
                    {activeMatch.matchData && activeMatch.matchData.innings.length > 0 && (
                      <div className="text-3xl font-black text-white">
                        {activeMatch.matchData.innings[activeMatch.matchData.currentInnings]?.totalRuns || 0}/
                        {activeMatch.matchData.innings[activeMatch.matchData.currentInnings]?.wickets || 0}
                        <span className="text-lg text-green-200 ml-2">
                          ({Math.floor((activeMatch.matchData.innings[activeMatch.matchData.currentInnings]?.totalBalls || 0) / 6)}.
                          {(activeMatch.matchData.innings[activeMatch.matchData.currentInnings]?.totalBalls || 0) % 6})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onViewMatchSummary}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-2xl p-6 text-center transition-all transform hover:scale-105 shadow-xl"
                  disabled={!activeMatch}
                >
                  <div className="text-4xl mb-2">📊</div>
                  <div className="font-bold text-white">Match Summary</div>
                </button>

                <button
                  onClick={onViewFixtures}
                  className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-2xl p-6 text-center transition-all transform hover:scale-105 shadow-xl opacity-60"
                  disabled
                >
                  <div className="text-4xl mb-2">📅</div>
                  <div className="font-bold text-white">Fixtures</div>
                  <div className="text-xs text-purple-200 mt-1">Coming Soon</div>
                </button>

                <button
                  onClick={onViewTeams}
                  className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-2xl p-6 text-center transition-all transform hover:scale-105 shadow-xl"
                >
                  <div className="text-4xl mb-2">👥</div>
                  <div className="font-bold text-white">Teams</div>
                </button>

                <button
                  onClick={onStartMatch}
                  className="bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-2xl p-6 text-center transition-all transform hover:scale-105 shadow-xl"
                >
                  <div className="text-4xl mb-2">🏏</div>
                  <div className="font-bold text-white">Start Scoring</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
