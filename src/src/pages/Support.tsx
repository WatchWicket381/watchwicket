import React, { useState } from "react";

interface SupportProps {
  onClose: () => void;
}

const Support: React.FC<SupportProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "🚀",
      questions: [
        {
          q: "How do I create my first match?",
          a: "Tap the 'Start Match' button on the home screen, select your format (Indoor, T20, or ODI), then set up your teams and players on the Team Sheet tab before starting to score."
        },
        {
          q: "How do I add players to my Cricket Squad?",
          a: "Go to Menu → Cricket Squad, then tap 'Add Player' to create player profiles. You can add photos, stats, and other details for each player."
        },
        {
          q: "Can I use the app offline?",
          a: "Match scoring works offline, but you need an internet connection to sync data, share matches, and access cloud features."
        }
      ]
    },
    {
      id: "scoring",
      title: "Scoring & Match Management",
      icon: "🏏",
      questions: [
        {
          q: "How do I record a wicket?",
          a: "On the Live Score tab, tap the wicket button, select the dismissal type, and choose the bowler and fielder (if applicable)."
        },
        {
          q: "How do I change bowlers or batters?",
          a: "Tap 'Change Bowler' or 'Change Batter' buttons on the Live Score tab. Select the new player from your team."
        },
        {
          q: "Can I edit a delivery after it's been recorded?",
          a: "Yes, you can undo the last delivery using the undo button on the Live Score tab."
        },
        {
          q: "What's the difference between Indoor, T20, and ODI modes?",
          a: "Indoor mode allows multiple dismissals per player with run penalties. T20 is 20 overs with aggressive gameplay. ODI is 50 overs with strategic depth. Check the Rules page for detailed differences."
        }
      ]
    },
    {
      id: "stats",
      title: "Statistics & Analytics",
      icon: "📊",
      questions: [
        {
          q: "How do I view player statistics?",
          a: "Go to Menu → My Stats to see your personal statistics, or view individual player stats in Cricket Squad."
        },
        {
          q: "Can I export match statistics?",
          a: "Yes! On the Match Summary tab, use the 'Share Innings Card' feature to generate and share professional scorecards."
        },
        {
          q: "How are batting and bowling averages calculated?",
          a: "Batting average = Total runs / Times out. Bowling average = Runs conceded / Wickets taken. Strike rates and economy rates are also calculated automatically."
        }
      ]
    },
    {
      id: "sharing",
      title: "Sharing & Privacy",
      icon: "🔗",
      questions: [
        {
          q: "How do I share a live match?",
          a: "On the Match Summary tab, tap 'Share Live Link' to copy a link that others can use to follow the match in real-time."
        },
        {
          q: "Can I control who sees my matches?",
          a: "Yes, use Match Sharing settings in the menu during a match to control visibility of player stats and team scorecards."
        },
        {
          q: "How do I share innings cards on social media?",
          a: "Generate an innings card from the Match Summary tab, then download or share it directly to WhatsApp, Instagram, or other platforms."
        }
      ]
    },
    {
      id: "account",
      title: "Account & Settings",
      icon: "⚙️",
      questions: [
        {
          q: "How do I reset my password?",
          a: "Sign out, then use the 'Forgot Password' option on the sign-in screen to receive a password reset email."
        },
        {
          q: "Can I sync across multiple devices?",
          a: "Yes! Sign in with the same account on multiple devices to automatically sync all your matches, players, and statistics."
        },
        {
          q: "How do I delete my account?",
          a: "Go to Menu → Settings → Delete Account. This will permanently delete all your data and cannot be undone."
        }
      ]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: "🔧",
      questions: [
        {
          q: "The app is not syncing my data",
          a: "Check your internet connection and ensure you're signed in. Try refreshing the app or signing out and back in."
        },
        {
          q: "I lost my match data",
          a: "If you're signed in, your data is automatically backed up. Try refreshing or contact support if the issue persists."
        },
        {
          q: "The app is running slowly",
          a: "Close other apps, ensure you have the latest version, and try restarting the app. Clear your browser cache if using the web version."
        },
        {
          q: "I found a bug",
          a: "Please report bugs through the contact form below with details about what happened and how to reproduce the issue."
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">WatchWicket Support</h1>
            <button
              onClick={onClose}
              className="text-green-300 hover:text-white text-3xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-8 border border-green-700/50 shadow-xl mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">How can we help you?</h2>
            <p className="text-green-200 mb-6">
              Browse our frequently asked questions or contact us for assistance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    selectedCategory === category.id
                      ? "bg-green-600 text-white shadow-lg"
                      : "bg-green-800/40 text-green-200 hover:bg-green-700/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon}</span>
                    <span className="font-semibold">{category.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedCategory && (
            <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-8 border border-green-700/50 shadow-xl mb-6">
              {categories
                .filter((cat) => cat.id === selectedCategory)
                .map((category) => (
                  <div key={category.id}>
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      {category.title}
                    </h3>
                    <div className="space-y-6">
                      {category.questions.map((item, index) => (
                        <div key={index} className="border-l-4 border-green-600 pl-4">
                          <h4 className="text-lg font-semibold text-white mb-2">
                            {item.q}
                          </h4>
                          <p className="text-green-200 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-8 border border-green-700/50 shadow-xl mb-6">
            <h3 className="text-2xl font-bold text-white mb-4">Contact Us</h3>
            <p className="text-green-200 mb-6">
              Can't find what you're looking for? Get in touch with our support team.
            </p>
            <div className="space-y-4">
              <a
                href="mailto:watchwicket1@gmail.com"
                className="flex items-center gap-3 text-green-200 hover:text-green-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>watchwicket1@gmail.com</span>
              </a>
              <a
                href="https://www.tiktok.com/@watchwicket_live?_r=1&_t=ZN-92lHkuNjdpO"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-200 hover:text-green-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
                </svg>
                <span>@watchwicket_live on TikTok</span>
              </a>
              <a
                href="https://whatsapp.com/channel/0029VbC1FJm2UPBAidzhqP1s"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-green-200 hover:text-green-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>WatchWicket Community Hub on WhatsApp</span>
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Support;
