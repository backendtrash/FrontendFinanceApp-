import { create } from 'zustand'
import type { AuthUser } from '../types/index'
import { setAccessToken, setRefreshToken, clearTokens } from '../api/client'

interface AuthState {
  // ── State ───────────────────────────────────────────────────────────────
  user:          AuthUser | null
  isAuthenticated: boolean
  isLoading:     boolean

  // ── Actions ─────────────────────────────────────────────────────────────
  setAuth:   (user: AuthUser, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setLoading:(loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // ── Initial State ────────────────────────────────────────────────────────
  user:            null,
  isAuthenticated: false,
  isLoading:       true,

  // ── setAuth: called after successful login or register ───────────────────
  setAuth: (user, accessToken, refreshToken) => {
    // Store tokens in memory + localStorage
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)

    set({
      user,
      isAuthenticated: true,
      isLoading:       false,
    })
  },

  // ── clearAuth: called on logout or token refresh failure ─────────────────
  clearAuth: () => {
    clearTokens()
    set({
      user:            null,
      isAuthenticated: false,
      isLoading:       false,
    })
  },

  // ── setLoading: used during initial auth check on app load ───────────────
  setLoading: (loading) => set({ isLoading: loading }),
}))