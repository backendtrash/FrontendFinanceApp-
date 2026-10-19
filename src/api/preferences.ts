import apiClient from './client'

export interface UserPreferences {
  id:             string
  user_id:        string
  week_start_day: number  // 0 = Sunday, 1 = Monday
  created_at:     string
  updated_at:     string
}

export const getPreferences = async (): Promise<UserPreferences> => {
  const r = await apiClient.get<UserPreferences>('/api/v1/preferences/')
  return r.data
}

export const updatePreferences = async (
  data: Partial<Pick<UserPreferences, 'week_start_day'>>
): Promise<UserPreferences> => {
  const r = await apiClient.patch<UserPreferences>('/api/v1/preferences/', data)
  return r.data
}