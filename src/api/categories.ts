import apiClient from './client'
import type { Category, CategoryCreate, TransactionType } from '../types/index'

export const getCategories = async (
  type?: TransactionType
): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/api/v1/categories/', {
    params: type ? { type } : {},
  })
  return response.data
}

export const getCategory = async (id: string): Promise<Category> => {
  const response = await apiClient.get<Category>(`/api/v1/categories/${id}`)
  return response.data
}

export const createCategory = async (
  data: CategoryCreate
): Promise<Category> => {
  const response = await apiClient.post<Category>('/api/v1/categories/', data)
  return response.data
}

export const updateCategory = async (
  id: string,
  data: Partial<CategoryCreate>
): Promise<Category> => {
  const response = await apiClient.patch<Category>(
    `/api/v1/categories/${id}`,
    data
  )
  return response.data
}

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/categories/${id}`)
}