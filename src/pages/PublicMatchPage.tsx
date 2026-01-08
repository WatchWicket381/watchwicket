import React, { useEffect, useState } from "react";
import { getPublicMatchById } from "../store/supabaseMatches";
import watchwicketLogo from "../assets/file_00000000711072438e9d72dabae9eda2.png";

interface PublicMatchPageProps {
  matchId: string;
}

interface BallData {
  runs: number;
  isWicket: boolean;
  isWide?: boolean;
  isNoBall?: boolean;
}

interface MatchData {
  id: string;
  teamA: string;
  teamB: string;
  status: "live" | "upcoming" | "completed";
  format: string;
  currentInnings: number;
  innings: Array<{
    battingTeam: string;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
  }>;
  currentBatsmen?: Array<{
    name: string;
    runs: number;
    balls: number;
  }> | null;
  currentBowler?: {
    name: string;
    overs: string;
    runs: number;
    wickets: number;
  } | null;
  lastSixBalls?: BallData[] | null;
  result?: string;
  lastUpdated: string;
}

export default function PublicMatchPage({ matchId }: PublicMatchPageProps) {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    const loadMatch = async () => {
      setLoading(true);
      setError(null);

      console.log('[PublicMatchPage] Loading match:', matchId);

      const data = await getPublicMatchById(matchId);

      if (!data) {
        console.log('[PublicMatchPage] Match not found:', matchId);
        setError('not_found');
      } else {
        console.log('[PublicMatchPage] Match loaded:', data);
        setMatch(data);
      }

      setLoading(false);
    };

    loadMatch();
  }, [matchId]);

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
    setShowShareMenu(false);
  };

  const handleWhatsAppShare = () => {
    const url = window.location.href;
    const text = match ? `Check out this cricket match: ${match.teamA} vs ${match.teamB}` : 'Check out this cricket match';
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      "_blank"
    );
    setShowShareMenu(false);
  };

  const renderBallIcon = (ball: BallData) => {
    if (ball.isWicket) {
      return (
        <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
          W
        </div>
      );
    }
    if (ball.runs === 6) {
      return (
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
          6
        </div>
      );
    }
    if (ball.runs === 4) {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
          4
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
        {ball.runs}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error === 'not_found' || !match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Match Not Found</h1>
          <p className="text-slate-400 mb-4">The match you're looking for doesn't exist or is not public.</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pb-8">
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => (window.location.href = "/")}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <img
                src={watchwicketLogo}
                alt="WatchWicket"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-lg">WatchWicket</span>
            </div>
            <button
              onClick={handleShare}
              className="text-slate-400 hover:text-white transition-colors relative"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          </div>

          {showShareMenu && (
            <div className="absolute right-4 top-16 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 z-50">
              <button
                onClick={handleCopyLink}
                className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Link
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="w-full text-left px-4 py-2 hover:bg-slate-700 rounded flex items-center gap-2 text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span
                className={`${
                  match.status === "live"
                    ? "bg-red-500"
                    : match.status === "upcoming"
                    ? "bg-emerald-500"
                    : "bg-slate-700"
                } text-white text-xs font-bold px-2 py-1 rounded`}
              >
                {match.status === "live" ? "LIVE" : match.status === "upcoming" ? "UPCOMING" : "COMPLETED"}
              </span>
              <span className="text-slate-400 text-sm">{match.format}</span>
            </div>
            {match.lastUpdated && (
              <span className="text-slate-400 text-xs">
                {match.lastUpdated}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-6">
            {match.teamA} vs {match.teamB}
          </h1>

          <div className="space-y-4">
            {match.innings.map((inning, idx) => (
              <div
                key={idx}
                className={`bg-slate-900/50 rounded-lg p-4 ${
                  match.status === "live" && idx === match.currentInnings
                    ? "border-2 border-green-500"
                    : "border border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-lg mb-1">
                      {inning.battingTeam}
                    </div>
                    <div className="text-slate-400 text-sm">
                      Overs: {inning.overs}.{inning.balls}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-3xl">
                      {inning.runs}/{inning.wickets}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {match.status === "completed" && match.result && (
            <div className="mt-6 bg-green-600/20 border border-green-600 rounded-lg p-4 text-center">
              <div className="text-green-400 font-bold text-lg">
                {match.result}
              </div>
            </div>
          )}
        </div>

        {match.status === "live" && match.currentBatsmen && match.currentBatsmen.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Current Batsmen</h2>
            <div className="space-y-3">
              {match.currentBatsmen.map((batsman, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">
                      {batsman.name}
                    </span>
                    {idx === 0 && (
                      <span className="text-green-400 text-xs">●</span>
                    )}
                  </div>
                  <div className="text-slate-400 text-sm">
                    {batsman.runs} ({batsman.balls})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {match.status === "live" && match.currentBowler && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Current Bowler</h2>
            <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
              <span className="text-white font-semibold">
                {match.currentBowler.name}
              </span>
              <div className="text-slate-400 text-sm">
                {match.currentBowler.overs} Ov • {match.currentBowler.runs} R •{" "}
                {match.currentBowler.wickets} W
              </div>
            </div>
          </div>
        )}

        {match.status === "live" && match.lastSixBalls && match.lastSixBalls.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">Last 6 Balls</h2>
            <div className="flex items-center gap-2 overflow-x-auto">
              {match.lastSixBalls.map((ball, idx) => (
                <div key={idx}>{renderBallIcon(ball)}</div>
              ))}
            </div>
          </div>
        )}

        {match.status === "upcoming" && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-xl text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-slate-300 text-lg font-semibold mb-2">Match not started yet</p>
            <p className="text-slate-400">Check back soon for live updates</p>
          </div>
        )}
      </main>
    </div>
  );
}
