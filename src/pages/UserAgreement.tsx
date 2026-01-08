import React from "react";

interface UserAgreementProps {
  onClose: () => void;
}

const UserAgreement: React.FC<UserAgreementProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">User Agreement</h1>
            <button
              onClick={onClose}
              className="text-green-300 hover:text-white text-3xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="bg-green-900/40 backdrop-blur-sm rounded-2xl p-8 border border-green-700/50 shadow-xl space-y-6 text-green-100">
            <p className="text-sm text-green-300">
              Last Updated: December 2025
            </p>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">1. Data Collection and Use</h2>
              <p className="leading-relaxed mb-2">
                By using WatchWicket ScoreBox, you agree that we may collect and use the following data:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Account information (email, name, profile data)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Match data (scores, statistics, player performances)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Player profiles and statistics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Usage data and analytics</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">2. Match Data Rights</h2>
              <p className="leading-relaxed mb-2">
                When you create matches using the App:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>You retain ownership of your match data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>You can export, share, or delete your data at any time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Shared matches may be visible to other users based on your privacy settings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Public matches may appear in app-wide statistics and leaderboards</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">3. Player Statistics and Profiles</h2>
              <p className="leading-relaxed mb-2">
                Regarding player data and statistics:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Player profiles created by you are stored in your account</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Statistics are automatically calculated based on match data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>You can control player profile visibility through privacy settings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Aggregated, anonymized stats may be used for app analytics</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">4. Match Sharing</h2>
              <p className="leading-relaxed mb-2">
                When you share matches or statistics:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>You control who can view your match data via sharing settings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Shared links may allow read-only access to match details</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>You can revoke sharing access at any time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Shared content remains subject to these terms</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">5. Data Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your data. However, no system is completely secure, and you use the App at your own risk. We recommend using strong passwords and enabling available security features.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">6. Cloud Sync and Backup</h2>
              <p className="leading-relaxed mb-2">
                Match data is automatically synced to our cloud servers:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Data is encrypted during transmission and storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Regular backups are performed to prevent data loss</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>You can access your data from multiple devices</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>We are not liable for data loss due to technical issues</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">7. User Content</h2>
              <p className="leading-relaxed">
                You are solely responsible for any content you create, upload, or share through the App. You agree not to upload content that is offensive, defamatory, or violates any laws or rights of others.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">8. Third-Party Services</h2>
              <p className="leading-relaxed">
                The App may integrate with third-party services for authentication, analytics, or other features. Your use of these services is subject to their respective terms and privacy policies.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">9. Account Deletion</h2>
              <p className="leading-relaxed mb-2">
                You may delete your account at any time:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Account deletion is permanent and cannot be undone</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>All match data and statistics will be deleted</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Backup copies may be retained for up to 30 days</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Anonymized analytics data may be retained</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">10. Changes to Agreement</h2>
              <p className="leading-relaxed">
                We may update this User Agreement from time to time. Material changes will be communicated through the App. Continued use after changes constitutes acceptance of the updated agreement.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">11. Contact and Support</h2>
              <p className="leading-relaxed">
                For questions about this User Agreement or to exercise your data rights, please contact us through the Support page in the App.
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

export default UserAgreement;
