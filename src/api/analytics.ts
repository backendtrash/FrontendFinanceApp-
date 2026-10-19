import apiClient from './client'
import type {
  DashboardSummary,
  MonthlyAnalytics,
  WeeklyAnalytics,
  CategoryAnalytics,
  ProjectedAnalytics,
  BudgetProgressAnalytics,
  CarryForwardStatus,
} from '../types/index'

export const getDashboard = async (
  year?: number,
  month?: number
): Promise<DashboardSummary> => {
  const response = await apiClient.get<DashboardSummary>(
    '/api/v1/analytics/dashboard',
    { params: { year, month } }
  )
  return response.data
}

export const getMonthlyAnalytics = async (
  monthsBack: number = 12
): Promise<MonthlyAnalytics> => {
  const response = await apiClient.get<MonthlyAnalytics>(
    '/api/v1/analytics/monthly',
    { params: { months_back: monthsBack } }
  )
  return response.data
}

export const getWeeklyAnalytics = async (
  weeksBack: number = 12
): Promise<WeeklyAnalytics> => {
  const response = await apiClient.get<WeeklyAnalytics>(
    '/api/v1/analytics/weekly',
    { params: { weeks_back: weeksBack } }
  )
  return response.data
}

export const getCategoryAnalytics = async (
  year?: number,
  month?: number
): Promise<CategoryAnalytics> => {
  const response = await apiClient.get<CategoryAnalytics>(
    '/api/v1/analytics/categories',
    { params: { year, month } }
  )
  return response.data
}

export const getProjectedAnalytics = async (
  monthsAhead: number = 3,
  monthsBack: number = 3
): Promise<ProjectedAnalytics> => {
  const response = await apiClient.get<ProjectedAnalytics>(
    '/api/v1/analytics/projected',
    { params: { months_ahead: monthsAhead, months_back: monthsBack } }
  )
  return response.data
}

export const getBudgetProgress = async (): Promise<BudgetProgressAnalytics> => {
  const response = await apiClient.get<BudgetProgressAnalytics>(
    '/api/v1/analytics/budget-progress'
  )
  return response.data
}

export const getNetWorthHistory = async (
  monthsBack = 12
): Promise<any> => {
  const r = await apiClient.get(
    `/api/v1/analytics/net-worth?months_back=${monthsBack}`
  )
  return r.data
}

export const getYearOverYear = async (
  year:  number,
  month: number,
): Promise<any> => {
  const r = await apiClient.get(
    `/api/v1/analytics/year-over-year?year=${year}&month=${month}`
  )
  return r.data
}

export const getSpendingTrends = async (
  monthsBack = 6
): Promise<any> => {
  const r = await apiClient.get(
    `/api/v1/analytics/trends?months_back=${monthsBack}`
  )
  return r.data
}

export const getDashboardWeekly = async (
  year:  number,
  month: number,
): Promise<any> => {
  const r = await apiClient.get(
    `/api/v1/analytics/dashboard-weekly?year=${year}&month=${month}`
  )
  return r.data
}

export const getCarryForwardStatus = async (
  year: number,
  month: number,
): Promise<CarryForwardStatus> => {
  const r = await apiClient.get<CarryForwardStatus>(
    '/api/v1/analytics/carry-forward',
    { params: { year, month } },
  )
  return r.data
}

export const applyCarryForward = async (
  year: number,
  month: number,
): Promise<CarryForwardStatus> => {
  const r = await apiClient.post<CarryForwardStatus>(
    '/api/v1/analytics/carry-forward',
    { year, month },
  )
  return r.data
}