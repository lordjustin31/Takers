import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, Mail, ShoppingBag, User } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../../auth/AuthContext"

function AuthPage() {
  const {
    isLoading,
    authError,
    loginWithCredentials,
    registerWithEmail,
    startGoogleAuth,
    clearAuthError,
  } = useAuth()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({})

  const validate = () => {
    const nextErrors: { username?: string; email?: string; password?: string } = {}

    if (!username.trim()) {
      nextErrors.username = "Username is required"
    }

    if (mode === "register") {
      if (!email.trim()) {
        nextErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        nextErrors.email = "Enter a valid email"
      }
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required"
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters"
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearAuthError()
    if (!validate()) {
      return
    }

    if (mode === "register") {
      await registerWithEmail({ username: username.trim(), email: email.trim(), password })
    } else {
      await loginWithCredentials({ username: username.trim(), password })
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neu-100 px-4 py-8 sm:px-6">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-400/20 to-blue-400/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-300/10 to-pink-300/10 blur-2xl" />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="neu-card p-8 lg:p-10">
          {/* Branding */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-glow-blue">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-neu-800 font-display">
              Takers Marketplace
            </h1>
            <p className="mt-1 text-sm text-neu-500">
              {mode === "login" ? "Welcome back! Sign in to continue" : "Create your account and start selling"}
            </p>
          </div>

          {/* Error Display */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600"
            >
              {authError}
            </motion.div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Username Input */}
            <div>
              <div className="neu-card-inset flex items-center gap-3 px-5 py-4">
                <User className="h-5 w-5 text-neu-400" />
                <input
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value)
                    setErrors((prev) => ({ ...prev, username: undefined }))
                  }}
                  placeholder="Username"
                  className="flex-1 bg-transparent text-sm text-neu-700 placeholder:text-neu-400 focus:outline-none"
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-xs text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Email Input (Register only) */}
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="neu-card-inset flex items-center gap-3 px-5 py-4">
                  <Mail className="h-5 w-5 text-neu-400" />
                  <input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setErrors((prev) => ({ ...prev, email: undefined }))
                    }}
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-sm text-neu-700 placeholder:text-neu-400 focus:outline-none"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-xs text-red-500">{errors.email}</p>
                )}
              </motion.div>
            )}

            {/* Password Input */}
            <div>
              <div className="neu-card-inset flex items-center gap-3 px-5 py-4">
                <Lock className="h-5 w-5 text-neu-400" />
                <input
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="flex-1 bg-transparent text-sm text-neu-700 placeholder:text-neu-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neu-400 hover:text-neu-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {mode === "login" && (
              <button
                type="button"
                className="text-sm text-neu-500 hover:text-blue-600"
              >
                Forget Password?
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="neu-button w-full bg-gradient-to-br from-blue-500 to-blue-600 py-4 text-base font-semibold text-white shadow-glow-blue hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                clearAuthError()
                setMode((prev) => (prev === "login" ? "register" : "login"))
                setErrors({})
              }}
              className="text-sm text-neu-600 hover:text-blue-600"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-neu-300" />
            <span className="text-xs text-neu-400">OR</span>
            <div className="h-px flex-1 bg-neu-300" />
          </div>

          {/* Google Auth */}
          <button
            type="button"
            onClick={() => {
              clearAuthError()
              startGoogleAuth()
            }}
            disabled={isLoading}
            className="neu-button flex w-full items-center justify-center gap-3 py-4 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-medium text-neu-700">Continue with Google</span>
          </button>
        </div>

        {/* Bottom tagline */}
        <p className="mt-6 text-center text-xs text-neu-400">
          Buy & Sell in One Place
        </p>
      </motion.div>
    </div>
  )
}

export default AuthPage
