import React from 'react';

interface Props {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function UndoOverModal({ show, onConfirm, onCancel }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Undo End of Over?
        </h2>

        <p className="text-gray-300 mb-6 leading-relaxed">
          This will revert striker swap, bowler, and over summary.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Confirm Undo
          </button>
        </div>
      </div>
    </div>
  );
}
