import React, { useState } from "react";

interface RulesProps {
  onClose: () => void;
}

type RuleFormat = "indoor" | "t20" | "odi";

const Rules: React.FC<RulesProps> = ({ onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<RuleFormat>("indoor");

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Rules of Cricket</h1>
            <button
              onClick={onClose}
              className="text-green-300 hover:text-white text-3xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSelectedFormat("indoor")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                selectedFormat === "indoor"
                  ? "bg-yellow-600 text-white shadow-lg"
                  : "bg-green-900/40 text-green-300 hover:bg-green-800/40"
              }`}
            >
              Indoor Rules
            </button>
            <button
              onClick={() => setSelectedFormat("t20")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                selectedFormat === "t20"
                  ? "bg-green-600 text-white shadow-lg"
                  : "bg-green-900/40 text-green-300 hover:bg-green-800/40"
              }`}
            >
              T20 Rules
            </button>
            <button
              onClick={() => setSelectedFormat("odi")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all ${
                selectedFormat === "odi"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-green-900/40 text-green-300 hover:bg-green-800/40"
              }`}
            >
              ODI Rules
            </button>
          </div>

          <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-8 border border-green-700/50 shadow-xl">
            {selectedFormat === "indoor" && (
              <div className="space-y-6 text-green-100">
                <h2 className="text-3xl font-black text-white mb-4">Indoor Cricket (WatchWicket Default)</h2>

                <p className="text-lg font-semibold text-green-200 mb-4">
                  Indoor cricket is a fast-paced variant played in enclosed venues with modified rules for safety and gameplay flow.
                </p>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Basic Format</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>8 players per side (or as configured by the organiser)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Innings length: up to 18 overs (user-configurable in match setup)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Each batting pair faces 4 overs together</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>All players must bat and bowl (except wicket-keeper if designated)</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Scoring</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Boundary:</strong> 4 runs for hitting the boundary rope on the ground</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Six:</strong> 6 runs for clean hit over the boundary rope</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Running:</strong> Batters can run 1, 2, 3, or more runs as normal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>No-ball:</strong> 1 run plus re-bowl, batsman cannot be out (except run out)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Wide:</strong> 1 run plus re-bowl</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Dismissals</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Caught:</strong> Caught by fielder or wicket-keeper</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Bowled:</strong> Ball hits the stumps</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Run out:</strong> Fielder hits stumps while batsman is out of crease</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Stumped:</strong> Wicket-keeper removes bails with batsman out of crease</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">✗</span>
                    <span><strong>NO LBW:</strong> Leg Before Wicket does NOT apply in indoor cricket</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Caught off nets:</strong> May be out if local rules specify (venue-dependent)</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Special Rules</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">✗</span>
                    <span><strong>NO OVERTHROWS:</strong> No extra runs awarded for overthrows</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Retired not out:</strong> Batters may retire and return only if all other wickets are down</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Wicket penalty:</strong> When a wicket falls, 5 runs are deducted from the total</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Bowling restrictions:</strong> Each bowler may bowl maximum 2 overs (in 10-over format)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Net strikes:</strong> Ball hitting the side or back nets may result in no run (venue-specific)</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Key Differences from Outdoor Cricket</h3>
                <ul className="space-y-3 ml-4 bg-green-950/40 p-4 rounded-lg">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400">⚠</span>
                    <span>No LBW rule - batsman's leg position does not matter</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400">⚠</span>
                    <span>No overthrows - runs only count from deliberate shots and running</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400">⚠</span>
                    <span>Wicket penalty system - losing wickets costs runs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400">⚠</span>
                    <span>Fixed batting pairs - partnerships are pre-determined</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-400">⚠</span>
                    <span>Net interference - specific rules for ball hitting nets/roof</span>
                  </li>
                </ul>
              </div>
            )}

            {selectedFormat === "t20" && (
              <div className="space-y-6 text-green-100">
                <h2 className="text-3xl font-black text-white mb-4">T20 Cricket Rules</h2>

                <p className="text-lg font-semibold text-green-200 mb-4">
                  Twenty20 (T20) is the shortest format of professional cricket, designed for fast-paced, entertaining matches.
                </p>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Match Format</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>20 overs per innings (120 legal deliveries)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>11 players per side</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Maximum 4 overs per bowler</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Innings breaks typically 10-20 minutes</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Powerplay & Fielding Restrictions</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Powerplay (Overs 1-6):</strong> Maximum 2 fielders outside the 30-yard circle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Overs 7-20:</strong> Maximum 5 fielders outside the 30-yard circle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>At least 2 fielders must be in catching positions inside the circle at all times</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Special Rules</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Free Hit:</strong> After a front-foot no-ball, the next delivery is a free hit (batsman can only be run out)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>No-ball:</strong> 1 run + free hit + batsman cannot be dismissed (except run out)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Wide:</strong> 1 run + re-bowl</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Strategic Timeout:</strong> Each team gets one 2.5-minute timeout</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">All Standard Dismissals Apply</h3>
                <ul className="space-y-2 ml-4 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Caught, Bowled, LBW, Run Out, Stumped, Hit Wicket, Handled Ball, Obstructing Field, Timed Out</span>
                  </li>
                </ul>
              </div>
            )}

            {selectedFormat === "odi" && (
              <div className="space-y-6 text-green-100">
                <h2 className="text-3xl font-black text-white mb-4">ODI Cricket Rules</h2>

                <p className="text-lg font-semibold text-green-200 mb-4">
                  One Day International (ODI) is the traditional limited-overs format, offering a balance between Test cricket and T20.
                </p>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Match Format</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>50 overs per innings (300 legal deliveries)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>11 players per side</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Maximum 10 overs per bowler</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Innings breaks typically 30-45 minutes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Day/Night matches played with white ball under lights</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Powerplays & Fielding Restrictions</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Powerplay 1 (Overs 1-10):</strong> Maximum 2 fielders outside the 30-yard circle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Overs 11-40:</strong> Maximum 4 fielders outside the 30-yard circle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Powerplay 2 (Overs 41-50):</strong> Maximum 5 fielders outside the 30-yard circle</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>At least 2 fielders must be in catching positions inside the circle at all times</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Bowling Rules</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>No-ball:</strong> 1 run + re-bowl (free hit in some leagues)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Wide:</strong> 1 run + re-bowl</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Bouncers:</strong> Maximum 2 bouncers per over (above shoulder height)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span>Third bouncer in an over is called a no-ball</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">Special Provisions</h3>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Rain Rules:</strong> Duckworth-Lewis-Stern (DLS) method applies for interrupted matches</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Minimum Overs:</strong> At least 20 overs per side required for a result</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400">•</span>
                    <span><strong>Super Over:</strong> Used in knockout matches if scores are tied</span>
                  </li>
                </ul>

                <h3 className="text-xl font-bold text-white mt-6 mb-3">All Standard Dismissals Apply</h3>
                <ul className="space-y-2 ml-4 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Caught, Bowled, LBW, Run Out, Stumped, Hit Wicket, Handled Ball, Obstructing Field, Timed Out</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-green-700/50">
              <p className="text-green-200 text-sm italic">
                For full Laws of Cricket, refer to the MCC Laws. WatchWicket focuses on the formats above.
              </p>
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

export default Rules;
