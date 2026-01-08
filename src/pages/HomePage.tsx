import React, { useState } from "react";
import watchwicketLogo from "../assets/file_00000000711072438e9d72dabae9eda2.png";
import { useAuth } from "../contexts/AuthContext";

interface HomePageProps {
  onOpenMenu: () => void;
  onNavigateToStats?: () => void;
  onStartMatch?: () => void;
}

export default function HomePage({ onOpenMenu, onNavigateToStats, onStartMatch }: HomePageProps) {
  const { user, profile } = useAuth();
  const [thought, setThought] = useState("");

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "there";

  const handlePostThought = () => {
    if (thought.trim()) {
      console.log("Thought posted:", thought);
      setThought("");
    }
  };

  const handleCreatePolls = () => {
    alert("Create Polls feature coming soon!");
  };

  return (
    <div className="h-screen relative text-white flex flex-col pb-20 overflow-hidden">
      {/* Cinematic Dark Green Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#001a0f] via-[#003822] to-[#001410] z-0" />

      {/* Vignette Overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.5) 100%)'
        }}
      />

      {/* Subtle Grain Texture */}
      <div
        className="fixed inset-0 z-[2] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />


      {/* Header - Broadcast Style */}
      <header className="relative z-10 py-5 flex-shrink-0">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between">
          <button
            onClick={onOpenMenu}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-200"
            aria-label="Menu"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Prominent Branding */}
          <div className="flex items-center gap-3">
            <img
              src={watchwicketLogo}
              alt="WatchWicket"
              className="w-12 h-12 object-contain"
            />
            <div className="text-left hidden sm:block">
              <h1 className="text-white text-xl font-bold tracking-tight leading-none">WatchWicket</h1>
              <p className="text-emerald-300 text-xs font-medium tracking-wider uppercase">ScoreBox Pro</p>
            </div>
          </div>

          <div className="w-12"></div>
        </div>
      </header>

      <main className="flex-1 relative z-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-6 space-y-6">

          {/* Welcome Card - Glass Morphism */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium uppercase tracking-wider text-emerald-300">Welcome Back</p>
                <h2 className="text-white text-2xl font-bold">{firstName}</h2>
              </div>
            </div>
            <div className="flex gap-3">
              <textarea
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder="Share your cricket thoughts with the community..."
                className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none transition-all"
                rows={3}
              />
              <button
                onClick={handlePostThought}
                className="bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 self-start"
              >
                Post
              </button>
            </div>
          </div>

          {/* Control Panel Section */}
          <div className="space-y-3">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider px-1 mb-4">Control Panel</h3>

            {/* Primary Actions Grid */}
            <div className="grid gap-4">

              {/* Start Match - Primary CTA */}
              <button
                onClick={onStartMatch}
                className="group relative bg-gradient-to-br from-emerald-600/90 to-green-700/90 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30 hover:from-emerald-500 hover:to-green-600 transition-all duration-300 shadow-2xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all">
                    <svg className="w-9 h-9 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white text-xl font-bold mb-1 drop-shadow-md">Start New Match</h3>
                    <p className="text-white/80 text-sm font-medium">Launch live scoring session</p>
                  </div>
                  <svg className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Secondary Actions */}
              <div className="grid sm:grid-cols-2 gap-4">

                {/* Game Stats */}
                <button
                  onClick={onNavigateToStats}
                  className="group bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-200 shadow-xl hover:shadow-2xl text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-base font-bold mb-1">Game Stats</h3>
                      <p className="text-white/60 text-xs leading-relaxed">View your cricket statistics and performance</p>
                    </div>
                    <svg className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                {/* Create Polls */}
                <button
                  onClick={handleCreatePolls}
                  className="group bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200 shadow-xl hover:shadow-2xl text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-base font-bold mb-1">Create Polls</h3>
                      <p className="text-white/60 text-xs leading-relaxed">Engage community with cricket polls</p>
                    </div>
                    <svg className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

              </div>
            </div>
          </div>

          {/* Status Bar - Broadcast Style */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl px-5 py-3 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white/70 text-xs font-medium uppercase tracking-wider">System Online</span>
            </div>
            <span className="text-white/50 text-xs font-mono">ScoreBox v2.0</span>
          </div>

        </div>
      </main>
    </div>
  );
}
