import axios, { AxiosError } from "axios"
import type { InternalAxiosRequestConfig } from "axios"

import { authStorage } from "../auth/storage"

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
})

const normalizeUrl = (url: string) => {
  if (!url || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/api")) {
    return url
  }
  return `/api${url.startsWith("/") ? url : `/${url}`}`
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken()
  if (config.url) {
    config.url = normalizeUrl(config.url)
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

const flushQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token))
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) {
      authStorage.clear()
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const response = await apiClient.post("/auth/token/refresh/", {
        refresh: refreshToken,
      })
      const newAccess = (response.data as { access: string }).access
      authStorage.setAccessToken(newAccess)
      flushQueue(newAccess)
      originalRequest.headers.Authorization = `Bearer ${newAccess}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      authStorage.clear()
      flushQueue(null)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
