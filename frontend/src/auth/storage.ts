const ACCESS_TOKEN_KEY = "takers_access_token"
const REFRESH_TOKEN_KEY = "takers_refresh_token"

let memoryAccessToken: string | null = null
let memoryRefreshToken: string | null = null

export const authStorage = {
  getAccessToken: () => memoryAccessToken || localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () =>
    memoryRefreshToken || localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string) => {
    memoryAccessToken = access
    memoryRefreshToken = refresh
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
  },
  setAccessToken: (access: string) => {
    memoryAccessToken = access
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
  },
  clear: () => {
    memoryAccessToken = null
    memoryRefreshToken = null
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
