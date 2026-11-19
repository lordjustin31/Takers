import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

import { useAuth } from "../../auth/AuthContext"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const modalMotion = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 10 },
}

const getStoredCooldown = (): number => {
  const stored = localStorage.getItem("auth_cooldown_until")
  if (!stored) return 0
  const until = parseInt(stored, 10)
  const remaining = Math.ceil((until - Date.now()) / 1000)
  if (remaining > 0) return remaining
  localStorage.removeItem("auth_cooldown_until")
  return 0
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { isLoading, authError, clearAuthError, loginWithCredentials, registerWithEmail, startGoogleAuth } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(getStoredCooldown)

  const triggerCooldown = (seconds: number) => {
    const until = Date.now() + seconds * 1000
    localStorage.setItem("auth_cooldown_until", String(until))
    setCooldownSeconds(seconds)
  }

  useEffect(() => {
    const remaining = getStoredCooldown()
    if (remaining > 0) {
      setCooldownSeconds(remaining)
    }
  }, [isOpen])

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      localStorage.removeItem("auth_cooldown_until")
      return
    }
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          localStorage.removeItem("auth_cooldown_until")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  useEffect(() => {
    if (authError && (authError.toLowerCase().includes("too many") || authError.toLowerCase().includes("throttled"))) {
      triggerCooldown(60)
    }
  }, [authError])

  const handleModeSwitch = () => {
    clearAuthError()
    setLocalError(null)
    setMode((prev) => (prev === "login" ? "register" : "login"))
  }

  const handleCredentials = async (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting || cooldownSeconds > 0) return

    if (!username.trim()) {
      setLocalError("Please enter your username.")
      return
    }
    if (mode === "register" && !email.trim()) {
      setLocalError("Please enter your email.")
      return
    }
    if (!password) {
      setLocalError("Please enter your password.")
      return
    }

    setIsSubmitting(true)
    clearAuthError()
    setLocalError(null)

    try {
      let success = false
      if (mode === "register") {
        success = await registerWithEmail({ username: username.trim(), email: email.trim(), password })
      } else {
        success = await loginWithCredentials({ username: username.trim(), password })
      }

      if (success) {
        setLocalError(null)
        setFailedAttempts(0)
        localStorage.removeItem("auth_cooldown_until")
        onClose()
      } else {
        const nextAttempts = failedAttempts + 1
        setFailedAttempts(nextAttempts)
        if (nextAttempts >= 4) {
          triggerCooldown(45)
          setLocalError("Too many failed attempts from your device. Please wait 45 seconds before trying again.")
        }
      }
    } catch (err: unknown) {
      setLocalError("Invalid username or password. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayedError = localError || authError

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur"
        >
          <motion.div
            variants={modalMotion}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card p-6 shadow-glass-xl"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
                    Takers
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-moonstone-100">
                    {mode === "login" ? "Sign in to continue" : "Create an account"}
                  </h2>
                  <p className="mt-2 text-sm text-moonstone-300">
                    Use Google for the quickest way in, or enter your credentials below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthError()
                    setLocalError(null)
                    onClose()
                  }}
                  className="glass-button rounded-lg px-3 py-2 text-xs uppercase tracking-[0.2em] text-moonstone-400 hover:text-moonstone-100"
                >
                  Close
                </button>
              </div>

              {/* Error Notification Banner - Dark Moonlight Theme */}
              {displayedError && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-slate-900/85 p-3.5 shadow-lg shadow-rose-950/20 backdrop-blur-md"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 flex-shrink-0 border border-rose-500/20">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-xs font-semibold text-rose-300">Authentication Error</p>
                    <p className="mt-0.5 text-xs text-rose-200/90 leading-normal">{displayedError}</p>
                  </div>
                </motion.div>
              )}

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={startGoogleAuth}
                  className="glass-button-primary flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg"
                  disabled={isLoading}
                >
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={handleModeSwitch}
                  className="glass-button w-full rounded-xl px-4 py-3 text-sm text-moonstone-200 transition hover:text-moonstone-100"
                >
                  {mode === "login" ? "Create an account" : "Already have an account? Sign in"}
                </button>

                <form className="grid gap-3" onSubmit={handleCredentials}>
                  <input
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value)
                      if (localError) setLocalError(null)
                      if (authError) clearAuthError()
                    }}
                    placeholder="Username"
                    className="glass-input w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40"
                  />
                  {mode === "register" && (
                    <input
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        if (localError) setLocalError(null)
                        if (authError) clearAuthError()
                      }}
                      type="email"
                      placeholder="Email"
                      className="glass-input w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40"
                    />
                  )}
                  <input
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (localError) setLocalError(null)
                      if (authError) clearAuthError()
                    }}
                    type="password"
                    placeholder="Password"
                    className="glass-input w-full rounded-lg px-4 py-3 text-sm text-moonstone-100 placeholder:text-moonstone-400 focus:outline-none focus:ring-2 focus:ring-moonstone-500/40"
                  />
                  <button
                    type="submit"
                    className="glass-button-primary w-full rounded-lg px-4 py-3 text-sm font-semibold shadow-glow-moonstone hover:shadow-glow-moonstone-lg disabled:opacity-50"
                    disabled={isSubmitting || isLoading || cooldownSeconds > 0}
                  >
                    {cooldownSeconds > 0
                      ? `Wait ${cooldownSeconds}s`
                      : isSubmitting
                      ? "Please wait..."
                      : mode === "login"
                      ? "Sign in"
                      : "Create account"}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal
