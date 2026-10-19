// ── Auth ──────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  access_token:  string
  refresh_token: string
  token_type:    string
  user:          AuthUser
}

export interface MeResponse {
  id:    string
  email: string
  role:  string
}

// ── Currencies ────────────────────────────────────────────────────────────
export interface Currency {
  id:              string
  code:            string
  name:            string
  symbol:          string
  exchange_rate:   number
  rate_updated_at: string | null
  created_at:      string
}

// ── Categories ────────────────────────────────────────────────────────────
export type TransactionType = 'expense' | 'income'

export interface Category {
  id:         string
  user_id:    string | null
  name:       string
  color:      string
  icon:       string
  type:       TransactionType
  is_system:  boolean
  created_at: string
}

export interface CategoryCreate {
  name:  string
  color: string
  icon:  string
  type:  TransactionType
}

// ── Expenses ──────────────────────────────────────────────────────────────
export interface Expense {
  id:                string
  user_id:           string
  amount:            number
  currency_id:       string
  amount_mxn:        number
  category_id:       string | null
  date:              string
  week_number:       number
  week_year:         number
  notes:             string | null
  is_recurring:      boolean
  recurring_rule_id: string | null
  projected_cost_id: string | null
  sinking_fund_id:   string | null
  created_at:        string
  updated_at:        string
}

export interface ExpenseCreate {
  amount:       number
  currency_id:  string
  category_id?: string
  date:         string
  notes?:       string
  is_recurring: boolean
  projected_cost_id?: string
  sinking_fund_id?:   string
}

export interface ExpenseUpdate {
  amount?:      number
  currency_id?: string
  category_id?: string
  date?:        string
  notes?:       string
  is_recurring?: boolean
}

export interface ExpenseListResponse {
  data:   Expense[]
  total:  number
  limit:  number
  offset: number
}

export interface ExpenseFilters {
  date_from?:   string
  date_to?:     string
  category_id?: string
  week_number?: number
  week_year?:   number
  currency_id?: string
  limit?:       number
  offset?:      number
}

// ── Earnings ──────────────────────────────────────────────────────────────
// Earnings mirrors Expense structure exactly
export interface Earning {
  id:                string
  user_id:           string
  amount:            number
  currency_id:       string
  amount_mxn:        number
  category_id:       string | null
  date:              string
  week_number:       number
  week_year:         number
  notes:             string | null
  is_recurring:      boolean
  recurring_rule_id: string | null
  projected_cost_id: string | null
  created_at:        string
  updated_at:        string
}

export interface EarningCreate {
  amount:       number
  currency_id:  string
  category_id?: string
  date:         string
  notes?:       string
  is_recurring: boolean
}

export interface EarningListResponse {
  data:   Earning[]
  total:  number
  limit:  number
  offset: number
}

// ── Budgets ───────────────────────────────────────────────────────────────
export type BudgetPeriod = 'weekly' | 'monthly'

export interface Budget {
  id:              string
  user_id:         string
  category_id:     string | null
  limit_amount:    number
  currency_id:     string
  period:          BudgetPeriod
  alert_threshold: number
  is_active:       boolean
  spent_amount:    number
  pct_spent:       number
  remaining:       number
  created_at:      string
  updated_at:      string
}

export interface BudgetCreate {
  category_id?:    string
  limit_amount:    number
  currency_id:     string
  period:          BudgetPeriod
  alert_threshold: number
}

export interface BudgetAlert {
  id:             string
  budget_id:      string
  pct_spent:      number
  amount_spent:   number
  limit_amount:   number
  triggered_date: string
  triggered_at:   string
}

// ── Recurring Rules ───────────────────────────────────────────────────────
export type FrequencyType = 'weekly' | 'monthly'

export interface RecurringRule {
  id:            string
  user_id:       string
  type:          TransactionType
  amount:        number
  currency_id:   string
  category_id:   string | null
  description:   string | null
  frequency:     FrequencyType
  start_date:    string
  end_date:      string | null
  next_due_date: string
  day_of_week:   number | null
  day_of_month:  number | null
  is_active:     boolean
  created_at:    string
  updated_at:    string
}

export interface RecurringRuleCreate {
  type:          TransactionType
  amount:        number
  currency_id:   string
  category_id?:  string
  description?:  string
  frequency:     FrequencyType
  start_date?:   string
  end_date?:     string
  day_of_week?:  number
  day_of_month?: number
}

// ── Analytics ─────────────────────────────────────────────────────────────
export interface DashboardSummary {
  period_label:      string
  total_income:      number
  total_expenses:    number
  net_balance:       number
  savings_rate:      number
  largest_expense:   number | null
  largest_category:  string | null
  projected_monthly: number
  vs_projected:      number
}

export interface CarryForwardStatus {
  source_period: string
  balance:       number
  entry_type:    'income' | 'expense' | 'none'
  applied:       boolean
}

export interface MonthlyDataPoint {
  month_label:       string
  year:              number
  month:             number
  total_income:      number
  total_expenses:    number
  net_balance:       number
  projected_monthly: number
}

export interface MonthlyAnalytics {
  months:            MonthlyDataPoint[]
  total_income:      number
  total_expenses:    number
  net_balance:       number
  period_months:     number
  projected_monthly: number
}

export interface WeeklyDataPoint {
  week_label:     string
  week_number:    number
  week_year:      number
  total_income:   number
  total_expenses: number
  net_balance:    number
}

export interface WeeklyAnalytics {
  weeks:          WeeklyDataPoint[]
  total_income:   number
  total_expenses: number
  net_balance:    number
}

export interface CategoryDataPoint {
  category_id:       string | null
  category_name:     string
  color:             string
  total_amount:      number
  pct_of_total:      number
  transaction_count: number
}

export interface CategoryAnalytics {
  categories:     CategoryDataPoint[]
  total_expenses: number
  period_label:   string
}

export interface ProjectedDataPoint {
  month_label:      string
  year:             number
  month:            number
  projected_amount: number
  real_amount:      number
  variance:         number
  is_future:        boolean
}

export interface ProjectedAnalytics {
  months:                MonthlyDataPoint[]
  total_projected:       number
  total_real:            number
  total_variance:        number
  avg_monthly_projected: number
}

export interface BudgetProgressItem {
  budget_id:       string
  category_name:   string
  color:           string
  period:          string
  limit_amount:    number
  spent_amount:    number
  pct_spent:       number
  remaining:       number
  alert_threshold: number
  is_over_budget:  boolean
}

export interface BudgetProgressAnalytics {
  budgets:           BudgetProgressItem[]
  total_limit:       number
  total_spent:       number
  over_budget_count: number
}

// ── API Error ─────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

// ── Goals ─────────────────────────────────────────────────────────────────
export type GoalType = 'fixed_amount' | 'monthly_rate'

export interface Goal {
  id:                   string
  user_id:              string
  name:                 string
  type:                 GoalType
  target_amount:        number | null
  currency_id:          string | null
  deadline:             string | null
  target_rate_pct:      number | null
  notes:                string | null
  is_active:            boolean
  // Returned by the backend GoalResponse — declared here so consumers stop
  // reaching for `(goal as any).savings_category_id`
  savings_category_id:  string | null
  initial_amount:       number | null
  current_savings:      number | null
  pct_complete:         number | null
  months_remaining:     number | null
  projected_completion: string | null
  current_rate_pct:     number | null
  on_track:             boolean | null
  created_at:           string
  updated_at:           string
}

export interface GoalCreate {
  name:                 string
  type:                 GoalType
  target_amount?:       number
  currency_id?:         string
  deadline?:            string
  target_rate_pct?:     number
  notes?:               string
  savings_category_id?: string
  start_amount?:        number
}

// ── Projected Costs ────────────────────────────────────────────────────────
export type ProjectedFrequency = 'monthly' | 'weekly' | 'one_time'
export type PlanGroup          = 'committed' | 'living' | 'lifestyle'

export interface ProjectedCost {
  id:           string
  user_id:      string
  name:         string
  amount:       number
  amount_mxn:   number
  currency_id:  string | null
  frequency:    ProjectedFrequency
  month:        number | null
  year:         number | null
  category_id:  string | null
  is_active:    boolean
  notes:        string | null
  plan_group:   PlanGroup
  day_of_week:  number | null
  day_of_month: number | null
  created_at:   string
  updated_at:   string
}

export interface ProjectedCostCreate {
  name:          string
  amount:        number
  currency_id?:  string
  frequency:     ProjectedFrequency
  month?:        number
  year?:         number
  category_id?:  string
  is_active?:    boolean
  notes?:        string
  plan_group?:   PlanGroup
  day_of_week?:  number
  day_of_month?: number
}

export interface MonthlyProjection {
  total_projected_mxn: string
  category_breakdown:  Record<string, string>
  year:                number
  month:               number
}

// ── Sinking Funds ──────────────────────────────────────────────────────────
// Save a set amount each period toward a future lump-sum expense.
//
// Accounting: a set-aside is a REAL expense carrying sinking_fund_id, so net
// balance drops when you save. The payout lives in its own ledger and is
// never an expense, so paying the bill cannot hit net balance a second time.
export type SinkingFundMode = 'target_by_date' | 'fixed_per_period'
export type FundCadence     = 'weekly' | 'monthly'
export type RepeatInterval  = 'none' | 'monthly' | 'quarterly' | 'semiannual' | 'annual'
export type FundStatus      =
  | 'on_track' | 'behind' | 'ahead' | 'funded' | 'overdue' | 'paid'

export interface SinkingFund {
  id:                  string
  user_id:             string
  name:                string
  notes:               string | null
  target_amount:       number | null
  currency_id:         string | null
  opening_balance:     number
  mode:                SinkingFundMode
  contribution_amount: number | null

  cadence:                   FundCadence
  contribution_day_of_week:  number | null   // 0=Mon .. 6=Sun
  contribution_day_of_month: number | null   // 1..31

  due_date:             string | null
  cycle_started_on:     string
  repeat_interval:      RepeatInterval
  renewal_increase_pct: number
  auto_renew:           boolean

  category_id:       string | null
  projected_cost_id: string | null
  is_active:         boolean

  // ── Server-computed ──────────────────────────────────────────────────
  target_amount_mxn:     number | null
  contributed_mxn:       number
  paid_out_mxn:          number
  balance_mxn:           number
  remaining_mxn:         number
  pct_complete:          number
  periods_remaining:     number
  // Catch-up aware — recomputed from today's balance on every read
  set_aside_this_period: number
  // Steady state, ignoring catch-up. Use for FUTURE weeks in Week View
  base_per_period:       number
  monthly_equivalent:    number
  expected_balance_mxn:  number | null
  schedule_variance_mxn: number | null
  status:                FundStatus
  is_overdue:            boolean
  paid_this_cycle:       boolean
  last_payout_on:        string | null
  projected_completion:  string | null
  has_ledger_warning:    boolean

  created_at: string
  updated_at: string
}

export interface SinkingFundCreate {
  name:                 string
  mode:                 SinkingFundMode
  target_amount?:       number
  currency_id?:         string
  contribution_amount?: number
  cadence:              FundCadence
  contribution_day_of_week?:  number
  contribution_day_of_month?: number
  due_date?:            string
  repeat_interval?:     RepeatInterval
  renewal_increase_pct?: number
  auto_renew?:          boolean
  start_amount?:        number
  category_id?:         string
  projected_cost_id?:   string
  notes?:               string
}

export interface SinkingFundPayout {
  id:                 string
  user_id:            string
  sinking_fund_id:    string
  amount:             number
  currency_id:        string | null
  amount_mxn:         number
  paid_on:            string
  kind:               'payout' | 'release'
  notes:              string | null
  cycle_started_on:   string
  cycle_due_date:     string | null
  top_up_expense_id:  string | null
  release_earning_id: string | null
  projected_cost_id:  string | null
  created_at:         string
}

export interface ContributeRequest {
  amount?:      number
  currency_id?: string
  date?:        string
  notes?:       string
}

export interface PayoutRequest {
  amount?:       number
  currency_id?:  string
  paid_on?:      string
  notes?:        string
  renew?:        boolean
  allow_top_up?: boolean
}

export interface ContributeResult {
  fund:    SinkingFund
  expense: Expense
}

export interface PayoutResult {
  fund:           SinkingFund
  payout:         SinkingFundPayout
  top_up_expense: Expense | null
  renewed:        boolean
}

export interface FundActivityEntry {
  id:         string
  kind:       'contribution' | 'payout' | 'release' | 'top_up'
  amount_mxn: number
  date:       string
  notes:      string | null
}