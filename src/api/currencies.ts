import apiClient from './client'
import type { Currency } from '../types/index'

export const getCurrencies = async (): Promise<Currency[]> => {
  const response = await apiClient.get<Currency[]>('/api/v1/currencies/')
  return response.data
}

export const convertAmount = async (
  amount: number,
  from_currency_id: string,
  to_currency_id: string
): Promise<any> => {
  const response = await apiClient.post('/api/v1/currencies/convert', {
    amount,
    from_currency_id,
    to_currency_id,
  })
  return response.data
}