import { AnimatePresence, motion } from "framer-motion"
import { Cookie, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      // Show banner after 2 seconds
      setTimeout(() => setShowBanner(true), 2000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setShowBanner(false)
    // Note: Essential cookies are still used for authentication
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
        >
          <div className="mx-auto max-w-5xl neu-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="neu-card flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600">
                <Cookie className="h-6 w-6 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 
                  id="cookie-consent-title"
                  className="text-lg font-bold text-neu-900 mb-2"
                >
                  🍪 We Value Your Privacy
                </h3>
                <p 
                  id="cookie-consent-description"
                  className="text-sm text-neu-700 mb-4"
                >
                  We use essential cookies to keep you logged in and ensure security. 
                  We <strong>do NOT</strong> use tracking or advertising cookies. 
                  By continuing, you agree to our use of essential cookies.{" "}
                  <Link 
                    to="/legal/cookies" 
                    className="text-blue-600 hover:underline font-semibold"
                    aria-label="Read our cookie policy"
                  >
                    Learn more
                  </Link>
                </p>

                {/* Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAccept}
                    className="neu-button bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 text-sm font-semibold text-white shadow-glow hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    aria-label="Accept cookies"
                  >
                    Accept Essential Cookies
                  </button>
                  <button
                    onClick={handleDecline}
                    className="neu-button px-6 py-2 text-sm font-medium text-neu-700 hover:text-neu-900 focus:outline-none focus:ring-2 focus:ring-neu-400 focus:ring-offset-2"
                    aria-label="Decline optional cookies"
                  >
                    Decline (Essential Only)
                  </button>
                  <Link
                    to="/legal/cookies"
                    className="neu-button px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Learn more about our cookie policy"
                  >
                    Cookie Policy
                  </Link>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDecline}
                className="neu-button flex h-8 w-8 flex-shrink-0 items-center justify-center text-neu-500 hover:text-neu-700 focus:outline-none focus:ring-2 focus:ring-neu-400 focus:ring-offset-2"
                aria-label="Close cookie consent banner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CookieConsent
