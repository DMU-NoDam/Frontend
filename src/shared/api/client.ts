import axios from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens, TokenRefreshResponse } from '@/features/auth/types/auth-types'
import { useAuthStore } from '@/app/store/auth-store'
import { mockTokenRefresh } from '@/mocks/auth'

const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

// Separate instance for token refresh — no interceptors, prevents infinite loop
export const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 5000,
})

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 5000,
})

// State for coordinating concurrent 401 responses
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const drainQueue = (err: unknown, token: string | null = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (err) reject(err)
    else resolve(token!)
  })
  refreshQueue = []
}

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Response interceptor: handle 401 with token refresh + retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    const { refreshToken, setTokens, logout } = useAuthStore.getState()

    if (!refreshToken) {
      logout()
      return Promise.reject(error)
    }

    // Queue this request while a refresh is already in-flight
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((newAccessToken) => {
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      let newTokens: AuthTokens

      if (useMockAuth) {
        newTokens = await mockTokenRefresh(refreshToken)
      } else {
        const { data } = await refreshClient.post<TokenRefreshResponse>(
          '/user/public/token-refresh',
          { token: refreshToken },
        )
        newTokens = data.body
      }

      setTokens(newTokens)
      drainQueue(null, newTokens.accessToken)

      original.headers.Authorization = `Bearer ${newTokens.accessToken}`
      return apiClient(original)
    } catch (refreshError) {
      drainQueue(refreshError)
      logout()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
