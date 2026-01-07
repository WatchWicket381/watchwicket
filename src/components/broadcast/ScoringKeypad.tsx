import React from "react";

interface ScoringKeypadProps {
  canScore: boolean;
  tossSet: boolean;
  isIndoor: boolean;
  pendingRuns: number | null;
  pendingExtraType: "wide" | "noball" | "bye" | "legbye" | null;
  pendingWallBonus: boolean;
  onRunClick: (runs: number) => void;
  onWallBonusClick: () => void;
  onWicketClick: () => void;
  onExtraClick: (type: "wide" | "noball" | "bye" | "legbye") => void;
}

const ScoringKeypad: React.FC<ScoringKeypadProps> = ({
  canScore,
  tossSet,
  isIndoor,
  pendingRuns,
  pendingExtraType,
  pendingWallBonus,
  onRunClick,
  onWallBonusClick,
  onWicketClick,
  onExtraClick,
}) => {
  const isButtonActive = (type: "run" | "extra" | "wall", value?: number | string) => {
    if (type === "run") return pendingRuns === value;
    if (type === "extra") return pendingExtraType === value;
    if (type === "wall") return pendingWallBonus;
    return false;
  };

  return (
    <div className="broadcast-glass-card rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">Scoring Controls</h3>
      </div>

      {/* Main Runs */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 font-semibold">Runs</div>
        <div className="grid grid-cols-4 gap-2">
          {/* Dot Ball */}
          <button
            disabled={!tossSet || !canScore}
            className={`scoring-btn ${
              isButtonActive("run", 0)
                ? "scoring-btn-active bg-blue-600/90 ring-2 ring-blue-400/50"
                : "bg-gray-700/80 hover:bg-gray-600/90"
            }`}
            onClick={() => onRunClick(0)}
          >
            0
          </button>

          {/* 1-6 */}
          {[1, 2, 3, 4, 5, 6].map((r) => (
            <button
              key={r}
              disabled={!tossSet || !canScore}
              className={`scoring-btn ${
                isButtonActive("run", r)
                  ? "scoring-btn-active bg-blue-600/90 ring-2 ring-blue-400/50"
                  : r === 4 || r === 6
                  ? "bg-gradient-to-br from-emerald-600/90 to-emerald-700/90 hover:from-emerald-500 hover:to-emerald-600"
                  : "bg-gradient-to-br from-green-700/90 to-green-800/90 hover:from-green-600 hover:to-green-700"
              }`}
              onClick={() => onRunClick(r)}
            >
              {r}
            </button>
          ))}

          {/* Wall Bonus (Indoor Only) */}
          {isIndoor && (
            <button
              disabled={!tossSet || !canScore}
              className={`scoring-btn ${
                isButtonActive("wall")
                  ? "scoring-btn-active bg-blue-600/90 ring-2 ring-blue-400/50"
                  : "bg-gradient-to-br from-yellow-600/90 to-yellow-700/90 hover:from-yellow-500 hover:to-yellow-600"
              }`}
              onClick={onWallBonusClick}
            >
              W+1
            </button>
          )}
        </div>
      </div>

      {/* Extras */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-2 font-semibold">Extras</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={!tossSet || !canScore}
            className={`scoring-btn-extra ${
              isButtonActive("extra", "noball")
                ? "scoring-btn-active bg-blue-600/90 ring-2 ring-blue-400/50"
                : "bg-blue-700/80 hover:bg-blue-600/90"
            }`}
            onClick={() => onExtraClick("noball")}
          >
            No Ball
          </button>
          <button
            disabled={!tossSet || !canScore}
            className={`scoring-btn-extra ${
              isButtonActive("extra", "wide")
                ? "scoring-btn-active bg-blue-600/90 ring-2 ring-blue-400/50"
                : "bg-blue-700/80 hover:bg-blue-600/90"
            }`}
            onClick={() => onExtraClick("wide")}
          >
            Wide
          </button>
          <button
            disabled={!tossSet || !canScore}
            className={`scoring-btn-extra ${
              isButtonActive("extra", "legbye")
                ? "scoring-btn-active bg-blue-600/90 ring-2 ring-blue-400/50"
                : "bg-blue-700/80 hover:bg-blue-600/90"
            }`}
            onClick={() => onExtraClick("legbye")}
          >
            Leg Bye
          </button>
          <button
            disabled={!tossSet || !canScore}
            className={`scoring-btn-extra ${
              isButtonActive("extra", "bye")
                ? "scoring-btn-active bg-blue-600/90 ring-2 ring-blue-400/50"
                : "bg-blue-700/80 hover:bg-blue-600/90"
            }`}
            onClick={() => onExtraClick("bye")}
          >
            Bye
          </button>
        </div>
      </div>

      {/* Wicket */}
      <button
        disabled={!tossSet || !canScore}
        className="scoring-btn-wicket w-full bg-gradient-to-br from-red-700/90 to-red-800/90 hover:from-red-600 hover:to-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={onWicketClick}
      >
        <span className="text-lg font-black">WICKET</span>
      </button>

      <style jsx>{`
        .scoring-btn {
          min-height: 3.5rem;
          font-size: 1.5rem;
          font-weight: 800;
          border-radius: 0.75rem;
          transition: all 0.15s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          color: white;
          position: relative;
        }

        .scoring-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .scoring-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .scoring-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.3);
        }

        .scoring-btn-active {
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.2), 0 4px 12px rgba(59, 130, 246, 0.4) !important;
        }

        .scoring-btn-extra {
          min-height: 3rem;
          font-size: 0.875rem;
          font-weight: 700;
          border-radius: 0.75rem;
          transition: all 0.15s ease;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          color: white;
        }

        .scoring-btn-extra:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }

        .scoring-btn-extra:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          filter: grayscale(0.3);
        }

        .scoring-btn-wicket {
          min-height: 4rem;
          border-radius: 0.75rem;
          transition: all 0.15s ease;
          border: 1px solid rgba(239, 68, 68, 0.3);
          box-shadow: 0 4px 12px rgba(185, 28, 28, 0.4);
          color: white;
        }

        .scoring-btn-wicket:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(185, 28, 28, 0.5);
        }

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

export default ScoringKeypad;
