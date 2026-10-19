import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import * as expensesApi  from '../api/expenses'
import * as earningsApi  from '../api/earnings'
import * as categoriesApi from '../api/categories'
import * as currenciesApi from '../api/currencies'
import * as budgetsApi   from '../api/budgets'
import * as recurringApi from '../api/recurring'
import * as analyticsApi from '../api/analytics'
import * as goalsApi     from '../api/goals'
import * as projectedApi from '../api/projected'
import * as fundsApi     from '../api/sinkingFunds'
import type {
  ProjectedCostCreate,
  SinkingFundCreate,
  ContributeRequest,
  PayoutRequest,
} from '../types/index'
import type {
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseFilters,
  EarningCreate,
  CategoryCreate,
  BudgetCreate,
  RecurringRuleCreate,
  TransactionType,
  GoalCreate,
} from '../types/index'

// ── Query Keys ────────────────────────────────────────────────────────────
// Centralized query keys prevent cache key typos
// Array format allows targeted cache invalidation:
//   queryClient.invalidateQueries({ queryKey: ['expenses'] })
//   invalidates all queries starting with ['expenses']
export const QUERY_KEYS = {
  expenses:       ['expenses']       as const,
  earnings:       ['earnings']       as const,
  categories:     ['categories']     as const,
  currencies:     ['currencies']     as const,
  budgets:        ['budgets']        as const,
  alerts:         ['alerts']         as const,
  recurring:      ['recurring']      as const,
  dashboard:      ['dashboard']      as const,
  monthly:        ['monthly']        as const,
  weekly:         ['weekly']         as const,
  categoryAnalytics: ['categoryAnalytics'] as const,
  projected:      ['projected']      as const,
  budgetProgress: ['budgetProgress'] as const,
  carryForward:   ['carry-forward']  as const,
  sinkingFunds:   ['sinking-funds']  as const,
}

// Everything a new expense touches. Sinking-fund contributions are real
// expenses, so they must fan out exactly the same way — pulled out here so
// the two paths cannot drift apart.
const invalidateAfterExpense = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.monthly })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.budgetProgress })
  qc.invalidateQueries({ queryKey: QUERY_KEYS.categoryAnalytics })
}

// ── Expenses ──────────────────────────────────────────────────────────────
export const useExpenses = (filters: ExpenseFilters = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.expenses, filters],
    queryFn:  () => expensesApi.getExpenses(filters),
  })

export const useCreateExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ExpenseCreate) => expensesApi.createExpense(data),
    onSuccess: () => {
      // Invalidate expenses, analytics, and budgets — all affected by new expense
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.monthly })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgetProgress })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categoryAnalytics })
    },
  })
}

export const useUpdateExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseUpdate }) =>
      expensesApi.updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgetProgress })
    },
  })
}

export const useDeleteExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
    },
  })
}

// ── Earnings ──────────────────────────────────────────────────────────────
export const useEarnings = (filters: ExpenseFilters = {}) =>
  useQuery({
    queryKey: [...QUERY_KEYS.earnings, filters],
    queryFn:  () => earningsApi.getEarnings(filters),
  })

export const useCreateEarning = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: EarningCreate) => earningsApi.createEarning(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.monthly })
    },
  })
}
export const useUpdateEarning = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EarningCreate> }) =>
      earningsApi.updateEarning(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.monthly })
    },
  })
}

export const useDeleteEarning = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => earningsApi.deleteEarning(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    },
  })
}

// ── Categories ────────────────────────────────────────────────────────────
export const useCategories = (type?: TransactionType) =>
  useQuery({
    queryKey: [...QUERY_KEYS.categories, type],
    queryFn:  () => categoriesApi.getCategories(type),
  })

export const useCreateCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CategoryCreate) => categoriesApi.createCategory(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
  })
}

export const useDeleteCategory = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.categories }),
  })
}

// ── Currencies ────────────────────────────────────────────────────────────
export const useCurrencies = () =>
  useQuery({
    queryKey:  QUERY_KEYS.currencies,
    queryFn:   currenciesApi.getCurrencies,
    staleTime: 1000 * 60 * 60,      // 1 hour — rates rarely change
    gcTime:    1000 * 60 * 60 * 24, // keep in cache 24 hours
  })

// Categories also change rarely
export const useCategoriesCached = (type?: TransactionType) =>
  useQuery({
    queryKey:  [...QUERY_KEYS.categories, type],
    queryFn:   () => categoriesApi.getCategories(type),
    staleTime: 1000 * 60 * 30,      // 30 minutes
    gcTime:    1000 * 60 * 60,      // keep in cache 1 hour
  })

// ── Budgets ───────────────────────────────────────────────────────────────
export const useBudgets = (activeOnly = true) =>
  useQuery({
    queryKey: [...QUERY_KEYS.budgets, activeOnly],
    queryFn:  () => budgetsApi.getBudgets(activeOnly),
  })

export const useCreateBudget = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: BudgetCreate) => budgetsApi.createBudget(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgetProgress })
    },
  })
}

export const useUpdateBudget = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetCreate> }) =>
      budgetsApi.updateBudget(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.budgetProgress })
    },
  })
}

export const useDeleteBudget = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => budgetsApi.deleteBudget(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.budgets }),
  })
}

export const useBudgetAlerts = (limit = 10) =>
  useQuery({
    queryKey: [...QUERY_KEYS.alerts, limit],
    queryFn:  () => budgetsApi.getBudgetAlerts(limit),
  })
export const useClearBudgetAlerts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => budgetsApi.clearBudgetAlerts(),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts }),
  })
}

// ── Recurring ─────────────────────────────────────────────────────────────
export const useRecurringRules = (activeOnly = false) =>
  useQuery({
    queryKey: [...QUERY_KEYS.recurring, activeOnly],
    queryFn:  () => recurringApi.getRecurringRules(activeOnly),
  })

export const useCreateRecurringRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecurringRuleCreate) =>
      recurringApi.createRecurringRule(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.recurring }),
  })
}

export const useDeleteRecurringRule = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recurringApi.deleteRecurringRule(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QUERY_KEYS.recurring }),
  })
}

// ── Analytics ─────────────────────────────────────────────────────────────
export const useDashboard = (year?: number, month?: number) =>
  useQuery({
    queryKey: [...QUERY_KEYS.dashboard, year, month],
    queryFn:  () => analyticsApi.getDashboard(year, month),
  })

export const useMonthlyAnalytics = (monthsBack = 12) =>
  useQuery({
    queryKey: [...QUERY_KEYS.monthly, monthsBack],
    queryFn:  () => analyticsApi.getMonthlyAnalytics(monthsBack),
  })

export const useWeeklyAnalytics = (weeksBack = 12) =>
  useQuery({
    queryKey: [...QUERY_KEYS.weekly, weeksBack],
    queryFn:  () => analyticsApi.getWeeklyAnalytics(weeksBack),
  })

export const useCategoryAnalytics = (year?: number, month?: number) =>
  useQuery({
    queryKey: [...QUERY_KEYS.categoryAnalytics, year, month],
    queryFn:  () => analyticsApi.getCategoryAnalytics(year, month),
  })

export const useProjectedAnalytics = (
  monthsAhead = 3,
  monthsBack = 3
) =>
  useQuery({
    queryKey: [...QUERY_KEYS.projected, monthsAhead, monthsBack],
    queryFn:  () =>
      analyticsApi.getProjectedAnalytics(monthsAhead, monthsBack),
  })

export const useBudgetProgress = () =>
  useQuery({
    queryKey: QUERY_KEYS.budgetProgress,
    queryFn:  analyticsApi.getBudgetProgress,
  })

  // ── Goals ─────────────────────────────────────────────────────────────────
export const useGoals = () =>
  useQuery({
    queryKey: ['goals'],
    queryFn:  goalsApi.getGoals,
  })

export const useCreateGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: GoalCreate) => goalsApi.createGoal(data),
    onSuccess:  () => {
      // Invalidate goals AND categories
      // Goal creation auto-creates a savings category
      // Categories cache must refresh to show the new one
      qc.invalidateQueries({ queryKey: ['goals'] })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories })
    },
  })
}

export const useUpdateGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GoalCreate> }) =>
      goalsApi.updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

export const useDeleteGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
}

// ── Projected Costs ────────────────────────────────────────────────────────
export const useProjectedCosts = () =>
  useQuery({
    queryKey:  ['projected-costs'],
    queryFn:   projectedApi.getProjectedCosts,
    staleTime: 1000 * 60 * 5,
  })

export const useMonthlyProjection = (year: number, month: number) =>
  useQuery({
    queryKey:  ['monthly-projection', year, month],
    queryFn:   () => projectedApi.getMonthlyProjection(year, month),
    staleTime: 1000 * 60 * 5,
  })

export const useCreateProjectedCost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjectedCostCreate) =>
      projectedApi.createProjectedCost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projected-costs'] })
      qc.invalidateQueries({ queryKey: ['monthly-projection'] })
    },
  })
}

export const useDeleteProjectedCost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectedApi.deleteProjectedCost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projected-costs'] })
      qc.invalidateQueries({ queryKey: ['monthly-projection'] })
    },
  })
}

// ── Sinking Funds ──────────────────────────────────────────────────────────
// Invalidation differs per action and the difference is deliberate:
//   contribute — creates a real expense, so it fans out like any expense
//   payout     — creates NO expense, so net balance genuinely does not move
//                and dashboard/analytics are left alone. A payout that had
//                to top up DID create an expense, hence the conditional.
export const useSinkingFunds = (includeInactive = false) =>
  useQuery({
    queryKey: [...QUERY_KEYS.sinkingFunds, includeInactive],
    queryFn:  () => fundsApi.getSinkingFunds(includeInactive),
  })

export const useFundActivity = (id: string | null) =>
  useQuery({
    queryKey: [...QUERY_KEYS.sinkingFunds, 'activity', id],
    queryFn:  () => fundsApi.getFundActivity(id as string),
    enabled:  !!id,
  })

export const useCreateSinkingFund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SinkingFundCreate) => fundsApi.createSinkingFund(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds })
      // Creating a fund auto-creates its "<name> Fund" expense category
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories })
    },
  })
}

export const useUpdateSinkingFund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: Partial<SinkingFundCreate> & { is_active?: boolean }
    }) => fundsApi.updateSinkingFund(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds }),
  })
}

export const useDeleteSinkingFund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, onBalance }: {
      id: string
      onBalance?: 'keep' | 'release'
    }) => fundsApi.deleteSinkingFund(id, onBalance),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      // A 'release' disposal creates an earning
      qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
    },
  })
}

export const useContributeToFund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ContributeRequest }) =>
      fundsApi.contributeToFund(id, data ?? {}),
    onSuccess: () => {
      invalidateAfterExpense(qc)
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds })
    },
  })
}

export const usePayoutFund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: PayoutRequest }) =>
      fundsApi.payoutFund(id, data ?? {}),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds })
      // Only a top-up moved real money, so only then does the rest need to
      // refetch. Without one, net balance is unchanged by design.
      if (result?.top_up_expense) invalidateAfterExpense(qc)
    },
  })
}

export const useReleaseFund = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data?: { amount?: number; date?: string; notes?: string }
    }) => fundsApi.releaseFund(id, data ?? {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.sinkingFunds })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.monthly })
    },
  })
}

export const useNetWorthHistory = (monthsBack = 12) =>
  useQuery({
    queryKey:  ['net-worth', monthsBack],
    queryFn:   () => analyticsApi.getNetWorthHistory(monthsBack),
    staleTime: 1000 * 60 * 5,
  })

  export const useYearOverYear = (year: number, month: number) =>
  useQuery({
    queryKey:  ['year-over-year', year, month],
    queryFn:   () => analyticsApi.getYearOverYear(year, month),
    staleTime: 1000 * 60 * 5,
  })

  export const useSpendingTrends = (monthsBack = 6) =>
  useQuery({
    queryKey:  ['spending-trends', monthsBack],
    queryFn:   () => analyticsApi.getSpendingTrends(monthsBack),
    staleTime: 1000 * 60 * 5,
  })


export const useDashboardWeekly = (year: number, month: number) =>
  useQuery({
    queryKey:  ['dashboard-weekly', year, month],
    queryFn:   () => analyticsApi.getDashboardWeekly(year, month),
    staleTime: 1000 * 60 * 5,
  })

export const useCarryForwardStatus = (year: number, month: number) =>
  useQuery({
    queryKey:  [...QUERY_KEYS.carryForward, year, month],
    queryFn:   () => analyticsApi.getCarryForwardStatus(year, month),
    staleTime: 1000 * 60 * 5,
  })

export const useApplyCarryForward = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      analyticsApi.applyCarryForward(year, month),
    onSuccess: (_, { year, month }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      qc.invalidateQueries({ queryKey: [...QUERY_KEYS.carryForward, year, month] })
    },
  })
}

export const useUpdateProjectedCost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectedCostCreate> }) =>
      projectedApi.updateProjectedCost(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projected-costs'] })
      qc.invalidateQueries({ queryKey: ['monthly-projection'] })
    },
  })
}

import * as preferencesApi from '../api/preferences'

export const usePreferences = () =>
  useQuery({
    queryKey:  ['preferences'],
    queryFn:   preferencesApi.getPreferences,
    staleTime: 1000 * 60 * 60, // 1 hour — rarely changes
  })

export const useUpdatePreferences = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: preferencesApi.updatePreferences,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['preferences'] }),
  })
}