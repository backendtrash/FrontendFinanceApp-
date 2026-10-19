import apiClient from './client'
import type {
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseListResponse,
  ExpenseFilters,
} from '../types/index'

export const getExpenses = async (
  filters: ExpenseFilters = {}
): Promise<ExpenseListResponse> => {
  const response = await apiClient.get<ExpenseListResponse>(
    '/api/v1/expenses/',
    { params: filters }
  )
  return response.data
}

export const getExpense = async (id: string): Promise<Expense> => {
  const response = await apiClient.get<Expense>(`/api/v1/expenses/${id}`)
  return response.data
}

export const createExpense = async (
  data: ExpenseCreate
): Promise<Expense> => {
  const response = await apiClient.post<Expense>('/api/v1/expenses/', data)
  return response.data
}

export const updateExpense = async (
  id: string,
  data: ExpenseUpdate
): Promise<Expense> => {
  const response = await apiClient.patch<Expense>(
    `/api/v1/expenses/${id}`,
    data
  )
  return response.data
}

export const deleteExpense = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/expenses/${id}`)
}

export const getWeeklySummary = async (
  weekYear: number,
  weekNumber: number
): Promise<any> => {
  const response = await apiClient.get(
    `/api/v1/expenses/weekly/${weekYear}/${weekNumber}`
  )
  return response.data
}

export const importExpenses = async (
  rows: ExpenseCreate[]
): Promise<{ created: number; errors: any[]; total: number }> => {
  const response = await apiClient.post('/api/v1/expenses/import', rows)
  return response.data
}

export interface MonthSummary {
  month_key: string
  year:      number
  month:     number
  total_mxn: string
  count:     number
}

export const getExpenseMonths = async (): Promise<MonthSummary[]> => {
  const response = await apiClient.get<MonthSummary[]>(
    '/api/v1/expenses/months'
  )
  return response.data
}