import React, { useState } from "react";

interface Props {
  onStartNow: () => void;
  onSchedule: (location: string, date: string, time: string) => void;
  onCancel: () => void;
}

export default function StartScheduleModal({ onStartNow, onSchedule, onCancel }: Props) {
  const [showScheduleFields, setShowScheduleFields] = useState(false);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  const handleScheduleClick = () => {
    if (showScheduleFields) {
      onSchedule(location, date, time);
    } else {
      setShowScheduleFields(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-slate-700">
        <h2 className="text-2xl font-bold mb-2 text-center text-white">Start or Schedule Match?</h2>
        <p className="text-gray-400 text-center mb-6">Choose how you want to proceed with your match</p>

        {!showScheduleFields ? (
          <div className="space-y-4 mb-6">
            <button
              onClick={onStartNow}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 p-6 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">⚡</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Start Now</h3>
                  <p className="text-sm text-green-100">Begin match setup immediately</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleScheduleClick}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 p-6 rounded-xl text-left transition-all transform hover:scale-105 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">📅</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Schedule</h3>
                  <p className="text-sm text-blue-100">Set location, date, and time for later</p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Central Park Cricket Ground"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleScheduleClick}
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors text-white"
            >
              Save Schedule
            </button>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
