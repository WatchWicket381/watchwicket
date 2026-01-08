import React, { useState, useEffect } from "react";
import { MatchSummary } from "./store/matches";
import watchwicketLogo from "./assets/file_00000000711072438e9d72dabae9eda2.png";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import CricketSquad from "./pages/CricketSquad";
import MyStats from "./pages/MyStats";
import MyMatches from "./pages/MyMatches";
import Watermark from "./components/Watermark";
import ErrorBoundary from "./components/ErrorBoundary";
import { getStatusColor, normalizeStatus } from "./utils/matchStatus";

interface HomeProps {
  matches: MatchSummary[];
  onNewMatch: () => void;
  onResumeMatch: (id: string) => void;
  onDeleteMatch: (id: string) => void;
  user: any;
  isPro: boolean;
  signOut: () => void;
  onUpgrade: () => void;
  onShowAuth: () => void;
}

type Screen = "home" | "profile" | "cricketSquad" | "settings" | "myStats" | "myMatches";

const Home: React.FC<HomeProps> = ({
  matches,
  onNewMatch,
  onResumeMatch,
  onDeleteMatch,
  user,
  isPro,
  signOut,
  onUpgrade,
  onShowAuth,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");

  useEffect(() => {
    if (showMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showMenu]);

  function handleDelete(id: string) {
    if (deleteConfirmId === id) {
      onDeleteMatch(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getMatchDate(match: MatchSummary): string {
    const normalized = normalizeStatus(match.status);
    if (normalized === 'completed' && match.completedAt) {
      return formatDate(match.completedAt);
    }
    if (match.completedAt && !match.updatedAt) {
      return formatDate(match.completedAt);
    }
    return formatDate(match.updatedAt || match.createdAt);
  }

  function getFormatDisplay(format: string): string {
    switch (format) {
      case "INDOOR":
        return "Indoor Mode";
      case "T20":
        return "T20";
      case "ODI":
        return "50 Overs";
      case "TEST":
        return "Test Match";
      default:
        return format;
    }
  }


  function navigateToScreen(screen: Screen) {
    setCurrentScreen(screen);
    setShowMenu(false);
  }

  function navigateBack() {
    setCurrentScreen("home");
  }

  const sortedMatches = [...matches].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (currentScreen === "profile") {
    return (
      <Profile
        onClose={navigateBack}
        onNavigateToPlayers={() => navigateToScreen("cricketSquad")}
      />
    );
  }

  if (currentScreen === "cricketSquad") {
    return <CricketSquad onBack={navigateBack} />;
  }

  if (currentScreen === "settings") {
    return <Settings onClose={navigateBack} />;
  }

  if (currentScreen === "myStats") {
    return <MyStats onClose={navigateBack} />;
  }

  if (currentScreen === "myMatches") {
    return (
      <ErrorBoundary>
        <MyMatches onClose={navigateBack} onViewMatch={onResumeMatch} />
      </ErrorBoundary>
    );
  }

  const activeMatch = sortedMatches.find(m => normalizeStatus(m.status) === "live");

  function getMatchScore() {
    if (!activeMatch || !activeMatch.matchData) {
      return { score: "0/0", overs: "0.0" };
    }

    const state = activeMatch.matchData;
    const currentInnings = state.innings[state.currentInnings];

    if (!currentInnings) {
      return { score: "0/0", overs: "0.0" };
    }

    const runs = currentInnings.totalRuns || 0;
    const wickets = currentInnings.wickets || 0;
    const totalBalls = currentInnings.totalBalls || 0;
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;

    return {
      score: `${runs}/${wickets}`,
      overs: `${overs}.${balls}`
    };
  }

  const { score, overs } = getMatchScore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-green-950 text-white flex flex-col">
      <Watermark />

      <header className="bg-green-900/50 backdrop-blur-sm py-3 shadow-lg relative z-10 border-b border-green-800/50 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-green-200 hover:text-white p-2 relative"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {!user && (
            <button
              onClick={onShowAuth}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold text-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 relative z-10">
          <div className="max-w-4xl mx-auto px-6 pt-8 pb-6">
            <div className="text-center mb-6">
              <img
                src={watchwicketLogo}
                alt="WatchWicket"
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain mx-auto drop-shadow-2xl"
              />
            </div>

            <button
              onClick={onNewMatch}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-2xl p-6 shadow-2xl border-2 border-green-400 transition-all duration-200 hover:scale-[1.02] font-black text-white text-2xl tracking-wider"
            >
              START MATCH
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-4xl mx-auto px-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Saved Matches</h2>
            </div>

            {sortedMatches.length === 0 ? (
              <div className="bg-gradient-to-br from-green-800/40 to-green-900/40 rounded-2xl p-12 text-center border border-green-700/50 shadow-xl">
                <div className="text-6xl mb-4">🏏</div>
                <h3 className="text-xl font-bold mb-2 text-white">No Matches Yet</h3>
                <p className="text-green-200 text-sm">
                  Tap "Start Match" above to create your first match
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-gradient-to-br from-green-800/40 to-green-900/40 rounded-xl p-4 border border-green-700/50 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-base font-bold truncate">
                            {match.teamAName} vs {match.teamBName}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(
                              match.status
                            )}`}
                          >
                            {match.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-green-300">
                          <span className="font-semibold">
                            {getFormatDisplay(match.format)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{getMatchDate(match)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onResumeMatch(match.id)}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg"
                        >
                          {normalizeStatus(match.status) === "draft" ? "Setup" : "Open"}
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg ${
                            deleteConfirmId === match.id
                              ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                              : "bg-green-950/50 hover:bg-green-900/50 border border-green-700/30"
                          }`}
                        >
                          {deleteConfirmId === match.id ? "Confirm?" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowMenu(false)}>
          <div
            className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-green-900 to-green-950 shadow-xl z-50 overflow-y-auto border-r border-green-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-green-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-green-300 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              <button
                onClick={() => navigateToScreen("profile")}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white"
              >
                <span>👤</span>
                <span>My Profile</span>
              </button>
              <button
                onClick={() => navigateToScreen("myStats")}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white"
              >
                <span>📊</span>
                <span>My Stats</span>
              </button>
              <button
                onClick={() => navigateToScreen("myMatches")}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white"
              >
                <span>🏏</span>
                <span>My Matches</span>
              </button>
              <div className="border-t border-green-800 my-2"></div>
              <button
                onClick={() => navigateToScreen("cricketSquad")}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white"
              >
                <span>👥</span>
                <span>Cricket Squad</span>
              </button>
              <button
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-green-500 opacity-60"
                disabled
              >
                <span>🏆</span>
                <span>Leagues</span>
              </button>
              <button
                onClick={() => navigateToScreen("home")}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white"
              >
                <span>💾</span>
                <span>Saved Matches</span>
              </button>
              <div className="border-t border-green-800 my-2"></div>
              <button
                onClick={() => navigateToScreen("settings")}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
              <button
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-green-500 opacity-60"
                disabled
              >
                <span>📖</span>
                <span>Rules of Cricket</span>
              </button>
              <button
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-green-500 opacity-60"
                disabled
              >
                <span>ℹ️</span>
                <span>About WatchWicket</span>
              </button>
              {user && (
                <>
                  <div className="border-t border-green-800 my-2"></div>
                  <button
                    onClick={() => {
                      signOut();
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-red-400"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
