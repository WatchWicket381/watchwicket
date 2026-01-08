import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

interface ProfileProps {
  onClose: () => void;
  onNavigateToPlayers: () => void;
}

interface MatchStats {
  totalMatches: number;
  completedMatches: number;
  totalRuns: number;
  totalWickets: number;
}

const Profile: React.FC<ProfileProps> = ({ onClose, onNavigateToPlayers }) => {
  const { user, profile, isPro, signOut } = useAuth();
  const [stats, setStats] = useState<MatchStats>({
    totalMatches: 0,
    completedMatches: 0,
    totalRuns: 0,
    totalWickets: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  useEffect(() => {
    setFullName(profile?.full_name || '');
  }, [profile]);

  const fetchUserStats = async () => {
    if (!user) return;

    const { data: matches } = await supabase
      .from('matches')
      .select('status, has_activity, legal_balls')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .not('status', 'in', '(abandoned,deleted)');

    if (matches) {
      const completedMatches = matches.filter(
        m => m.status === 'completed' && m.has_activity === true && (m.legal_balls || 0) > 0
      ).length;
      setStats({
        totalMatches: matches.length,
        completedMatches,
        totalRuns: 0,
        totalWickets: 0,
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !fullName.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id);

    setLoading(false);

    if (!error) {
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_deleted: true, full_name: null, avatar_url: null })
      .eq('id', user.id);

    setDeleting(false);

    if (!error) {
      await signOut();
      onClose();
    } else {
      alert('Failed to delete account. Please try again or contact support.');
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return (user?.email || 'U')[0].toUpperCase();
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getMemberSince = () => {
    if (!user?.created_at) return 'Unknown';
    const date = new Date(user.created_at);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
      <div className="min-h-screen">
        {/* Header / Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white">My Profile</h1>
            </div>
            {saveSuccess && (
              <span className="text-green-400 text-sm">✓ Saved</span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {/* Profile Header Card */}
          <div className="bg-slate-800 rounded-xl p-6 sm:p-8 border border-slate-700">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-4xl sm:text-5xl font-bold text-white shadow-lg mb-4">
                {getInitials(profile?.full_name)}
              </div>

              {/* Name and Email */}
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {profile?.full_name || 'Welcome'}
                </h2>
                <p className="text-slate-400 text-sm sm:text-base">{user?.email}</p>
              </div>

              {/* Edit Profile Button */}
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors border border-slate-600"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="w-full max-w-sm space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading || !fullName.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFullName(profile?.full_name || '');
                      }}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 px-1">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
                  {stats.totalMatches}
                </div>
                <div className="text-sm text-slate-400">Saved Matches</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2">
                  {stats.completedMatches}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">
                  {stats.totalRuns}
                </div>
                <div className="text-sm text-slate-400">Total Runs</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 text-center">
                <div className="text-3xl sm:text-4xl font-bold text-red-400 mb-2">
                  {stats.totalWickets}
                </div>
                <div className="text-sm text-slate-400">Total Wickets</div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 px-1">Account Information</h3>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Email</span>
                <span className="text-white font-medium text-sm">{user?.email}</span>
              </div>
              <div className="border-t border-slate-700"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Member Since</span>
                <span className="text-white font-medium text-sm">{getMemberSince()}</span>
              </div>
              <div className="border-t border-slate-700"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-sm">Account Type</span>
                <span className={`font-semibold text-sm ${isPro ? 'text-yellow-400' : 'text-slate-300'}`}>
                  {isPro ? 'Pro' : 'Free'}
                </span>
              </div>
            </div>
          </div>

          {/* Delete Account Section */}
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4 px-1">Danger Zone</h3>
            <div className="bg-slate-800 rounded-xl p-6 border border-red-900/50 space-y-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Delete Account</h4>
                <p className="text-slate-400 text-sm mb-4">
                  Permanently delete your WatchWicket ScoreBox account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 rounded-xl max-w-md w-full border border-red-900/50">
            <div className="border-b border-slate-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Delete your account?</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                This will remove your WatchWicket ScoreBox account and hide your matches, teams and players from the app. This action cannot be undone.
              </p>

              <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4">
                <p className="text-red-400 text-sm font-semibold">
                  ⚠️ Warning: This is permanent
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
