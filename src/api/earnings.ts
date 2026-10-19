import apiClient from './client'
import type {
  Earning,
  EarningCreate,
  EarningListResponse,
  ExpenseFilters,
} from '../types/index'

export const getEarnings = async (
  filters: ExpenseFilters = {}
): Promise<EarningListResponse> => {
  const response = await apiClient.get<EarningListResponse>(
    '/api/v1/earnings/',
    { params: filters }
  )
  return response.data
}

export const getEarning = async (id: string): Promise<Earning> => {
  const response = await apiClient.get<Earning>(`/api/v1/earnings/${id}`)
  return response.data
}

export const createEarning = async (
  data: EarningCreate
): Promise<Earning> => {
  const response = await apiClient.post<Earning>('/api/v1/earnings/', data)
  return response.data
}

export const updateEarning = async (
  id: string,
  data: Partial<EarningCreate>
): Promise<Earning> => {
  const response = await apiClient.patch<Earning>(
    `/api/v1/earnings/${id}`,
    data
  )
  return response.data
}

export const deleteEarning = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/earnings/${id}`)
}

export const importEarnings = async (
  rows: EarningCreate[]
): Promise<{ created: number; errors: any[]; total: number }> => {
  const response = await apiClient.post('/api/v1/earnings/import', rows)
  return response.data
}

export interface MonthSummary {
  month_key: string
  year:      number
  month:     number
  total_mxn: string
  count:     number
}

export const getEarningMonths = async (): Promise<MonthSummary[]> => {
  const response = await apiClient.get<MonthSummary[]>(
    '/api/v1/earnings/months'
  )
  return response.data
}