import { Cookie } from "lucide-react"

function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-neu-50 pb-20 pt-24">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="neu-card mb-8 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow">
              <Cookie className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neu-900">Cookie Policy</h1>
              <p className="text-sm text-neu-600 mt-1">Last updated: July 7, 2026</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="neu-card p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">What Are Cookies?</h2>
            <p className="text-neu-700">
              Cookies are small text files stored on your device when you visit our website. They help us 
              recognize you, remember your preferences, and provide a secure, personalized experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">Cookies We Use</h2>
            
            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="neu-card-inset p-4 bg-green-50 border-2 border-green-200">
                <h3 className="font-semibold text-lg text-neu-800 mb-2">
                  1. Essential Cookies (Required)
                </h3>
                <p className="text-sm text-neu-700 mb-3">
                  These cookies are necessary for the Platform to function. You cannot disable them.
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-green-300">
                      <th className="pb-2 font-semibold">Cookie</th>
                      <th className="pb-2 font-semibold">Purpose</th>
                      <th className="pb-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-neu-700">
                    <tr className="border-b border-green-200">
                      <td className="py-2 font-mono text-xs">access_token</td>
                      <td className="py-2">User authentication</td>
                      <td className="py-2">15 minutes</td>
                    </tr>
                    <tr className="border-b border-green-200">
                      <td className="py-2 font-mono text-xs">refresh_token</td>
                      <td className="py-2">Session renewal</td>
                      <td className="py-2">7 days</td>
                    </tr>
                    <tr className="border-b border-green-200">
                      <td className="py-2 font-mono text-xs">csrftoken</td>
                      <td className="py-2">Security protection</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">sessionid</td>
                      <td className="py-2">Session management</td>
                      <td className="py-2">24 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Functional Cookies */}
              <div className="neu-card-inset p-4 bg-blue-50 border-2 border-blue-200">
                <h3 className="font-semibold text-lg text-neu-800 mb-2">
                  2. Functional Cookies (Optional)
                </h3>
                <p className="text-sm text-neu-700 mb-3">
                  These cookies enhance your experience by remembering your preferences.
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-blue-300">
                      <th className="pb-2 font-semibold">Cookie</th>
                      <th className="pb-2 font-semibold">Purpose</th>
                      <th className="pb-2 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-neu-700">
                    <tr className="border-b border-blue-200">
                      <td className="py-2 font-mono text-xs">theme</td>
                      <td className="py-2">Remember dark/light mode</td>
                      <td className="py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-mono text-xs">language</td>
                      <td className="py-2">Remember language preference</td>
                      <td className="py-2">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">We Do NOT Use</h2>
            <div className="neu-card-inset p-4 bg-red-50 border-2 border-red-200">
              <ul className="list-disc list-inside space-y-2 text-neu-700">
                <li><strong>Advertising Cookies:</strong> We don't track you for ads</li>
                <li><strong>Analytics Cookies:</strong> We don't use Google Analytics or similar</li>
                <li><strong>Social Media Cookies:</strong> We don't embed Facebook Pixel or similar</li>
                <li><strong>Third-Party Tracking:</strong> We don't share data with advertisers</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">Your Cookie Choices</h2>
            <div className="space-y-4 text-neu-700">
              <h3 className="font-semibold text-lg text-neu-800">Browser Settings</h3>
              <p>You can control cookies through your browser settings:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>
              <p className="mt-3">
                <strong>Note:</strong> Disabling essential cookies will prevent you from logging in 
                and using the Platform.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">Local Storage</h2>
            <p className="text-neu-700 mb-3">
              In addition to cookies, we use browser local storage for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-neu-700">
              <li>Caching data to improve performance</li>
              <li>Storing user preferences</li>
              <li>Temporary session data</li>
            </ul>
            <p className="text-neu-700 mt-3">
              You can clear local storage through your browser's developer tools or by clearing browsing data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">Updates to Cookie Policy</h2>
            <p className="text-neu-700">
              We may update this policy to reflect changes in technology or legal requirements. 
              Check this page regularly for updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">Questions?</h2>
            <div className="neu-card-inset p-4 bg-blue-50">
              <p className="text-neu-700">For questions about cookies:</p>
              <p className="font-semibold text-neu-900 mt-2">cookies@takers-marketplace.com</p>
            </div>
          </section>

          <div className="border-t border-neu-200 pt-6 mt-8">
            <p className="text-sm text-neu-500 text-center">
              By using Takers Marketplace, you consent to our use of essential cookies
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookiePolicyPage
