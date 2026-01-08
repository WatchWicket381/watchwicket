import React, { useEffect, useState, useRef } from "react";
import { listMatchSummariesFromDb, MatchListSummary, deleteMatchFromDb } from "../store/supabaseMatches";
import { useAuth } from "../contexts/AuthContext";
import { normalizeStatus, getStatusLabel, getStatusColor } from "../utils/matchStatus";

interface MyMatchesProps {
  onClose: () => void;
  onViewMatch: (matchId: string) => void;
}

const MATCHES_PER_PAGE = 20;
const matchesCache = new Map<string, { data: MatchListSummary[]; timestamp: number }>();
const CACHE_DURATION = 30000;

const MyMatches: React.FC<MyMatchesProps> = ({ onClose, onViewMatch }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchListSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      loadData(false);
    }
  }, [user]);

  async function loadData(useCache: boolean = true) {
    console.log('[MyMatches] Loading matches...');

    if (!user) {
      console.log('[MyMatches] No user, skipping load');
      setLoading(false);
      return;
    }

    const cacheKey = `matches_${user.id}`;
    const cached = matchesCache.get(cacheKey);
    const now = Date.now();

    if (useCache && cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('[MyMatches] Using cached data');
      setMatches(cached.data);
      setLoading(false);
      setHasMore(cached.data.length >= MATCHES_PER_PAGE);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setOffset(0);

      const allMatches = await listMatchSummariesFromDb(MATCHES_PER_PAGE);
      console.log('[MyMatches] Received matches:', allMatches.length);

      const safeMatches = allMatches ?? [];
      setMatches(safeMatches);
      setHasMore(safeMatches.length >= MATCHES_PER_PAGE);

      matchesCache.set(cacheKey, { data: safeMatches, timestamp: now });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading matches';
      console.error('[MyMatches] Error loading matches:', errorMessage);
      setError(errorMessage);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (!user) return;

    setRefreshing(true);
    const cacheKey = `matches_${user.id}`;
    matchesCache.delete(cacheKey);

    try {
      setOffset(0);
      const allMatches = await listMatchSummariesFromDb(MATCHES_PER_PAGE);
      const safeMatches = allMatches ?? [];
      setMatches(safeMatches);
      setHasMore(safeMatches.length >= MATCHES_PER_PAGE);
      matchesCache.set(cacheKey, { data: safeMatches, timestamp: Date.now() });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setMatches([]);
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMore() {
    if (!user || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextOffset = offset + MATCHES_PER_PAGE;
      const newMatches = await listMatchSummariesFromDb(MATCHES_PER_PAGE, nextOffset);
      const safeNewMatches = newMatches ?? [];

      if (safeNewMatches.length < MATCHES_PER_PAGE) {
        setHasMore(false);
      }

      setMatches(prev => [...prev, ...safeNewMatches]);
      setOffset(nextOffset);
    } catch (err) {
      console.error('[MyMatches] Error loading more:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirmId === id) {
      const result = await deleteMatchFromDb(id);
      if (result.success) {
        if (user) {
          const cacheKey = `matches_${user.id}`;
          matchesCache.delete(cacheKey);
        }
        setMatches(prev => prev.filter(m => m.id !== id));
      } else {
        alert("Failed to delete match: " + (result.error || "Unknown error"));
      }
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


  const sortedMatches = [...matches].sort((a, b) => {
    const isALive = normalizeStatus(a.status) === "live";
    const isBLive = normalizeStatus(b.status) === "live";
    if (isALive && !isBLive) return -1;
    if (!isALive && isBLive) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const ongoingMatches = sortedMatches.filter(m => normalizeStatus(m.status) === "live");
  const completedMatches = sortedMatches.filter(m => normalizeStatus(m.status) === "completed");
  const upcomingMatches = sortedMatches.filter(m => normalizeStatus(m.status) === "draft");

  if (loading && matches.length === 0) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#012b1b] via-[#064428] to-[#012b1b] z-50 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">My Matches</h1>
            <button
              onClick={onClose}
              className="text-green-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#012b1b] via-[#064428] to-[#012b1b] z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-4">
            <div className="text-red-400 text-5xl mb-3 text-center">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2 text-center">
              Error Loading Matches
            </h2>
            <p className="text-sm text-slate-300 mb-4 text-center">
              {error}
            </p>
            <button
              onClick={loadData}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#012b1b] via-[#064428] to-[#012b1b] z-50 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">My Matches</h1>
            <button
              onClick={onClose}
              className="text-green-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          <div className="bg-[#064428]/40 rounded-xl p-8 text-center border border-[#0b5c33]/50">
            <p className="text-green-300">Please sign in to view your matches</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#012b1b] via-[#064428] to-[#012b1b] z-50 overflow-y-auto pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">My Matches</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-green-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh matches"
            >
              <svg
                className={`w-6 h-6 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-green-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="bg-[#064428]/40 rounded-xl p-12 text-center border border-[#0b5c33]/50">
            <div className="text-6xl mb-4">🏏</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No Matches Yet</h3>
            <p className="text-green-300">
              Tap the red cricket ball to start your first match
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {ongoingMatches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-green-400 mb-3">Ongoing Matches</h2>
                <div className="space-y-3">
                  {ongoingMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onView={onViewMatch}
                      onDelete={handleDelete}
                      deleteConfirmId={deleteConfirmId}
                    />
                  ))}
                </div>
              </div>
            )}

            {completedMatches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-400 mb-3">Completed Matches</h2>
                <div className="space-y-3">
                  {completedMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onView={onViewMatch}
                      onDelete={handleDelete}
                      deleteConfirmId={deleteConfirmId}
                    />
                  ))}
                </div>
              </div>
            )}

            {upcomingMatches.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-blue-400 mb-3">Upcoming Matches</h2>
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      onView={onViewMatch}
                      onDelete={handleDelete}
                      deleteConfirmId={deleteConfirmId}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasMore && (
              <div className="pt-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    `Load More (${matches.length} shown)`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function MatchCard({
  match,
  onView,
  onDelete,
  deleteConfirmId,
}: {
  match: MatchListSummary;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  deleteConfirmId: string | null;
}) {
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

  function getMatchDate(): string {
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


  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
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
              {getStatusLabel(match.status)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold">
              {getFormatDisplay(match.format)}
            </span>
            <span>•</span>
            <span className="truncate">{getMatchDate()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onView(match.id)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg"
          >
            {normalizeStatus(match.status) === "live" ? "Resume" : "View"}
          </button>
          <button
            onClick={() => onDelete(match.id)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg ${
              deleteConfirmId === match.id
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                : "bg-slate-700 hover:bg-slate-600 border border-slate-600"
            }`}
          >
            {deleteConfirmId === match.id ? "Confirm?" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-700 rounded w-3/4"></div>
          <div className="flex items-center gap-3">
            <div className="h-4 bg-slate-700 rounded w-20"></div>
            <div className="h-4 bg-slate-700 rounded w-32"></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 bg-slate-700 rounded w-20"></div>
          <div className="h-10 bg-slate-700 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export default MyMatches;
