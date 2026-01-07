import React from "react";
import { Player } from "../../matchTypes";

interface CurrentPlayersCardProps {
  striker: Player | undefined;
  nonStriker: Player | undefined;
  bowler: Player | undefined;
  onChangeStriker: () => void;
  onChangeNonStriker: () => void;
  onChangeBowler: () => void;
}

const CurrentPlayersCard: React.FC<CurrentPlayersCardProps> = ({
  striker,
  nonStriker,
  bowler,
  onChangeStriker,
  onChangeNonStriker,
  onChangeBowler,
}) => {
  return (
    <div className="broadcast-glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300">Current Players</h3>
      </div>

      {/* Striker */}
      <div className="broadcast-player-row">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600/20 border border-emerald-600/40 flex items-center justify-center text-[10px]">
              🏏
            </span>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-emerald-400">Striker</span>
          </div>
          {striker && (
            <button
              onClick={onChangeStriker}
              className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-wide"
            >
              Change
            </button>
          )}
        </div>

        {striker ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-sm">{striker.name}</span>
              {striker.isCaptain && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-600/80 text-white font-bold">C</span>
              )}
              {striker.isKeeper && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-sky-600/80 text-white font-bold">WK</span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-white font-semibold">{striker.runs}</span>
              <span className="text-slate-500">({striker.balls})</span>
              <span className="mx-2">•</span>
              <span>4s: <span className="text-slate-300">{striker.fours}</span></span>
              <span className="mx-2">•</span>
              <span>6s: <span className="text-slate-300">{striker.sixes}</span></span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic">Select striker</div>
        )}
      </div>

      {/* Non-Striker */}
      <div className="broadcast-player-row">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-700/40 border border-slate-600/40 flex items-center justify-center text-[10px]">
              👤
            </span>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">Non-Striker</span>
          </div>
          {nonStriker && (
            <button
              onClick={onChangeNonStriker}
              className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-wide"
            >
              Change
            </button>
          )}
        </div>

        {nonStriker ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-sm">{nonStriker.name}</span>
              {nonStriker.isCaptain && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-600/80 text-white font-bold">C</span>
              )}
              {nonStriker.isKeeper && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-sky-600/80 text-white font-bold">WK</span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-white font-semibold">{nonStriker.runs}</span>
              <span className="text-slate-500">({nonStriker.balls})</span>
              <span className="mx-2">•</span>
              <span>4s: <span className="text-slate-300">{nonStriker.fours}</span></span>
              <span className="mx-2">•</span>
              <span>6s: <span className="text-slate-300">{nonStriker.sixes}</span></span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic">Select non-striker</div>
        )}
      </div>

      {/* Bowler */}
      <div className="broadcast-player-row border-t border-slate-700/50 pt-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-[10px]">
              ⚾
            </span>
            <span className="text-[10px] uppercase tracking-wide font-semibold text-red-400">Bowler</span>
          </div>
          {bowler && (
            <button
              onClick={onChangeBowler}
              className="text-[10px] text-blue-400 hover:text-blue-300 uppercase tracking-wide"
            >
              Change
            </button>
          )}
        </div>

        {bowler ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{bowler.name}</span>
              {bowler.isCaptain && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-600/80 text-white font-bold">C</span>
              )}
              {bowler.isKeeper && (
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-sky-600/80 text-white font-bold">WK</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500 italic">Select bowler</div>
        )}
      </div>

      <style jsx>{`
        .broadcast-glass-card {
          background: rgba(15, 25, 20, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .broadcast-player-row {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default CurrentPlayersCard;
