import React from "react";

interface AboutProps {
  onClose: () => void;
}

const About: React.FC<AboutProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">About</h1>
            <button
              onClick={onClose}
              className="text-green-300 hover:text-white text-3xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-8 border border-green-700/50 shadow-xl">
            <div className="text-center mb-8">
              <div className="text-2xl font-arabic text-green-200 mb-4" style={{ fontFamily: 'serif' }}>
                بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيم
              </div>
              <div className="text-xl text-green-200 mb-8">
                As-salāmu ʿalaykum wa raḥmatullāhi wa barakātuh.
              </div>
            </div>

            <div className="space-y-6 text-green-100">
              <p className="text-lg leading-relaxed">
                Welcome to <strong className="text-white">WatchWicket ScoreBox</strong> – a simple, powerful cricket scoring platform built to support players, captains, and clubs at every level.
              </p>

              <div className="mt-8 pt-6 border-t border-green-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">Our Story</h3>
                <p className="text-lg leading-relaxed mb-4">
                  WatchWicket ScoreBox began with a familiar weekly problem:<br />
                  scores lost in WhatsApp chats, paper notes, or forgotten entirely.
                </p>
                <p className="text-lg leading-relaxed mb-3">
                  We wanted something:
                </p>
                <ul className="space-y-2 ml-6 mb-4">
                  <li className="text-lg leading-relaxed">• Easy enough for fast indoor matches</li>
                  <li className="text-lg leading-relaxed">• Strong enough to track long-term stats</li>
                  <li className="text-lg leading-relaxed">• Clean, distraction-free, and ad-free</li>
                </ul>
                <p className="text-lg leading-relaxed">
                  So we created WatchWicket ScoreBox — built for real games, real people, and real improvement.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-green-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                <p className="text-lg leading-relaxed mb-3">
                  We aim to make professional-style scoring available to everyone:
                </p>
                <ul className="space-y-2 ml-6 mb-4">
                  <li className="text-lg leading-relaxed">• Indoor teams</li>
                  <li className="text-lg leading-relaxed">• Park cricket</li>
                  <li className="text-lg leading-relaxed">• Community clubs</li>
                  <li className="text-lg leading-relaxed">• Friendly tournaments</li>
                  <li className="text-lg leading-relaxed">• Families who just love cricket</li>
                </ul>
                <p className="text-lg leading-relaxed">
                  We want you to score quickly, share securely, and look back proudly at your performances.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-green-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">What WatchWicket ScoreBox Offers</h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-semibold text-green-300 mb-1">Live Scoring</h4>
                    <p className="text-base leading-relaxed">Ball-by-ball scoring for Indoor, T20, and ODI matches.</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-green-300 mb-1">Smart Player Profiles</h4>
                    <p className="text-base leading-relaxed">Track runs, wickets, strike rates and more across all your games.</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-green-300 mb-1">Teams & Leagues</h4>
                    <p className="text-base leading-relaxed">Build squads, manage fixtures, and run full leagues with points tables.</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-green-300 mb-1">Linked Accounts (Privacy First)</h4>
                    <p className="text-base leading-relaxed">Players see only their stats unless you grant more access.</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-green-300 mb-1">Saved Matches & Summaries</h4>
                    <p className="text-base leading-relaxed">Revisit any completed match with full scorecards and partnerships.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-green-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">Our Values</h3>
                <ul className="space-y-3">
                  <li className="text-lg leading-relaxed">
                    <strong className="text-green-300">Simplicity first</strong> — fast, clean design you can use one-handed.
                  </li>
                  <li className="text-lg leading-relaxed">
                    <strong className="text-green-300">Respect for your data</strong> — you decide what is shared.
                  </li>
                  <li className="text-lg leading-relaxed">
                    <strong className="text-green-300">Continuous improvement</strong> — we actively refine and expand features.
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-green-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">Looking Ahead</h3>
                <p className="text-lg leading-relaxed mb-3">
                  In shā' Allāh, future updates will bring:
                </p>
                <ul className="space-y-2 ml-6">
                  <li className="text-lg leading-relaxed">• Advanced league tools</li>
                  <li className="text-lg leading-relaxed">• Deeper player analysis</li>
                  <li className="text-lg leading-relaxed">• More ways to share achievements</li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-green-700/50">
                <h3 className="text-2xl font-bold text-white mb-4">A Note of Thanks</h3>
                <p className="text-lg leading-relaxed mb-4">
                  Jazākum Allāhu khayran for using WatchWicket ScoreBox.<br />
                  Your support and feedback shape the future of this platform.
                </p>
                <p className="text-lg leading-relaxed">
                  If you have ideas, suggestions, or notice anything that can be improved, please reach us through the Support section.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;
