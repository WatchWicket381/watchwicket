import React, { useEffect, useState } from "react";
import { getLivePublicMatches } from "../store/supabaseMatches";
import watchwicketLogo from "../assets/file_00000000711072438e9d72dabae9eda2.png";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../contexts/AuthContext";

interface MatchCard {
  id: string;
  teamA: string;
  teamB: string;
  status: "live" | "upcoming" | "completed";
  scoreA?: string;
  scoreB?: string;
  overs?: string;
  format?: string;
  result?: string;
  startTime?: string;
  venue?: string;
  lastUpdated?: string;
}

function StatusStripCompact() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: string; icon: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current=temperature_2m,weathercode`)
            .then(res => res.json())
            .then(data => {
              if (data.current) {
                const weatherIcons: { [key: number]: string } = {
                  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
                  45: '🌫️', 48: '🌫️',
                  51: '🌦️', 53: '🌦️', 55: '🌦️',
                  61: '🌧️', 63: '🌧️', 65: '🌧️',
                  71: '🌨️', 73: '🌨️', 75: '🌨️',
                  95: '⛈️'
                };
                const icon = weatherIcons[data.current.weathercode] || '☀️';
                setWeather({
                  temp: `${Math.round(data.current.temperature_2m)}°C`,
                  icon
                });
              }
            })
            .catch(() => setWeather({ temp: '—', icon: '☁️' }));
        },
        () => {
          setWeather({ temp: '—', icon: '☁️' });
        }
      );
    } else {
      setWeather({ temp: '—', icon: '☁️' });
    }
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <span className="font-mono font-semibold tracking-wide text-[10px] sm:text-xs">{formatTime(currentTime)}</span>
      <span className="opacity-50">•</span>
      <span className="font-medium text-[10px] sm:text-xs">{formatDate(currentTime)}</span>
      {weather && (
        <>
          <span className="opacity-50">•</span>
          <span className="flex items-center gap-1">
            <span className="text-xs">{weather.icon}</span>
            <span className="font-medium text-[10px] sm:text-xs">{weather.temp}</span>
          </span>
        </>
      )}
    </>
  );
}

function SkeletonCard({ type = "default" }: { type?: "default" | "compact" | "featured" }) {
  if (type === "featured") {
    return (
      <div className="glass-card p-6 animate-pulse h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-20 bg-emerald-700/30 rounded"></div>
          <div className="h-4 w-16 bg-emerald-700/30 rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-emerald-700/30 rounded"></div>
            <div className="h-8 w-24 bg-emerald-700/30 rounded"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-6 w-36 bg-emerald-700/30 rounded"></div>
            <div className="h-8 w-28 bg-emerald-700/30 rounded"></div>
          </div>
        </div>
        <div className="mt-4 h-4 w-32 bg-emerald-700/30 rounded"></div>
      </div>
    );
  }

  if (type === "compact") {
    return (
      <div className="glass-card p-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 w-28 bg-emerald-700/30 rounded"></div>
            <div className="h-4 w-24 bg-emerald-700/30 rounded"></div>
          </div>
          <div className="h-4 w-20 bg-emerald-700/30 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 bg-emerald-700/30 rounded"></div>
        <div className="h-4 w-12 bg-emerald-700/30 rounded"></div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-emerald-700/30 rounded"></div>
          <div className="h-6 w-16 bg-emerald-700/30 rounded"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-5 w-28 bg-emerald-700/30 rounded"></div>
          <div className="h-6 w-20 bg-emerald-700/30 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function PublicHomePage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNavLink, setActiveNavLink] = useState("live");
  const { user } = useAuth();

  useEffect(() => {
    const loadMatches = async () => {
      console.log('[PublicHomePage] Loading public matches...');
      const data = await getLivePublicMatches();
      console.log('[PublicHomePage] Received matches:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('[PublicHomePage] Match IDs:', data.map(m => m.id));
        console.log('[PublicHomePage] Match statuses:', data.map(m => ({ id: m.id, status: m.status })));
      } else {
        console.warn('[PublicHomePage] No matches received from getLivePublicMatches()');
      }
      setMatches(data || []);
      setLoading(false);
    };

    loadMatches();
  }, []);

  const liveMatches = matches.filter(m => m.status === "live");
  const upcomingMatches = matches.filter(m => m.status === "upcoming");
  const recentResults = matches.filter(m => m.status === "completed");

  useEffect(() => {
    console.log('[PublicHomePage] Total matches in state:', matches.length);
    console.log('[PublicHomePage] LIVE matches:', liveMatches.length, liveMatches.map(m => ({ id: m.id, status: m.status, teamA: m.teamA, teamB: m.teamB })));
    console.log('[PublicHomePage] UPCOMING matches:', upcomingMatches.length, upcomingMatches.map(m => ({ id: m.id, status: m.status, teamA: m.teamA, teamB: m.teamB })));
    console.log('[PublicHomePage] COMPLETED matches:', recentResults.length, recentResults.map(m => ({ id: m.id, status: m.status, teamA: m.teamA, teamB: m.teamB })));
  }, [matches, liveMatches, upcomingMatches, recentResults]);

  React.useEffect(() => {
    if (user) {
      window.location.href = '/scorebox';
    }
  }, [user]);

  const handleMatchClick = (matchId: string) => {
    window.location.href = `/match/${matchId}`;
  };

  const scrollToSection = (sectionId: string) => {
    setActiveNavLink(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const featuredMatch = liveMatches[0];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="stadium-background"></div>
      <div className="noise-overlay"></div>
      <div className="vignette-overlay"></div>

      <header className="sticky top-0 z-50 glass-navbar border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-slate-300 hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-3 lg:flex-1">
              <img
                src={watchwicketLogo}
                alt="WatchWicket"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">WatchWicket</h1>
            </div>

            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {[
                { id: 'live', label: 'Live' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'results', label: 'Results' },
                { id: 'teams', label: 'Teams' },
                { id: 'leagues', label: 'Leagues' }
              ].map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
                    activeNavLink === link.id
                      ? 'text-white'
                      : 'text-slate-300/80 hover:text-white'
                  }`}
                >
                  {link.label}
                  {activeNavLink === link.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>

            <div className="flex flex-col items-end gap-2 lg:flex-1 justify-end">
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg hover:shadow-emerald-500/30"
              >
                <span className="hidden sm:inline">Login to ScoreBox</span>
                <span className="sm:hidden">Login</span>
              </button>

              {/* Time/Date/Weather - Compact Header Version */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-400/80 flex-wrap justify-end">
                <StatusStripCompact />
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-black/30 backdrop-blur-xl">
            <nav className="flex flex-col p-4 space-y-2">
              {[
                { id: 'live', label: 'Live' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'results', label: 'Results' },
                { id: 'teams', label: 'Teams' },
                { id: 'leagues', label: 'Leagues' }
              ].map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 font-medium"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="relative z-10">
        <section className="hero-glow py-8 sm:py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-4 uppercase tracking-tight leading-[0.95] sm:leading-tight">
                    LIVE COMMUNITY<br />CRICKET
                  </h2>
                  <p className="text-slate-300/90 text-base sm:text-lg md:text-xl max-w-lg leading-relaxed">
                    Real-time scores from matches near you. Follow your local teams and track every ball.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => scrollToSection('live')}
                    className="bg-emerald-600/90 text-white hover:bg-emerald-600 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-emerald-600/30 hover:scale-105"
                  >
                    View Live Matches
                  </button>
                  <button
                    onClick={() => scrollToSection('upcoming')}
                    className="glass-card border border-slate-500/30 text-slate-200 hover:border-slate-400/50 hover:text-white px-8 py-4 rounded-xl font-bold text-lg transition-all backdrop-blur-xl"
                  >
                    Browse Fixtures
                  </button>
                </div>
              </div>

              <div>
                {loading ? (
                  <SkeletonCard type="featured" />
                ) : featuredMatch ? (
                  <div className="glass-card-highlight p-6 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => handleMatchClick(featuredMatch.id)}>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                      </div>
                      <span className="text-slate-400/80 text-sm">{featuredMatch.format}</span>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-2xl">{featuredMatch.teamA}</span>
                        <span className="text-emerald-400 font-black text-3xl">{featuredMatch.scoreA}</span>
                      </div>
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-2xl">{featuredMatch.teamB}</span>
                        <span className="text-white/90 font-black text-3xl">{featuredMatch.scoreB || "Yet to bat"}</span>
                      </div>
                    </div>

                    {featuredMatch.overs && (
                      <div className="mt-5 flex items-center justify-between text-slate-400/80 text-sm">
                        <span>Overs: {featuredMatch.overs}</span>
                        <span className="text-xs">{featuredMatch.lastUpdated}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <div className="text-7xl mb-4">🏏</div>
                    <p className="text-slate-300 text-xl font-semibold mb-2">No live matches</p>
                    <p className="text-slate-400/70">Check back soon for live action</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section id="live" className="scroll-mt-20">
                <div className="section-panel-live rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide">LIVE NOW</h2>
                  </div>

                  {loading ? (
                    <div className="space-y-4">
                      <SkeletonCard />
                      <SkeletonCard />
                      <SkeletonCard />
                    </div>
                  ) : liveMatches.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {liveMatches.slice(0, 3).map((match) => (
                          <div
                            key={match.id}
                            onClick={() => handleMatchClick(match.id)}
                            className="glass-card p-4 cursor-pointer hover:scale-[1.01] transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded shadow-lg shadow-red-500/20">
                                  LIVE
                                </span>
                                <span className="text-slate-400/80 text-sm">{match.format}</span>
                              </div>
                              <span className="text-slate-400/60 text-xs">{match.lastUpdated}</span>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-bold text-lg">{match.teamA}</span>
                                <span className="text-emerald-400 font-black text-xl">{match.scoreA}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white font-bold text-lg">{match.teamB}</span>
                                <span className="text-white/90 font-black text-xl">{match.scoreB || "Yet to bat"}</span>
                              </div>
                            </div>

                            {match.overs && (
                              <div className="mt-3 text-slate-300/70 text-sm">Overs: {match.overs}</div>
                            )}
                          </div>
                        ))}
                      </div>
                      {liveMatches.length > 3 && (
                        <button className="mt-4 text-emerald-400 hover:text-slate-300 font-semibold flex items-center gap-2 transition-colors group">
                          <span>View all live matches</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏏</div>
                      <p className="text-slate-300 text-lg font-medium mb-2">No live matches right now</p>
                      <p className="text-slate-400/70 text-sm">Check upcoming fixtures below</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section id="upcoming" className="scroll-mt-20">
                <div className="section-panel-upcoming rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2.5 h-2.5 bg-emerald-500/70 rounded-full shadow-lg shadow-emerald-500/30"></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">UPCOMING</h2>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      <SkeletonCard type="compact" />
                      <SkeletonCard type="compact" />
                      <SkeletonCard type="compact" />
                    </div>
                  ) : upcomingMatches.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingMatches.slice(0, 5).map((match) => (
                        <div
                          key={match.id}
                          onClick={() => handleMatchClick(match.id)}
                          className="glass-card p-3 cursor-pointer hover:border-slate-400/30 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300/80 text-xs font-semibold">{match.format}</span>
                            <span className="text-slate-300/80 text-xs">{match.startTime}</span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-white font-semibold text-sm">{match.teamA}</div>
                            <div className="text-slate-400/50 text-xs">vs</div>
                            <div className="text-white font-semibold text-sm">{match.teamB}</div>
                          </div>
                          {match.venue && (
                            <div className="text-slate-400/50 text-xs mt-2">{match.venue}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📅</div>
                      <p className="text-slate-300/80 text-sm font-medium">No upcoming matches</p>
                    </div>
                  )}
                </div>
              </section>

              <section id="results" className="scroll-mt-20">
                <div className="section-panel-results rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2.5 h-2.5 bg-yellow-500/70 rounded-full shadow-lg shadow-yellow-500/30"></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">RESULTS</h2>
                  </div>

                  {loading ? (
                    <div className="space-y-3">
                      <SkeletonCard type="compact" />
                      <SkeletonCard type="compact" />
                    </div>
                  ) : recentResults.length > 0 ? (
                    <>
                      <div className="space-y-3">
                        {recentResults.slice(0, 4).map((match) => (
                          <div
                            key={match.id}
                            onClick={() => handleMatchClick(match.id)}
                            className="glass-card p-3 cursor-pointer hover:border-slate-400/30 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-slate-400 text-xs font-semibold">{match.format}</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/90 font-semibold">{match.teamA}</span>
                                <span className="text-slate-300 font-bold">{match.scoreA}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white/90 font-semibold">{match.teamB}</span>
                                <span className="text-slate-300 font-bold">{match.scoreB}</span>
                              </div>
                            </div>
                            {match.result && (
                              <div className="mt-2 text-emerald-400 text-xs font-semibold">{match.result}</div>
                            )}
                          </div>
                        ))}
                      </div>
                      {recentResults.length > 4 && (
                        <button className="mt-3 text-emerald-400 hover:text-slate-300 text-sm font-semibold flex items-center gap-1 transition-colors group">
                          <span>View all</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🏆</div>
                      <p className="text-slate-400/80 text-sm font-medium">No recent results</p>
                    </div>
                  )}
                </div>
              </section>

              <section id="teams" className="scroll-mt-20">
                <div className="section-panel-teams rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></div>
                    <h2 className="text-xl font-black text-white uppercase tracking-wide">TEAMS</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="glass-card p-4 cursor-pointer text-center hover:border-slate-400/30 transition-all"
                      >
                        <div className="w-10 h-10 bg-emerald-600/20 rounded-full mx-auto mb-2 flex items-center justify-center text-xl">
                          🏏
                        </div>
                        <div className="text-white font-semibold text-xs">Team {i}</div>
                      </div>
                    ))}
                  </div>

                  <button className="mt-4 text-emerald-400 hover:text-slate-300 text-sm font-semibold flex items-center gap-1 transition-colors mx-auto group">
                    <span>View all</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </section>
            </div>
          </div>

          <section id="leagues" className="scroll-mt-20 mt-8">
            <div className="section-panel-leagues rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2.5 h-2.5 bg-amber-500/70 rounded-full shadow-lg shadow-amber-500/30"></div>
                <h2 className="text-2xl font-black text-white uppercase tracking-wide">LEAGUES</h2>
              </div>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-slate-300/80 text-lg font-medium">Leagues coming soon</p>
                <p className="text-slate-400/60 text-sm mt-2">Organize and manage your cricket leagues</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-300/50 text-sm">
            © {new Date().getFullYear()} WatchWicket. Live cricket scores for local and community cricket.
          </p>
        </div>
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <style>{`
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
            radial-gradient(ellipse 1200px 600px at 20% 20%, rgba(25, 90, 50, 0.18) 0%, transparent 50%),
            radial-gradient(ellipse 1000px 500px at 80% 40%, rgba(25, 90, 50, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 800px 400px at 50% 80%, rgba(20, 75, 40, 0.12) 0%, transparent 50%);
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

        .hero-glow {
          position: relative;
          overflow: hidden;
        }

        /* Stadium atmospheric layer - HERO ONLY */
        .hero-glow::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            /* Stadium image with enhanced visibility */
            url('data:image/svg+xml,%3Csvg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3CradialGradient id="stadium" cx="50%25" cy="60%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(25,75,45);stop-opacity:0.25" /%3E%3Cstop offset="35%25" style="stop-color:rgb(20,60,35);stop-opacity:0.18" /%3E%3Cstop offset="70%25" style="stop-color:rgb(15,45,25);stop-opacity:0.12" /%3E%3Cstop offset="100%25" style="stop-color:rgb(8,20,12);stop-opacity:0" /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width="1920" height="1080" fill="url(%23stadium)" /%3E%3Cellipse cx="960" cy="400" rx="800" ry="200" fill="rgb(30,90,55)" opacity="0.14" /%3E%3Cellipse cx="960" cy="400" rx="600" ry="150" fill="rgb(35,100,60)" opacity="0.10" /%3E%3Cellipse cx="300" cy="200" rx="150" ry="80" fill="rgb(220,220,180)" opacity="0.04" /%3E%3Cellipse cx="1600" cy="200" rx="150" ry="80" fill="rgb(220,220,180)" opacity="0.04" /%3E%3C/svg%3E'),
            /* Enhanced field lighting effect */
            radial-gradient(ellipse 1000px 350px at 50% 45%, rgba(34, 197, 94, 0.10) 0%, transparent 70%);
          background-size: cover;
          background-position: center 35%;
          background-repeat: no-repeat;
          opacity: 1;
          filter: blur(3px);
          pointer-events: none;
        }

        /* Dark gradient overlay for depth - HERO ONLY */
        .hero-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            /* Top lighting glow - enhanced */
            radial-gradient(ellipse 1400px 400px at 50% 10%, rgba(25, 90, 50, 0.22) 0%, transparent 60%),
            /* Center field subtle brightness - enhanced */
            radial-gradient(ellipse 1000px 500px at 50% 50%, rgba(30, 95, 60, 0.12) 0%, transparent 65%),
            /* Bottom darkness for depth - lighter to show stadium */
            linear-gradient(to bottom,
              rgba(10, 15, 13, 0.2) 0%,
              rgba(10, 15, 13, 0.4) 60%,
              rgba(10, 15, 13, 0.65) 100%
            );
          pointer-events: none;
        }

        /* Ensure hero content sits above all background layers */
        .hero-glow > * {
          position: relative;
          z-index: 1;
        }

        .glass-navbar {
          background: rgba(10, 15, 13, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .glass-card {
          background: rgba(15, 25, 20, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .glass-card:hover {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(15, 25, 20, 0.5);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .glass-card-highlight {
          background: rgba(20, 40, 30, 0.5);
          border: 1px solid rgba(16, 185, 129, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 30px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .section-panel-live {
          background: rgba(15, 25, 20, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .section-panel-upcoming {
          background: rgba(15, 25, 20, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .section-panel-results {
          background: rgba(15, 25, 20, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .section-panel-teams {
          background: rgba(15, 25, 20, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .section-panel-leagues {
          background: rgba(15, 25, 20, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}
