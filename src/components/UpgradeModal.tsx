import React from 'react';

type UpgradeModalProps = {
  onClose: () => void;
  lockedFormat: string;
};

export default function UpgradeModal({ onClose, lockedFormat }: UpgradeModalProps) {
  const handleUpgrade = () => {
    alert('In-app purchase flow will be integrated here for Android/iOS.\n\nFor now, this is a placeholder showing the upgrade screen.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700 p-4 rounded-lg border border-yellow-500">
            <p className="text-yellow-400 font-medium mb-2">
              🔒 {lockedFormat} format requires Pro
            </p>
            <p className="text-sm text-gray-300">
              Upgrade to unlock all premium features
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Pro Features:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Indoor Cricket (Free)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>T20 Format (8 overs)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>50 Overs ODI Format</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Test Match (Unlimited overs)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Cloud sync across devices</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Match history storage</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-400 mb-1">$4.99/month</p>
            <p className="text-xs text-gray-300">or $39.99/year (save 33%)</p>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            Upgrade to Pro
          </button>

          <button
            onClick={onClose}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
