import apiClient from './client'
import type { Budget, BudgetCreate, BudgetAlert } from '../types/index'

export const getBudgets = async (
  activeOnly: boolean = true
): Promise<Budget[]> => {
  const response = await apiClient.get<Budget[]>('/api/v1/budgets/', {
    params: { active_only: activeOnly },
  })
  return response.data
}

export const getBudget = async (id: string): Promise<Budget> => {
  const response = await apiClient.get<Budget>(`/api/v1/budgets/${id}`)
  return response.data
}

export const createBudget = async (data: BudgetCreate): Promise<Budget> => {
  const response = await apiClient.post<Budget>('/api/v1/budgets/', data)
  return response.data
}

export const updateBudget = async (
  id: string,
  data: Partial<BudgetCreate>
): Promise<Budget> => {
  const response = await apiClient.patch<Budget>(
    `/api/v1/budgets/${id}`,
    data
  )
  return response.data
}

export const deleteBudget = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/budgets/${id}`)
}

export const getBudgetAlerts = async (limit = 20): Promise<BudgetAlert[]> => {
  const response = await apiClient.get<BudgetAlert[]>(
    '/api/v1/budgets/alerts',
    { params: { limit } }
  )
  return response.data
}
export const clearBudgetAlerts = async (): Promise<void> => {
  await apiClient.delete('/api/v1/budgets/alerts')
}
