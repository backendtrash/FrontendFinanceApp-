import apiClient from './client'
import type { ProjectedCost, ProjectedCostCreate, MonthlyProjection } from '../types/index'

export const getProjectedCosts = async (): Promise<ProjectedCost[]> => {
  const r = await apiClient.get<ProjectedCost[]>('/api/v1/projected/')
  return r.data
}

export const getMonthlyProjection = async (
  year: number,
  month: number,
): Promise<MonthlyProjection> => {
  const r = await apiClient.get<MonthlyProjection>(
    `/api/v1/projected/monthly?year=${year}&month=${month}`
  )
  return r.data
}

export const createProjectedCost = async (
  data: ProjectedCostCreate,
): Promise<ProjectedCost> => {
  const r = await apiClient.post<ProjectedCost>('/api/v1/projected/', data)
  return r.data
}

export const updateProjectedCost = async (
  id:   string,
  data: Partial<ProjectedCostCreate>,
): Promise<ProjectedCost> => {
  const r = await apiClient.patch<ProjectedCost>(`/api/v1/projected/${id}`, data)
  return r.data
}

export const deleteProjectedCost = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/projected/${id}`)
}