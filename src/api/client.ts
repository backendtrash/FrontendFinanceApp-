import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import type { AuthResponse } from '../types/index'

// ── Axios Instance ────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Token Storage Helpers ─────────────────────────────────────────────────
// Stored in memory (not localStorage) to reduce XSS attack surface
// Refresh token kept in localStorage for persistence across page refreshes
let accessToken: string | null = null

export const setAccessToken  = (token: string | null) => { accessToken = token }
export const getAccessToken  = () => accessToken
export const setRefreshToken = (token: string)        => localStorage.setItem('refresh_token', token)
export const getRefreshToken = ()                      => localStorage.getItem('refresh_token')
export const clearTokens     = () => {
  accessToken = null
  localStorage.removeItem('refresh_token')
}

// ── Request Interceptor ───────────────────────────────────────────────────
// Automatically injects JWT into every request
// No need to manually add Authorization header in any API call
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response Interceptor ──────────────────────────────────────────────────
// Handles 401 errors by attempting token refresh
// If refresh succeeds → retries original request transparently
// If refresh fails → clears tokens → redirects to login
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject:  (error: unknown) => void
}> = []

// Processes all queued requests after refresh completes
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error)
    } else if (token) {
      p.resolve(token)
    }
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  // Pass successful responses through unchanged
  (response: AxiosResponse) => response,

  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh on 401 errors that haven't been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = getRefreshToken()

      // No refresh token → cannot recover → redirect to login
      if (!refreshToken) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // If already refreshing → queue this request until refresh completes
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      // Mark as retried to prevent infinite retry loop
      originalRequest._retry = true
      isRefreshing = true

      try {
        // Attempt to get new access token using refresh token
        // Must use the same base as apiClient. Interpolating the env var
        // directly produced the literal string "undefined/api/v1/auth/refresh"
        // in dev, where VITE_API_BASE_URL is unset (only .env.production
        // defines it) — the refresh then hit the dev server instead of the API.
        const response = await axios.post<AuthResponse>(
          `${apiClient.defaults.baseURL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        )

        const newAccessToken  = response.data.access_token
        const newRefreshToken = response.data.refresh_token

        setAccessToken(newAccessToken)
        setRefreshToken(newRefreshToken)

        // Retry all queued requests with new token
        processQueue(null, newAccessToken)

        // Retry original failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)

      } catch (refreshError) {
        // Refresh failed → session is dead → force re-login
        processQueue(refreshError, null)
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient