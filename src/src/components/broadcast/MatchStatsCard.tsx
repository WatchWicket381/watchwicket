import React from "react";
import { Inning } from "../../matchTypes";

interface MatchStatsCardProps {
  inning: Inning;
  showProFeatures: boolean;
  partnership?: { runs: number; balls: number };
  projected?: number | null;
  format: string;
}

const MatchStatsCard: React.FC<MatchStatsCardProps> = ({
  inning,
  showProFeatures,
  partnership,
  projected,
  format,
}) => {
  return (
    <div className="broadcast-glass-card rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">Match Stats</h3>
      </div>

      {/* Recent Balls */}
      {inning.deliveries.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 font-semibold">
            Last 12 Balls
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inning.deliveries.slice(-12).map((del, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold shadow-md ${
                  del.isWicket
                    ? "bg-red-600 text-white ring-1 ring-red-400"
                    : del.runs === 4 || del.runs === 6
                    ? "bg-emerald-600 text-white ring-1 ring-emerald-400"
                    : !del.isLegal
                    ? "bg-blue-600 text-white ring-1 ring-blue-400"
                    : "bg-slate-700 text-slate-200"
                }`}
              >
                {del.display}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extras */}
      <div className="border-t border-slate-700/50 pt-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 font-semibold">
          Extras: {inning.extras.wides + inning.extras.noBalls + inning.extras.byes + inning.extras.legByes}
        </div>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-slate-400">
            <span className="text-slate-500">W:</span>{" "}
            <span className="text-white font-semibold">{inning.extras.wides}</span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-500">NB:</span>{" "}
            <span className="text-white font-semibold">{inning.extras.noBalls}</span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-500">B:</span>{" "}
            <span className="text-white font-semibold">{inning.extras.byes}</span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-500">LB:</span>{" "}
            <span className="text-white font-semibold">{inning.extras.legByes}</span>
          </div>
        </div>
      </div>

      {/* Advanced Stats (Pro) */}
      {showProFeatures && partnership && partnership.runs > 0 && (
        <div className="border-t border-slate-700/50 pt-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1 font-semibold">Partnership</div>
          <div className="text-sm">
            <span className="text-white font-bold">{partnership.runs}</span>
            <span className="text-slate-400"> runs </span>
            <span className="text-slate-500">({partnership.balls} balls)</span>
          </div>
        </div>
      )}

      {showProFeatures && projected !== null && format !== "INDOOR" && (
        <div className="border-t border-slate-700/50 pt-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1 font-semibold">Projected Score</div>
          <div className="text-white font-bold text-lg">{projected}</div>
        </div>
      )}

      {!showProFeatures && (
        <div className="border-t border-slate-700/50 pt-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>🔒</span>
            <span>Advanced stats available in WatchWicket Pro</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .broadcast-glass-card {
          background: rgba(15, 25, 20, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
};

export default MatchStatsCard;
