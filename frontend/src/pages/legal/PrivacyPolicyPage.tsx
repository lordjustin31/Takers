import { Shield } from "lucide-react"

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neu-50 pb-20 pt-24">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="neu-card mb-8 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-glow-blue">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neu-900">Privacy Policy</h1>
              <p className="text-sm text-neu-600 mt-1">Last updated: July 7, 2026</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="neu-card p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">1. Information We Collect</h2>
            <div className="space-y-3 text-neu-700">
              <h3 className="font-semibold text-lg text-neu-800">1.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Information:</strong> Username, email address, display name, password</li>
                <li><strong>Profile Information:</strong> Avatar/profile photo, bio, location (optional)</li>
                <li><strong>Product Listings:</strong> Product descriptions, images, prices, location</li>
                <li><strong>Communications:</strong> Messages, comments, support requests</li>
              </ul>

              <h3 className="font-semibold text-lg text-neu-800 mt-6">1.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Usage Data:</strong> Pages visited, time spent, features used</li>
                <li><strong>Device Information:</strong> IP address, browser type, device type</li>
                <li><strong>Cookies:</strong> Authentication tokens, preferences (see Cookie Policy)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-neu-700">
              <li>Provide and maintain marketplace services</li>
              <li>Process transactions between buyers and sellers</li>
              <li>Send notifications about your account and activities</li>
              <li>Improve and personalize user experience</li>
              <li>Detect and prevent fraud, spam, and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">3. Information Sharing</h2>
            <div className="space-y-3 text-neu-700">
              <p>We do NOT sell your personal information. We only share information in these cases:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Public Profile:</strong> Your username, display name, and avatar are visible to other users</li>
                <li><strong>Listings:</strong> Product information you post is publicly visible</li>
                <li><strong>Messages:</strong> Shared only with the recipient you choose</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
                <li><strong>Service Providers:</strong> Third parties who help operate our service (with strict confidentiality)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">4. Data Security</h2>
            <p className="text-neu-700 mb-3">We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-neu-700">
              <li>HTTPS encryption for all data transmission</li>
              <li>Password hashing with secure algorithms</li>
              <li>Regular security audits and updates</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Secure session management</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">5. Your Rights</h2>
            <p className="text-neu-700 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-neu-700">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Update inaccurate information</li>
              <li><strong>Deletion:</strong> Request account deletion (Settings → Account → Delete Account)</li>
              <li><strong>Privacy Control:</strong> Set profile to private to control who can message you</li>
              <li><strong>Data Portability:</strong> Request your data in machine-readable format</li>
              <li><strong>Opt-out:</strong> Disable notifications in Settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">6. Cookies</h2>
            <p className="text-neu-700">
              We use essential cookies for authentication and session management. See our{" "}
              <a href="/legal/cookies" className="text-blue-600 hover:underline">Cookie Policy</a> for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">7. Children's Privacy</h2>
            <p className="text-neu-700">
              Our service is not intended for users under 18 years of age. We do not knowingly collect 
              information from children. If we discover that a child has provided personal information, 
              we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">8. Data Retention</h2>
            <p className="text-neu-700">
              We retain your information as long as your account is active. After account deletion, 
              we may retain some information for legal compliance, dispute resolution, and preventing fraud.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">9. International Users</h2>
            <p className="text-neu-700">
              Your information may be stored and processed in any country where we operate. 
              By using our service, you consent to the transfer of information to countries outside your residence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">10. Changes to Privacy Policy</h2>
            <p className="text-neu-700">
              We may update this policy from time to time. We will notify users of significant changes 
              via email or platform notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">11. Contact Us</h2>
            <div className="neu-card-inset p-4 bg-blue-50">
              <p className="text-neu-700">
                For privacy questions or to exercise your rights, contact us at:
              </p>
              <p className="font-semibold text-neu-900 mt-2">privacy@takers-marketplace.com</p>
              <p className="text-sm text-neu-600 mt-1">Response time: 48 hours</p>
            </div>
          </section>

          <div className="border-t border-neu-200 pt-6 mt-8">
            <p className="text-sm text-neu-500 text-center">
              By using Takers Marketplace, you agree to this Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
