import apiClient from './client'
import type {
  SinkingFund,
  SinkingFundCreate,
  ContributeRequest,
  ContributeResult,
  PayoutRequest,
  PayoutResult,
  FundActivityEntry,
} from '../types/index'

const BASE = '/api/v1/sinking-funds'

export const getSinkingFunds = async (
  includeInactive = false,
): Promise<SinkingFund[]> => {
  const response = await apiClient.get<SinkingFund[]>(`${BASE}/`, {
    params: { include_inactive: includeInactive },
  })
  return response.data
}

export const getSinkingFund = async (id: string): Promise<SinkingFund> => {
  const response = await apiClient.get<SinkingFund>(`${BASE}/${id}`)
  return response.data
}

export const createSinkingFund = async (
  data: SinkingFundCreate,
): Promise<SinkingFund> => {
  const response = await apiClient.post<SinkingFund>(`${BASE}/`, data)
  return response.data
}

export const updateSinkingFund = async (
  id:   string,
  data: Partial<SinkingFundCreate> & { is_active?: boolean },
): Promise<SinkingFund> => {
  const response = await apiClient.patch<SinkingFund>(`${BASE}/${id}`, data)
  return response.data
}

/**
 * Hard delete. The API returns 409 while the fund still holds money unless
 * onBalance says what to do with it — archiving via updateSinkingFund
 * ({ is_active: false }) is the softer path the UI offers first.
 */
export const deleteSinkingFund = async (
  id: string,
  onBalance?: 'keep' | 'release',
): Promise<void> => {
  await apiClient.delete(`${BASE}/${id}`, {
    params: onBalance ? { on_balance: onBalance } : undefined,
  })
}

/** Creates a real expense linked to the fund — net balance drops now. */
export const contributeToFund = async (
  id:   string,
  data: ContributeRequest = {},
): Promise<ContributeResult> => {
  const response = await apiClient.post<ContributeResult>(
    `${BASE}/${id}/contribute`, data,
  )
  return response.data
}

/**
 * Records the bill being paid out of the fund. Creates no expense, so net
 * balance does not move; a shortfall becomes a top-up contribution and only
 * that part hits net balance.
 */
export const payoutFund = async (
  id:   string,
  data: PayoutRequest = {},
): Promise<PayoutResult> => {
  const response = await apiClient.post<PayoutResult>(
    `${BASE}/${id}/payout`, data,
  )
  return response.data
}

/** Returns fund money to spendable as an earning. Distorts income analytics
 *  by design — confirm with the user before calling. */
export const releaseFund = async (
  id:   string,
  data: { amount?: number; date?: string; notes?: string } = {},
): Promise<SinkingFund> => {
  const response = await apiClient.post<SinkingFund>(`${BASE}/${id}/release`, data)
  return response.data
}

export const renewFund = async (
  id:       string,
  dueDate?: string,
): Promise<SinkingFund> => {
  const response = await apiClient.post<SinkingFund>(
    `${BASE}/${id}/renew`, null,
    { params: dueDate ? { due_date: dueDate } : undefined },
  )
  return response.data
}

export const getFundActivity = async (
  id: string,
  limit  = 50,
  offset = 0,
): Promise<FundActivityEntry[]> => {
  const response = await apiClient.get<FundActivityEntry[]>(
    `${BASE}/${id}/activity`, { params: { limit, offset } },
  )
  return response.data
}
