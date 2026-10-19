import apiClient from './client'
import type { AuthResponse, MeResponse } from '../types/index'

// ── Register ──────────────────────────────────────────────────────────────
export const register = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    '/api/v1/auth/register',
    { email, password }
  )
  return response.data
}

// ── Login ─────────────────────────────────────────────────────────────────
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>(
    '/api/v1/auth/login',
    { email, password }
  )
  return response.data
}

// ── Logout ────────────────────────────────────────────────────────────────
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/v1/auth/logout')
}

// ── Get Current User ──────────────────────────────────────────────────────
export const getMe = async (): Promise<MeResponse> => {
  const response = await apiClient.get<MeResponse>('/api/v1/auth/me')
  return response.data
}

// ── Delete Account ────────────────────────────────────────────────────────
export const deleteAccount = async (): Promise<void> => {
  await apiClient.delete('/api/v1/auth/account')
}