import React, { useEffect, useState, useCallback } from "react";
import LiveScore from "./tabs/LiveScore";
import Scorecard from "./tabs/Scorecard";
import MatchSummary from "./tabs/MatchSummary";
import TeamSheet from "./tabs/TeamSheet";
import Commentary from "./tabs/Commentary";
import HomePage from "./pages/HomePage";
import MyMatches from "./pages/MyMatches";
import Leagues from "./pages/Leagues";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Rules from "./pages/Rules";
import TermsConditions from "./pages/TermsConditions";
import UserAgreement from "./pages/UserAgreement";
import Support from "./pages/Support";
import CricketSquad from "./pages/CricketSquad";
import MyStats from "./pages/MyStats";
import Teams from "./pages/Teams";
import DebugSupabase from "./pages/DebugSupabase";
import AuthCallback from "./pages/AuthCallback";
import PublicHomePage from "./pages/PublicHomePage";
import PublicMatchPage from "./pages/PublicMatchPage";
import watchwicketLogo from "./assets/file_00000000711072438e9d72dabae9eda2.png";
import { useAuth } from "./contexts/AuthContext";
import AuthModal from "./components/AuthModal";
import Watermark from "./components/Watermark";
import MatchSharingModal from "./components/MatchSharingModal";
import StartScheduleModal from "./components/StartScheduleModal";
import BottomNav, { NavScreen } from "./components/BottomNav";
import ErrorBoundary from "./components/ErrorBoundary";

import { MatchState, MatchFormat } from "./matchTypes";
import { createNewMatch, applyFormat } from "./engine/MatchEngine";
import {
  loadMatchFromDb,
  saveMatchToDb,
  deleteMatchFromDb,
  createNewMatchInDb,
} from "./store/supabaseMatches";
import { clampOversToFormat } from "./utils/oversConstraints";
import {
  saveMatchLocally,
  markMatchAsSynced,
  markMatchAsUnsynced,
  removeMatchLocally,
  getAllUnsyncedMatches,
  hasUnsavedData,
} from "./store/matchPersistence";
import { LeagueFixture, League } from "./store/leagues";
import { updateLeagueAfterMatch } from "./utils/leagueMatchIntegration";

type TabKey = "live" | "scorecard" | "summary" | "teams" | "commentary";

export default function App() {
  const currentPath = window.location.pathname;
  const isAuthCallback = currentPath === '/auth/callback';

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  const matchIdMatch = currentPath.match(/^\/match\/(.+)$/);
  const isPublicMatch = matchIdMatch !== null;
  const isPublicHome = currentPath === '/' || currentPath === '';
  const isScoreBox = currentPath.startsWith('/scorebox');

  if (isPublicMatch && matchIdMatch) {
    const matchId = matchIdMatch[1];
    return <PublicMatchPage matchId={matchId} />;
  }

  const { user, isPro, loading, signOut } = useAuth();

  if (!user && isPublicHome) {
    return <PublicHomePage />;
  }
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showStartScheduleModal, setShowStartScheduleModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat | null>(null);
  const [showMatchSharing, setShowMatchSharing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showUserAgreement, setShowUserAgreement] = useState(false);
  const [showCricketSquad, setShowCricketSquad] = useState(false);
  const [showMyStats, setShowMyStats] = useState(false);
  const [showDebugSupabase, setShowDebugSupabase] = useState(false);

  const [navScreen, setNavScreen] = useState<NavScreen>("home");
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [state, setState] = useState<MatchState>(() => createNewMatch());
  const [tab, setTab] = useState<TabKey>("live");
  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(null);
  const [currentFixtureId, setCurrentFixtureId] = useState<string | null>(null);
  const [currentFixtureHomeTeamId, setCurrentFixtureHomeTeamId] = useState<string | null>(null);
  const [currentFixtureAwayTeamId, setCurrentFixtureAwayTeamId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const normalizeMatchState = useCallback((matchState: MatchState): { state: MatchState; wasAdjusted: boolean } => {
    let wasAdjusted = false;

    if (matchState.format === "INDOOR") {
      matchState.teamAPlayers.forEach(p => {
        if (p.outsCount === undefined) {
          p.outsCount = 0;
        }
      });
      matchState.teamBPlayers.forEach(p => {
        if (p.outsCount === undefined) {
          p.outsCount = 0;
        }
      });
    }

    const clampedOvers = clampOversToFormat(matchState.oversLimit, matchState.format);
    if (clampedOvers !== matchState.oversLimit) {
      matchState.oversLimit = clampedOvers;
      if (matchState.innings.length > 0) {
        matchState.innings[matchState.currentInnings].oversLimit = clampedOvers;
      }
      wasAdjusted = true;
    }

    return { state: matchState, wasAdjusted };
  }, []);

  useEffect(() => {
    async function loadMatches() {
      if (!user) {
        return;
      }

      const unsyncedMatches = getAllUnsyncedMatches();
      const unsyncedForThisUser = unsyncedMatches.filter(m => m.userId === user.id);

      if (unsyncedForThisUser.length > 0) {
        const latestUnsynced = unsyncedForThisUser[0];
        const matchState = latestUnsynced.state;

        // Compute legal balls from innings
        const legalBalls = matchState.innings.reduce((total, inning) => {
          return total + inning.deliveries.filter(d => d.isLegal).length;
        }, 0);

        // Only show resume prompt for genuinely resumable matches
        const isResumable =
          matchState.status === 'live' ||
          (matchState.status === 'draft' && matchState.hasActivity === true && legalBalls > 0);

        // Don't show for abandoned, deleted, completed, or empty drafts
        const shouldNotResume =
          matchState.status === 'abandoned' ||
          matchState.status === 'deleted' ||
          matchState.status === 'completed' ||
          matchState.status === 'Completed' ||
          matchState.deletedAt;

        if (isResumable && !shouldNotResume) {
          const shouldRestore = window.confirm(
            `You have an unsaved match: ${matchState.teamAName} vs ${matchState.teamBName}. Would you like to resume it?`
          );

          if (shouldRestore) {
            const { state: normalizedState, wasAdjusted } = normalizeMatchState(matchState);
            setCurrentMatchId(latestUnsynced.matchId);
            setState(normalizedState);
            let errorMsg = "This match has unsaved data. Your progress is saved locally but may not be synced to the server yet.";
            if (wasAdjusted) {
              errorMsg += " Overs were adjusted to match mode limits.";
            }
            setSyncError(errorMsg);
            return;
          } else {
            // User clicked Cancel - mark as abandoned
            matchState.status = 'abandoned';
            await saveMatchToDb(latestUnsynced.matchId, matchState);
            removeMatchLocally(latestUnsynced.matchId);
          }
        }
      }
    }

    loadMatches();
  }, [user, normalizeMatchState]);

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

  useEffect(() => {
    async function autoSaveMatch() {
      if (!currentMatchId || !user) return;

      const isCompleted = state.status === 'completed' || state.status === 'Completed';
      const isDraft = state.status === 'draft' || !state.status;

      saveMatchLocally(currentMatchId, state, user.id, false);

      if (isCompleted) {
        return;
      }

      // CRITICAL: Do NOT auto-sync draft matches
      // Draft matches are saved locally only until user explicitly saves/starts
      if (isDraft) {
        return;
      }

      // Only auto-sync matches that are 'live' (in progress)
      try {
        const result = await saveMatchToDb(currentMatchId, state);
        if (result.success) {
          markMatchAsSynced(currentMatchId);
          setSyncError(null);
        } else {
          markMatchAsUnsynced(currentMatchId);
          setSyncError("Unable to sync match to server. Your data is saved locally.");
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        markMatchAsUnsynced(currentMatchId);
        setSyncError("Unable to sync match to server. Your data is saved locally.");
      }
    }

    autoSaveMatch();
  }, [state, currentMatchId, user]);

  function update<K extends keyof MatchState>(key: K, val: MatchState[K]) {
    setState((s) => ({ ...s, [key]: val, updatedAt: new Date().toISOString() }));
  }

  function onChangeFormat(f: MatchFormat) {
    const hasStarted = state.innings.some(inning => inning.deliveries.length > 0);

    if (hasStarted) {
      alert("Cannot change match format once the match has started. Please start a new match to use a different format.");
      return;
    }

    setState((s) => {
      const copy = { ...s, format: f };
      applyFormat(copy, f);
      return { ...copy };
    });
  }

  function handleNavigate(screen: NavScreen) {
    if (screen === "newMatch") {
      handleNewMatch();
    } else {
      setNavScreen(screen);
    }
  }

  async function handleNewMatch() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setShowModeSelector(true);
  }

  async function handleCreateMatchWithMode(format: MatchFormat) {
    setShowModeSelector(false);
    setSelectedFormat(format);
    setShowStartScheduleModal(true);
  }

  async function handleStartNow() {
    if (!selectedFormat) return;

    setShowStartScheduleModal(false);

    const newState = createNewMatch();
    newState.format = selectedFormat;
    newState.status = "draft";
    newState.isScheduled = false;
    applyFormat(newState, newState.format);

    const result = await createNewMatchInDb(newState);
    if (result.success && result.matchId) {
      setCurrentMatchId(result.matchId);
      setState(newState);
      setTab("teams");
    } else {
      alert('Failed to create match: ' + (result.error || 'Unknown error'));
    }
    setSelectedFormat(null);
  }

  async function handleSchedule(location: string, date: string, time: string) {
    if (!selectedFormat) return;

    setShowStartScheduleModal(false);

    const newState = createNewMatch();
    newState.format = selectedFormat;
    newState.status = "draft";
    newState.isScheduled = true;
    newState.matchLocation = location;
    newState.matchDate = date;
    newState.matchTime = time;
    applyFormat(newState, newState.format);

    const result = await createNewMatchInDb(newState);
    if (result.success && result.matchId) {
      setCurrentMatchId(result.matchId);
      setState(newState);
      setTab("teams");
    } else {
      alert('Failed to create match: ' + (result.error || 'Unknown error'));
    }
    setSelectedFormat(null);
  }

  async function handleResumeMatch(id: string) {
    const matchState = await loadMatchFromDb(id);
    if (matchState) {
      if (matchState.format === "INDOOR") {
        matchState.teamAPlayers.forEach(p => {
          if (p.outsCount === undefined) {
            p.outsCount = 0;
          }
        });
        matchState.teamBPlayers.forEach(p => {
          if (p.outsCount === undefined) {
            p.outsCount = 0;
          }
        });
      }
      setCurrentMatchId(id);
      setState(matchState);

      if (matchState.status === 'Completed') {
        setTab("summary");
      } else {
        setTab("live");
      }
    }
  }

  async function handleDeleteMatch(id: string) {
    const result = await deleteMatchFromDb(id);
    if (result.success) {
      if (currentMatchId === id) {
        setCurrentMatchId(null);
        setState(createNewMatch());
      }
    } else {
      alert('Failed to delete match: ' + (result.error || 'Unknown error'));
    }
  }

  async function handleBackToMatches() {
    if (currentMatchId && user) {
      if (hasUnsavedData(currentMatchId)) {
        const shouldLeave = window.confirm(
          "This match has unsaved data. It is stored locally but may not be synced to the server yet. Are you sure you want to leave?"
        );
        if (!shouldLeave) {
          return;
        }
      }

      const isCompleted = state.status === 'completed' || state.status === 'Completed';

      if (!isCompleted) {
        try {
          await saveMatchToDb(currentMatchId, state);
        } catch (err) {
          console.error('Error saving match on back:', err);
        }
      }
    }
    setCurrentMatchId(null);
    setState(createNewMatch());
    setNavScreen("home");
    setSyncError(null);
  }

  async function handleDiscardMatch() {
    if (!currentMatchId || !user) return;

    const isCompleted = state.status === 'completed' || state.status === 'Completed';

    if (isCompleted) {
      alert("Cannot discard a completed match. Completed matches are immutable.");
      return;
    }

    const shouldDiscard = window.confirm(
      "Are you sure you want to discard this match? This cannot be undone."
    );

    if (!shouldDiscard) {
      return;
    }

    // Mark match as abandoned
    const abandonedState = { ...state, status: 'abandoned' as const };

    try {
      await saveMatchToDb(currentMatchId, abandonedState);
      removeMatchLocally(currentMatchId);
    } catch (err) {
      console.error('Error abandoning match:', err);
    }

    // Reset to home
    setCurrentMatchId(null);
    setState(createNewMatch());
    setNavScreen("home");
    setSyncError(null);
  }

  async function handleSaveSetup() {
    if (!currentMatchId || !user) return;

    const draftState = { ...state, status: 'draft' as const };

    saveMatchLocally(currentMatchId, draftState, user.id, false);

    try {
      const result = await saveMatchToDb(currentMatchId, draftState);

      if (result.success) {
        markMatchAsSynced(currentMatchId);
        setSyncError(null);
      } else {
        throw new Error(result.error || 'Failed to save setup');
      }
    } catch (err) {
      console.error('Error saving setup:', err);
      markMatchAsUnsynced(currentMatchId);
      throw err;
    }
  }

  async function handleStartMatch() {
    if (!currentMatchId || !user) return;

    const liveState = { ...state, status: 'live' as const };

    saveMatchLocally(currentMatchId, liveState, user.id, false);

    try {
      const result = await saveMatchToDb(currentMatchId, liveState);

      if (result.success) {
        markMatchAsSynced(currentMatchId);
        setSyncError(null);
        setState(liveState);
        setTab("live");
      } else {
        throw new Error(result.error || 'Failed to start match');
      }
    } catch (err) {
      console.error('Error starting match:', err);
      markMatchAsUnsynced(currentMatchId);
      throw err;
    }
  }

  async function handleMatchComplete() {
    if (!currentMatchId || !user) return;

    const completedState = { ...state, status: 'completed' as const };

    saveMatchLocally(currentMatchId, completedState, user.id, false);

    try {
      const result = await saveMatchToDb(currentMatchId, completedState);

      if (!result.success) {
        const isNetworkError = !navigator.onLine || result.error?.includes('fetch');
        const isAuthError = result.error?.toLowerCase().includes('sign in') ||
                           result.error?.toLowerCase().includes('permission');

        let errorMessage: string;
        if (isAuthError) {
          errorMessage = "Save blocked. Please sign in again to save this completed match. Your data is stored locally.";
        } else if (isNetworkError) {
          errorMessage = "We couldn't save this match due to a network issue, but the full match data is stored on this device. Please try saving again when you have a better connection.";
        } else {
          errorMessage = `Save failed: ${result.error || 'Unknown error'}`;
        }

        console.error('[handleMatchComplete] Supabase error:', result.error);
        setSyncError(errorMessage);
        return;
      }

      if (currentLeagueId && currentFixtureId && currentFixtureHomeTeamId && currentFixtureAwayTeamId) {
        await updateLeagueAfterMatch(
          completedState,
          currentLeagueId,
          currentFixtureId,
          currentFixtureHomeTeamId,
          currentFixtureAwayTeamId,
          currentMatchId
        );
      }

      removeMatchLocally(currentMatchId);
      setSyncError(null);

      setCurrentMatchId(null);
      setCurrentLeagueId(null);
      setCurrentFixtureId(null);
      setCurrentFixtureHomeTeamId(null);
      setCurrentFixtureAwayTeamId(null);
      setState(createNewMatch());
      setNavScreen("home");
    } catch (err) {
      console.error('[handleMatchComplete] Exception:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isNetworkError = !navigator.onLine || errorMsg.includes('fetch') || errorMsg.includes('network');
      const displayMessage = isNetworkError
        ? "We couldn't save this match due to a network issue, but the full match data is stored on this device. Please try saving again when you have a better connection."
        : `Save failed: ${errorMsg}`;
      setSyncError(displayMessage);
    }
  }

  async function handleStartMatchFromFixture(fixture: LeagueFixture, league: League) {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const newState = createNewMatch();
    newState.format = league.format as MatchFormat;
    newState.teamAName = fixture.home_team_name || "Home Team";
    newState.teamBName = fixture.away_team_name || "Away Team";
    applyFormat(newState, newState.format);

    const result = await createNewMatchInDb(newState, league.id, fixture.id);
    if (result.success && result.matchId) {
      setCurrentMatchId(result.matchId);
      setCurrentLeagueId(league.id);
      setCurrentFixtureId(fixture.id);
      setCurrentFixtureHomeTeamId(fixture.home_team_id);
      setCurrentFixtureAwayTeamId(fixture.away_team_id);
      setState(newState);
      setTab("teams");
    } else {
      alert('Failed to create match: ' + (result.error || 'Unknown error'));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading WatchWicket ScoreBox...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <img
              src={watchwicketLogo}
              alt="WatchWicket Logo"
              className="w-48 h-48 object-contain mx-auto mb-6 drop-shadow-2xl filter brightness-110"
            />
            <h1 className="text-3xl font-bold mb-2">WatchWicket ScoreBox</h1>
            <p className="text-slate-400 mb-6">Professional Cricket Scoring App</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Sign in to continue</h2>
            <p className="text-slate-300 text-sm mb-6">
              Create an account or sign in to start scoring cricket matches
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  if (!currentMatchId) {
    return (
      <>
        {navScreen === "home" && (
          <HomePage
            onOpenMenu={() => setShowMenu(true)}
            onNavigateToStats={() => setShowMyStats(true)}
            onStartMatch={handleNewMatch}
          />
        )}
        {navScreen === "myMatches" && (
          <ErrorBoundary>
            <MyMatches
              onClose={() => setNavScreen("home")}
              onViewMatch={handleResumeMatch}
            />
          </ErrorBoundary>
        )}
        {navScreen === "players" && <CricketSquad onBack={() => setNavScreen("home")} />}
        {navScreen === "teams" && <Teams onClose={() => setNavScreen("home")} />}
        {navScreen === "leagues" && (
          <Leagues
            onClose={() => setNavScreen("home")}
            onStartMatchFromFixture={handleStartMatchFromFixture}
            onViewMatch={handleResumeMatch}
          />
        )}
        {navScreen === "support" && <Support onClose={() => setNavScreen("home")} />}

        <BottomNav currentScreen={navScreen} onNavigate={handleNavigate} />

        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="text-white text-xl">Loading...</div>
          </div>
        )}

        {showModeSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-slate-700">
              <h2 className="text-3xl font-black mb-2 text-center text-white">Select Match Format</h2>
              <p className="text-gray-400 text-center mb-8">Choose the type of cricket match you want to score</p>

              <div className="space-y-4 mb-6">
                <button
                  onClick={() => handleCreateMatchWithMode("INDOOR")}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 p-6 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg btn-press"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🏠</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">Indoor Mode</h3>
                      <p className="text-sm text-yellow-100">Full overs, batting restarts, multiple dismissals per player</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleCreateMatchWithMode("T20")}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 p-6 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg btn-press"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">⚡</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">T20 Mode</h3>
                      <p className="text-sm text-green-100">20 overs per side, fast-paced cricket</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleCreateMatchWithMode("ODI")}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-6 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg btn-press"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🏆</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">ODI (50 Overs)</h3>
                      <p className="text-sm text-blue-100">One Day International, 50 overs per side</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowModeSelector(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showStartScheduleModal && <StartScheduleModal onStartNow={handleStartNow} onSchedule={handleSchedule} onCancel={() => { setShowStartScheduleModal(false); setSelectedFormat(null); }} />}

        {showMenu && (
          <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={() => setShowMenu(false)}>
            <div
              className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl z-[9999] overflow-y-auto border-r border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="text-slate-300 hover:text-white text-3xl leading-none"
                    aria-label="Close menu"
                  >
                    ×
                  </button>
                </div>
              </div>
              <nav className="p-4 space-y-2">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowProfile(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>👤</span>
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowSettings(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setNavScreen("players");
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>👥</span>
                  <span>Player Profiles</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setNavScreen("teams");
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>🏏</span>
                  <span>Teams</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setNavScreen("leagues");
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>🏆</span>
                  <span>Leagues</span>
                </button>
                <div className="border-t border-slate-800 my-2"></div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowRules(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>📖</span>
                  <span>Rules of Cricket</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowTerms(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>📄</span>
                  <span>Terms & Conditions</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowAbout(true);
                  }}
                  className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-white transition-colors"
                >
                  <span>ℹ️</span>
                  <span>About</span>
                </button>
                {import.meta.env.DEV && localStorage.getItem('DEBUG') === '1' && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDebugSupabase(true);
                    }}
                    className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-yellow-400 transition-colors"
                  >
                    <span>🔧</span>
                    <span>Debug Supabase</span>
                  </button>
                )}
                {user && (
                  <>
                    <div className="border-t border-slate-800 my-2"></div>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-3 rounded hover:bg-slate-800 flex items-center gap-3 text-red-400 transition-colors"
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

        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        {showProfile && (
          <Profile
            onClose={() => setShowProfile(false)}
            onNavigateToPlayers={() => {
              setShowProfile(false);
              setNavScreen("players");
            }}
          />
        )}
        {showMyStats && <MyStats onClose={() => setShowMyStats(false)} />}
        {showAbout && <About onClose={() => setShowAbout(false)} />}
        {showRules && <Rules onClose={() => setShowRules(false)} />}
        {showTerms && <TermsConditions onClose={() => setShowTerms(false)} />}
        {showUserAgreement && <UserAgreement onClose={() => setShowUserAgreement(false)} />}
        {showDebugSupabase && <DebugSupabase />}
      </>
    );
  }

  const oversLabel =
    state.oversLimit === null ? "Unlimited (Test)" : `${state.oversLimit} overs`;

  const tossDisplay = state.toss?.winnerTeam && state.toss?.decision
    ? `${state.toss.winnerTeam === "A" ? state.teamAName : state.teamBName} won toss, chose to ${state.toss.decision === "BAT" ? "bat" : "bowl"}`
    : "Toss not set";

  // Get current inning data for scoreboard
  const currentInning = state.innings[state.currentInnings];
  const overs = currentInning ? Math.floor(currentInning.totalBalls / 6) : 0;
  const balls = currentInning ? currentInning.totalBalls % 6 : 0;
  const currentRunRate = currentInning && currentInning.totalBalls > 0
    ? ((currentInning.totalRuns / currentInning.totalBalls) * 6).toFixed(2)
    : "0.00";

  const battingTeamName = currentInning?.battingTeam === "A" ? state.teamAName : state.teamBName;
  const isMatchLive = state.status === 'live' || state.status === 'Live' || state.status === 'in_progress';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative scorebox-container">
      {/* Background layers */}
      <div className="stadium-background"></div>
      <div className="noise-overlay"></div>
      <div className="vignette-overlay"></div>

      {/* Sticky scoreboard bar */}
      <div className="sticky top-0 z-40 scoreboard-bar">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Menu button */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-slate-300 hover:text-white p-2 hover:bg-slate-800/50 rounded-lg transition-colors flex-shrink-0"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* LIVE badge & match info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isMatchLive && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  <span className="text-red-500 font-black text-xs uppercase tracking-wider">LIVE</span>
                </div>
              )}

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-white font-black text-lg truncate">{battingTeamName}</span>
                <span className="text-emerald-400 font-black text-xl">{currentInning?.totalRuns || 0}/{currentInning?.wickets || 0}</span>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-sm text-slate-400">
                <span>Overs: {overs}.{balls}</span>
                <span>•</span>
                <span>RR: {currentRunRate}</span>
              </div>
            </div>

            {/* Format badge */}
            <div className="format-badge flex-shrink-0">
              {state.format === "INDOOR" ? "INDOOR" : state.format === "T20" ? "T20" : state.format === "ODI" ? "ODI" : "TEST"}
            </div>
          </div>

          {/* Venue/match info (mobile - second row) */}
          <div className="sm:hidden flex items-center gap-3 text-xs text-slate-400 mt-2">
            <span>Overs: {overs}.{balls}</span>
            <span>•</span>
            <span>RR: {currentRunRate}</span>
            <span>•</span>
            <span className="truncate">{state.teamAName} vs {state.teamBName}</span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-32 relative min-h-screen">
        <Watermark />
        <div className="relative z-10">
        {tab === "live" && <LiveScore state={state} setState={setState} isPro={isPro} onMatchComplete={handleMatchComplete} />}
        {tab === "scorecard" && <Scorecard state={state} />}
        {tab === "summary" && <MatchSummary state={state} isPro={isPro} matchId={currentMatchId || undefined} />}
        {tab === "teams" && (
          <TeamSheet
            state={state}
            setState={setState}
            isPro={isPro}
            onDiscardMatch={handleDiscardMatch}
            onSaveSetup={handleSaveSetup}
            onStartMatch={handleStartMatch}
            matchId={currentMatchId}
          />
        )}
        {tab === "commentary" && <Commentary state={state} />}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 broadcast-bottom-nav z-50 pb-safe">
        <div className="max-w-5xl mx-auto grid grid-cols-5 px-2 pt-2">
          <NavItem icon="🏏" label="Live" active={tab === "live"} onClick={() => setTab("live")} />
          <NavItem icon="📊" label="Card" active={tab === "scorecard"} onClick={() => setTab("scorecard")} />
          <NavItem icon="📝" label="Summary" active={tab === "summary"} onClick={() => setTab("summary")} />
          <NavItem icon="👥" label="Teams" active={tab === "teams"} onClick={() => setTab("teams")} />
          <NavItem icon="💬" label="Comm" active={tab === "commentary"} onClick={() => setTab("commentary")} />
        </div>
      </nav>

      <style>{`
        /* Broadcast background system */
        .stadium-background {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #0a0f0d 0%, #0d1512 30%, #101a16 60%, #0a0f0d 100%);
          z-index: 0;
        }

        .stadium-background::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 1200px 600px at 20% 20%, rgba(20, 80, 40, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 1000px 500px at 80% 40%, rgba(20, 80, 40, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 800px 400px at 50% 80%, rgba(15, 60, 30, 0.1) 0%, transparent 50%);
          z-index: 1;
        }

        .noise-overlay {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
          opacity: 0.3;
          z-index: 2;
          pointer-events: none;
        }

        .vignette-overlay {
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(0, 0, 0, 0.6) 100%);
          z-index: 3;
          pointer-events: none;
        }

        /* Sticky scoreboard bar */
        .scoreboard-bar {
          background: rgba(10, 15, 13, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .format-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.375rem 0.75rem;
          border-radius: 0.5rem;
          background: rgba(16, 185, 129, 0.15);
          color: rgb(16, 185, 129);
          border: 1px solid rgba(16, 185, 129, 0.3);
          letter-spacing: 0.05em;
        }

        /* Bottom nav broadcast style */
        .broadcast-bottom-nav {
          background: rgba(10, 15, 13, 0.98);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.6);
        }

        .scorebox-container {
          position: relative;
          overflow-x: hidden;
        }
      `}</style>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showProfile && (
        <Profile
          onClose={() => setShowProfile(false)}
          onNavigateToPlayers={() => {
            setShowProfile(false);
            setShowCricketSquad(true);
          }}
        />
      )}
      {showCricketSquad && <CricketSquad onBack={() => setShowCricketSquad(false)} />}
      {showAbout && <About onClose={() => setShowAbout(false)} />}
      {showRules && <Rules onClose={() => setShowRules(false)} />}
      {showTerms && <TermsConditions onClose={() => setShowTerms(false)} />}
      {showUserAgreement && <UserAgreement onClose={() => setShowUserAgreement(false)} />}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-white text-xl">Loading...</div>
        </div>
      )}

      {/* Hamburger Menu Drawer - Fixed positioning for proper display */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={() => setShowMenu(false)}>
          <div
            className="fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-green-900 to-green-950 shadow-2xl z-[9999] overflow-y-auto border-r border-green-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-green-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-green-300 hover:text-white text-3xl leading-none"
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleBackToMatches();
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>🏠</span>
                <span>Home</span>
              </button>
              <div className="border-t border-green-800 my-2"></div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowProfile(true);
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>👤</span>
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowCricketSquad(true);
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>👥</span>
                <span>Player Profiles</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowCricketSquad(true);
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>🏏</span>
                <span>Teams</span>
              </button>
              <div className="border-t border-green-800 my-2"></div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowRules(true);
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>📖</span>
                <span>Rules of Cricket</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowTerms(true);
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>📄</span>
                <span>Terms & Conditions</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowAbout(true);
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>ℹ️</span>
                <span>About</span>
              </button>
              <div className="border-t border-green-800 my-2"></div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowSettings(true);
                }}
                className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-white transition-colors"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
              {user && (
                <>
                  <div className="border-t border-green-800 my-2"></div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      signOut();
                    }}
                    className="w-full text-left px-4 py-3 rounded hover:bg-green-800 flex items-center gap-3 text-red-400 transition-colors"
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

      {syncError && (
        <div className="fixed top-4 left-4 right-4 bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-lg z-[70] max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold mb-1">Sync Error</p>
              <p className="text-sm">{syncError}</p>
            </div>
            <button
              onClick={() => setSyncError(null)}
              className="text-red-200 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!isOnline && currentMatchId && (
        <div className="fixed bottom-20 left-4 right-4 bg-yellow-900 border border-yellow-700 text-yellow-100 px-4 py-3 rounded-lg shadow-lg z-[70] max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold">No Internet Connection</p>
              <p className="text-sm">Your match data is being saved locally and will sync when you're back online.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all duration-200 ${
        active
          ? "bg-green-900/50 text-green-300 font-bold"
          : "text-green-400 hover:text-green-200 hover:bg-green-900/30"
      }`}
    >
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
