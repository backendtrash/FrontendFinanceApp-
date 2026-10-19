import apiClient from './client'
import type { RecurringRule, RecurringRuleCreate } from '../types/index'

export const getRecurringRules = async (
  activeOnly: boolean = false
): Promise<RecurringRule[]> => {
  const response = await apiClient.get<RecurringRule[]>(
    '/api/v1/recurring/',
    { params: { active_only: activeOnly } }
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