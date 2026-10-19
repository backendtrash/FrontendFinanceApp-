import { useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { getRefreshToken } from '../api/client'
import axios from 'axios'
import type { AuthResponse } from '../types/index'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore()

  useEffect(() => {
    /*
     * On app load, check if user has a stored refresh token.
     * If yes → attempt to get a new access token → restore session.
     * If no  → user is not logged in → show login page.
     *
     * This runs once on mount — restores auth state after page refresh.
     * Without this, user would be logged out on every page refresh.
     */
    const restoreSession = async () => {
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        // No refresh token stored → user is not logged in
        setLoading(false)
        return
      }

      try {
        // Exchange refresh token for new access token
        const response = await axios.post<AuthResponse>(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        )

        const { access_token, refresh_token, user } = response.data
        setAuth(user, access_token, refresh_token)

      } catch {
        // Refresh token is expired or invalid → clear and show login
        clearAuth()
      }
    }

    restoreSession()
  }, [])

  return { user, isAuthenticated, isLoading, setAuth, clearAuth }
}