import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

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

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { isLoading, loginWithCredentials, registerWithEmail, startGoogleAuth } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleCredentials = async (event: React.FormEvent) => {
    event.preventDefault()
    if (mode === "register") {
      await registerWithEmail({ username, email, password })
    } else {
      await loginWithCredentials({ username, password })
    }
    onClose()
  }

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
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-night-800/95 p-6 shadow-2xl"
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200/70">
                    Takers
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Sign in to continue
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Use Google for the quickest way in, or sign in with your email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  onClick={startGoogleAuth}
                  className="flex w-full items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-300/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-300/70"
                  disabled={isLoading}
                >
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-300/50"
                >
                  {mode === "login" ? "Create an account" : "Already have an account? Sign in"}
                </button>

                <form className="grid gap-3" onSubmit={handleCredentials}>
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Username"
                    className="w-full rounded-lg border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                  />
                  {mode === "register" && (
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      placeholder="Email"
                      className="w-full rounded-lg border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                    />
                  )}
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    placeholder="Password"
                    className="w-full rounded-lg border border-white/10 bg-night-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-emerald-300/20 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/30"
                    disabled={isLoading}
                  >
                    {mode === "login" ? "Sign in" : "Create account"}
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
