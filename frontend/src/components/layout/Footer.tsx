import { Heart, Shield, FileText, Cookie, Mail } from "lucide-react"
import { Link } from "react-router-dom"

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-neu-200 bg-neu-50 mt-20" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold text-neu-900 mb-4">About Takers</h3>
            <p className="text-sm text-neu-600 mb-4">
              A secure marketplace connecting buyers and sellers in a trusted community.
            </p>
            <p className="text-xs text-neu-500">
              Made with <Heart className="inline h-3 w-3 text-red-500 fill-current" /> in the Philippines
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-bold text-neu-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/legal/terms" 
                  className="text-neu-600 hover:text-blue-600 flex items-center gap-2 focus:outline-none focus:underline"
                  aria-label="View terms and conditions"
                >
                  <FileText className="h-4 w-4" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/privacy" 
                  className="text-neu-600 hover:text-blue-600 flex items-center gap-2 focus:outline-none focus:underline"
                  aria-label="View privacy policy"
                >
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/legal/cookies" 
                  className="text-neu-600 hover:text-blue-600 flex items-center gap-2 focus:outline-none focus:underline"
                  aria-label="View cookie policy"
                >
                  <Cookie className="h-4 w-4" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold text-neu-900 mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-neu-600">
              <li>
                <a 
                  href="mailto:support@takers-marketplace.com" 
                  className="hover:text-blue-600 flex items-center gap-2 focus:outline-none focus:underline"
                  aria-label="Contact support via email"
                >
                  <Mail className="h-4 w-4" />
                  support@takers-marketplace.com
                </a>
              </li>
              <li className="text-xs text-neu-500 mt-3">
                Response time: 24-48 hours
              </li>
            </ul>
          </div>

          {/* Platform Info */}
          <div>
            <h3 className="text-lg font-bold text-neu-900 mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-neu-600">
              <li>✅ Secure Authentication</li>
              <li>✅ No Tracking or Ads</li>
              <li>✅ HTTPS Encrypted</li>
              <li>✅ Philippine-Based</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-neu-200 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neu-500 text-center md:text-left">
              © {currentYear} Takers Marketplace. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-neu-500">
              <span>🇵🇭 Philippines</span>
              <span>•</span>
              <span>Made for the Community</span>
              <span>•</span>
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 neu-card-inset p-4 bg-amber-50 border-2 border-amber-200">
          <p className="text-xs text-amber-900 text-center">
            <strong>Disclaimer:</strong> Takers Marketplace is a platform connecting users. 
            We are not a party to transactions. Users transact at their own risk. 
            Verify items before purchase.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
