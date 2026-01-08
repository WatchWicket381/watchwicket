import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import Watermark from '../components/Watermark';
import { setSfxEnabled, playSixSfx, playFourSfx, playWicketSfx } from '../services/sfx';

interface SettingsProps {
  onClose: () => void;
}

interface UserSettings {
  show_ball_confirmations: boolean;
  enable_haptic_feedback: boolean;
  play_boundary_sounds: boolean;
  enable_visual_effects: boolean;
  default_allow_player_stats_view: boolean;
  default_allow_team_scorecard_view: boolean;
  email_weekly_stats: boolean;
  email_product_updates: boolean;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    show_ball_confirmations: true,
    enable_haptic_feedback: true,
    play_boundary_sounds: true,
    enable_visual_effects: true,
    default_allow_player_stats_view: false,
    default_allow_team_scorecard_view: false,
    email_weekly_stats: false,
    email_product_updates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setSettings({
        show_ball_confirmations: data.show_ball_confirmations,
        enable_haptic_feedback: data.enable_haptic_feedback,
        play_boundary_sounds: data.play_boundary_sounds,
        enable_visual_effects: data.enable_visual_effects ?? true,
        default_allow_player_stats_view: data.default_allow_player_stats_view,
        default_allow_team_scorecard_view: data.default_allow_team_scorecard_view,
        email_weekly_stats: data.email_weekly_stats,
        email_product_updates: data.email_product_updates,
      });
      setSfxEnabled(data.play_boundary_sounds);
    }

    setLoading(false);
  };

  const updateSetting = async (key: keyof UserSettings, value: boolean) => {
    if (!user) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (key === 'play_boundary_sounds') {
      setSfxEnabled(value);
    }

    setSaving(true);
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...newSettings,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-xl p-8">
          <div className="text-white text-xl">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Watermark />
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <div className="flex items-center gap-4">
            {saveSuccess && <span className="text-green-400 text-sm">✓ Saved</span>}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-900 rounded-lg p-5">
            <h3 className="text-lg font-bold mb-1 text-white flex items-center gap-2">
              <span>🏏</span> Scoring & Match Options
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Control how scoring works during matches
            </p>

            <div className="space-y-4">
              <ToggleRow
                label="Show ball-by-ball confirmations"
                description="Display confirmation after each delivery"
                value={settings.show_ball_confirmations}
                onChange={(value) => updateSetting('show_ball_confirmations', value)}
                disabled={saving}
              />

              <ToggleRow
                label="Enable haptic feedback on scoring"
                description="Vibrate on button presses (mobile only)"
                value={settings.enable_haptic_feedback}
                onChange={(value) => updateSetting('enable_haptic_feedback', value)}
                disabled={saving}
              />

              <ToggleRow
                label="Play sound on boundary/wicket"
                description="Audio feedback for key events"
                value={settings.play_boundary_sounds}
                onChange={(value) => updateSetting('play_boundary_sounds', value)}
                disabled={saving}
              />

              <ToggleRow
                label="Show visual effects"
                description="Display animations for boundaries and wickets"
                value={settings.enable_visual_effects}
                onChange={(value) => updateSetting('enable_visual_effects', value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-5">
            <h3 className="text-lg font-bold mb-1 text-white flex items-center gap-2">
              <span>🔒</span> Privacy & Sharing Defaults
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Default privacy settings for new matches
            </p>

            <div className="space-y-4">
              <ToggleRow
                label="Allow players to view their own stats"
                description="Players with linked accounts can see their stats from your matches"
                value={settings.default_allow_player_stats_view}
                onChange={(value) => updateSetting('default_allow_player_stats_view', value)}
                disabled={saving}
              />

              <ToggleRow
                label="Allow team members to view scorecards"
                description="Let team members see match scorecards and details"
                value={settings.default_allow_team_scorecard_view}
                onChange={(value) => updateSetting('default_allow_team_scorecard_view', value)}
                disabled={saving}
              />
            </div>

            <div className="mt-4 bg-slate-800 rounded p-3 border border-slate-700">
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Note:</span> These are defaults for new matches. You can override them for individual matches.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-5">
            <h3 className="text-lg font-bold mb-1 text-white flex items-center gap-2">
              <span>📧</span> Notifications
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Manage your email preferences
            </p>

            <div className="space-y-4">
              <ToggleRow
                label="Email me my weekly stats summary"
                description="Receive a weekly roundup of your cricket stats"
                value={settings.email_weekly_stats}
                onChange={(value) => updateSetting('email_weekly_stats', value)}
                disabled={saving}
              />

              <ToggleRow
                label="Email me product updates & new features"
                description="Stay informed about WatchWicket improvements"
                value={settings.email_product_updates}
                onChange={(value) => updateSetting('email_product_updates', value)}
                disabled={saving}
              />
            </div>

            <div className="mt-4 bg-slate-800 rounded p-3 border border-slate-700">
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Note:</span> Email notifications are currently in development.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-5">
            <h3 className="text-lg font-bold mb-1 text-white flex items-center gap-2">
              <span>🔊</span> Sound Effects Test
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Test your sound effects (enable sound settings above first)
            </p>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => playSixSfx()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Test SIX SFX
              </button>

              <button
                onClick={() => playFourSfx()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Test FOUR SFX
              </button>

              <button
                onClick={() => playWicketSfx()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Test WICKET SFX
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, value, onChange, disabled }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="text-white font-medium mb-1">{label}</div>
        <div className="text-sm text-slate-400">{description}</div>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-green-600' : 'bg-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default Settings;
