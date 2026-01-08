import React from "react";
import { Player } from "../matchTypes";

interface PlayerEditModalProps {
  player: Player;
  team: "A" | "B";
  isCaptain: boolean;
  isWicketkeeper: boolean;
  onClose: () => void;
  onToggleCaptain: () => void;
  onToggleWicketkeeper: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onAddToSquad?: () => void;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  player,
  team,
  isCaptain,
  isWicketkeeper,
  onClose,
  onToggleCaptain,
  onToggleWicketkeeper,
  onReplace,
  onRemove,
  onAddToSquad,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-gradient-to-br from-slate-900 to-slate-800 w-full sm:max-w-md sm:rounded-xl overflow-hidden border-t sm:border border-slate-700 shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{player.name}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Player Roles
            </h4>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 font-bold text-sm">C</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">Captain</div>
                    <div className="text-xs text-slate-400">Only one per team</div>
                  </div>
                </div>
                <button
                  onClick={onToggleCaptain}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isCaptain ? "bg-yellow-500" : "bg-slate-600"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isCaptain ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900/70 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-xs">WK</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">Wicketkeeper</div>
                    <div className="text-xs text-slate-400">Optional, max one</div>
                  </div>
                </div>
                <button
                  onClick={onToggleWicketkeeper}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isWicketkeeper ? "bg-blue-500" : "bg-slate-600"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      isWicketkeeper ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Player Actions
            </h4>

            <div className="space-y-2">
              <button
                onClick={onReplace}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Replace Player
              </button>

              <button
                onClick={onRemove}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Remove from Team
              </button>

              {player.guest && onAddToSquad && (
                <button
                  onClick={onAddToSquad}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Add to Squad
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
