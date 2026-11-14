import apiClient from './client'
import type { RecurringRule, RecurringRuleCreate, MonthlyRecurring } from '../types/index'

export const getRecurringRules = async (
  activeOnly: boolean = false
): Promise<RecurringRule[]> => {
  const response = await apiClient.get<RecurringRule[]>(
    '/api/v1/recurring/',
    { params: { active_only: activeOnly } }
  )
  return response.data
}

// What the active rules charge in a month, counted by the API from each
// rule's real charge dates (defect 30).
export const getMonthlyRecurring = async (
  year: number,
  month: number,
): Promise<MonthlyRecurring> => {
  const response = await apiClient.get<MonthlyRecurring>(
    '/api/v1/recurring/monthly',
    { params: { year, month } }
  )
  return response.data
}

export const createRecurringRule = async (
  data: RecurringRuleCreate
): Promise<RecurringRule> => {
  const response = await apiClient.post<RecurringRule>(
    '/api/v1/recurring/',
    data
  )
  return response.data
}

export const updateRecurringRule = async (
  id: string,
  data: Partial<RecurringRuleCreate>
): Promise<RecurringRule> => {
  const response = await apiClient.patch<RecurringRule>(
    `/api/v1/recurring/${id}`,
    data
  )
  return response.data
}

export const deleteRecurringRule = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/recurring/${id}`)
}

export const processRecurringRules = async (): Promise<any> => {
  const response = await apiClient.post('/api/v1/recurring/process')
  return response.data
}