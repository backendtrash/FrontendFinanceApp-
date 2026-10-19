import apiClient from './client'
import type { Goal, GoalCreate } from '../types/index'

export const getGoals = async (): Promise<Goal[]> => {
  const response = await apiClient.get<Goal[]>('/api/v1/goals/')
  return response.data
}

export const createGoal = async (data: GoalCreate): Promise<Goal> => {
  const response = await apiClient.post<Goal>('/api/v1/goals/', data)
  return response.data
}

export const updateGoal = async (
  id: string,
  data: Partial<GoalCreate>
): Promise<Goal> => {
  const response = await apiClient.patch<Goal>(`/api/v1/goals/${id}`, data)
  return response.data
}

export const deleteGoal = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/goals/${id}`)
}

export const deleteAllExpenses = async (): Promise<{ deleted: number }> => {
  const response = await apiClient.delete('/api/v1/expenses/')
  return response.data
}

export const deleteAllEarnings = async (): Promise<{ deleted: number }> => {
  const response = await apiClient.delete('/api/v1/earnings/')
  return response.data
}

export const deleteAllRules = async (): Promise<{ deleted: number }> => {
  const response = await apiClient.delete('/api/v1/recurring/')
  return response.data
}

export const splitExpense = async (
  expenseId: string,
  data: {
    original_amount: number
    original_date:   string
    split_amount:    number
    split_date:      string
  }
): Promise<void> => {
  await apiClient.post(`/api/v1/expenses/${expenseId}/split`, data)
}

// ── Workspace / account-level operations ─────────────────────────────────
export const resetWorkspace = async (): Promise<{ deleted_transactions: number }> => {
  const response = await apiClient.delete('/api/v1/workspace/reset')
  return response.data
}

export const exportAllData = async (): Promise<Blob> => {
  const response = await apiClient.get('/api/v1/export', { responseType: 'blob' })
  return response.data
}