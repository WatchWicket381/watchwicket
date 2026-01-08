import React from "react";

interface TermsConditionsProps {
  onClose: () => void;
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-950 via-green-900 to-green-950 z-50 overflow-y-auto">
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Terms & Conditions</h1>
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
              <h2 className="text-2xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using WatchWicket ScoreBox ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms & Conditions, please do not use the App.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">2. Use of the App</h2>
              <p className="leading-relaxed mb-2">
                The App is provided for cricket scoring and match management purposes. You agree to:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Use the App only for lawful purposes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Not misuse or attempt to gain unauthorized access to the App</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Not use the App in any way that could damage, disable, or impair the service</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Maintain the security of your account credentials</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">3. User Accounts</h2>
              <p className="leading-relaxed">
                To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">4. Data and Privacy</h2>
              <p className="leading-relaxed">
                We take your privacy seriously. All data is stored securely and is subject to our Privacy Policy. Match data, player statistics, and personal information are handled in accordance with applicable data protection laws.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">5. Content Ownership</h2>
              <p className="leading-relaxed mb-2">
                You retain ownership of the match data and statistics you create through the App. However, you grant us a license to:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Store and process your data to provide the service</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Generate aggregated, anonymized statistics for service improvement</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">6. Service Availability</h2>
              <p className="leading-relaxed">
                While we strive to provide uninterrupted service, we do not guarantee that the App will be available at all times. We reserve the right to modify, suspend, or discontinue any part of the service without notice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">7. Limitation of Liability</h2>
              <p className="leading-relaxed">
                The App is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use or inability to use the App, including but not limited to data loss, match disruption, or any indirect damages.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">8. Prohibited Activities</h2>
              <p className="leading-relaxed mb-2">
                You agree not to:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Use automated systems or bots to access the App</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Attempt to reverse engineer or decompile the App</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Upload malicious code or viruses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400">•</span>
                  <span>Harass, abuse, or harm other users</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">9. Modifications to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting. Continued use of the App after changes constitutes acceptance of the modified terms.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">10. Termination</h2>
              <p className="leading-relaxed">
                We reserve the right to terminate or suspend your account and access to the App at our sole discretion, without notice, for conduct that we believe violates these Terms & Conditions or is harmful to other users or the service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">11. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms & Conditions shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">12. Contact Information</h2>
              <p className="leading-relaxed">
                For questions about these Terms & Conditions, please contact us through the Support page in the App.
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

export default TermsConditions;
