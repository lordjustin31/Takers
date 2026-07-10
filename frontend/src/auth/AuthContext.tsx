import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import apiClient from "../api/client"
import { authStorage } from "./storage"

export interface AuthUser {
  id: number
  email: string
  username: string
  display_name: string
  avatar_url: string
  is_verified_seller: boolean
  is_staff: boolean
  is_superuser: boolean
  is_private: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  authError: string | null
  loginWithGoogle: (payload: { accessToken?: string; code?: string }) => Promise<void>
  loginWithCredentials: (payload: { username: string; password: string }) => Promise<void>
  registerWithEmail: (payload: { username: string; email: string; password: string }) => Promise<void>
  startGoogleAuth: () => void
  logout: () => Promise<void>
  setSession: (access: string, refresh: string, user: AuthUser) => void
  clearAuthError: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(
    authStorage.getAccessToken(),
  )
  const [refreshToken, setRefreshToken] = useState<string | null>(
    authStorage.getRefreshToken(),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    const response = await apiClient.get<AuthUser>("/auth/me/")
    setUser(response.data)
  }, [])

  const refreshUser = useCallback(async () => {
    if (!accessToken) return
    try {
      await fetchProfile()
    } catch (error) {
      console.error("Failed to refresh user profile:", error)
    }
  }, [accessToken, fetchProfile])

  const setSession = useCallback((access: string, refresh: string, nextUser: AuthUser) => {
    authStorage.setTokens(access, refresh)
    setAccessToken(access)
    setRefreshToken(refresh)
    setUser(nextUser)
  }, [])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  const loginWithGoogle = useCallback(
    async (payload: { accessToken?: string; code?: string }) => {
      setIsLoading(true)
      setAuthError(null)
      try {
        const redirectUri =
          import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin
         console.log('🔍 Google OAuth - Sending to backend:', { 
           code: payload.code, 
           redirectUri,
           clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID 
         })
        const response = await apiClient.post("/auth/google/", {
          access_token: payload.accessToken,
          code: payload.code,
          redirect_uri: redirectUri,
        })
         console.log('✅ Backend response:', response.data)
        const { access, refresh, user: profile } = response.data as {
          access: string
          refresh: string
          user: AuthUser
        }
        setSession(access, refresh, profile)
      } catch (error: unknown) {
         console.log('❌ Backend error:', error)
        const message =
          error instanceof Error ? error.message : "Google sign-in failed. Please try again."
        setAuthError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [setSession],
  )

  const loginWithCredentials = useCallback(
    async (payload: { username: string; password: string }) => {
      setIsLoading(true)
      setAuthError(null)
      try {
        const response = await apiClient.post("/auth/token/", {
          username: payload.username,
          password: payload.password,
        })
        const { access, refresh } = response.data as {
          access: string
          refresh: string
        }
        authStorage.setTokens(access, refresh)
        setAccessToken(access)
        setRefreshToken(refresh)
        await fetchProfile()
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "Incorrect username or password."
        const detail =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
            : null
        setAuthError(detail || message)
      } finally {
        setIsLoading(false)
      }
    },
    [fetchProfile],
  )

  const registerWithEmail = useCallback(
    async (payload: { username: string; email: string; password: string }) => {
      setIsLoading(true)
      setAuthError(null)
      try {
        const response = await apiClient.post("/auth/register/", payload)
        const { access, refresh, user: profile } = response.data as {
          access: string
          refresh: string
          user: AuthUser
        }
        setSession(access, refresh, profile)
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unable to create account. Please try again."
        setAuthError(message)
      } finally {
        setIsLoading(false)
      }
    },
    [setSession],
  )

  const startGoogleAuth = useCallback(() => {
    setAuthError(null)
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    const redirectUri =
      import.meta.env.VITE_GOOGLE_REDIRECT_URI || window.location.origin
    if (!clientId) {
      setAuthError("Google sign-in is not configured yet.")
      return
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    })
    const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
    window.location.assign(authUrl)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    if (code) {
      loginWithGoogle({ code }).then(() => {
        params.delete("code")
        const url = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState({}, "", url.endsWith("?") ? url.slice(0, -1) : url)
      })
    } else if (accessToken) {
      fetchProfile().catch(() => {
        authStorage.clear()
        setAccessToken(null)
        setRefreshToken(null)
        setUser(null)
      })
    }
  }, [accessToken, fetchProfile, loginWithGoogle])

  const logout = useCallback(async () => {
    const refresh = refreshToken || authStorage.getRefreshToken()
    setIsLoading(true)
    try {
      if (refresh) {
        await apiClient.post("/auth/logout/", { refresh })
      }
    } finally {
      authStorage.clear()
      setAccessToken(null)
      setRefreshToken(null)
      setUser(null)
      setIsLoading(false)
    }
  }, [refreshToken])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isLoading,
      authError,
      loginWithGoogle,
      loginWithCredentials,
      registerWithEmail,
      startGoogleAuth,
      logout,
      setSession,
      clearAuthError,
      refreshUser,
    }),
    [
      user,
      accessToken,
      refreshToken,
      isLoading,
      authError,
      loginWithGoogle,
      loginWithCredentials,
      registerWithEmail,
      startGoogleAuth,
      logout,
      setSession,
      clearAuthError,
      refreshUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
