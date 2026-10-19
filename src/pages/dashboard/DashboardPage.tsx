import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Wallet,
  Target, ClipboardList, FileText,
  ChevronLeft, ChevronRight, ArrowRight, Trophy, Star,
} from 'lucide-react'
import {
  useDashboard, useMonthlyAnalytics, useCategoryAnalytics,
  useBudgetProgress, useGoals, useExpenses, useEarnings,
  useCurrencies, useDashboardWeekly, useMonthlyProjection,
  useCarryForwardStatus, useApplyCarryForward,
} from '../../hooks/useQueries'
import DashboardWeeklyChart from '../../components/charts/DashboardWeeklyChart'
import { generateMonthlyReport } from '../../utils/pdfReport'
import Card, { CardHeader } from '../../components/ui/Card'
import { DashboardSkeleton } from '../../components/ui/Skeleton'
import MonthlyChart   from '../../components/charts/MonthlyChart'
import CategoryChart  from '../../components/charts/CategoryChart'
import { formatMXN, formatPct } from '../../utils/formatters'
import { useAuthStore }    from '../../store/authStore'
import { useAddSheetStore } from '../../store/addSheetStore'
import Modal                from '../../components/ui/Modal'
import { ExpenseForm }      from '../expenses/ExpensesPage'
import { EarningForm }      from '../earnings/EarningsPage'
import { GoalForm }         from '../goals/GoalsPage'
import { BudgetForm }       from '../budgets/BudgetsPage'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon, valueColor, trend, trendPositive,
}: {
  label:         string
  value:         string
  sub?:          string
  icon:          React.ReactNode
  valueColor?:   string
  trend?:        string
  trendPositive?: boolean
}) {
  return (
    <div className="s-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>
          {label}
        </span>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--surface-alt)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
      <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: valueColor ?? 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, flexWrap: 'wrap' }}>
          {trend && (
            <span style={{
              fontSize: 10.5, fontWeight: 600,
              background: trendPositive ? 'var(--positive-soft)' : 'var(--negative-soft)',
              color:      trendPositive ? 'var(--positive)'      : 'var(--negative)',
              padding: '2px 6px', borderRadius: 4,
            }}>
              {trend}
            </span>
          )}
          {sub && (
            <span style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {sub}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Budget progress bar ───────────────────────────────────────────────────
function BudgetRow({
  name, pct, spent, limit, color,
}: { name: string; pct: number; spent: number; limit: number; color: string }) {
  const over     = pct > 100
  const warn     = pct > 80
  const barColor = over ? 'var(--negative)' : warn ? 'var(--warning)' : 'var(--positive)'
  const textColor = over ? 'var(--negative)' : warn ? 'var(--warning)' : 'var(--positive)'

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text)' }}>{name}</span>
        </span>
        <span className="font-mono" style={{ fontWeight: 600, color: textColor }}>{formatPct(pct)}</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-mute)', marginTop: 3 }}>
        <span className="font-mono">{formatMXN(spent)}</span>
        <span className="font-mono">{formatMXN(limit)}</span>
      </div>
    </div>
  )
}

// ── Goal progress bar ─────────────────────────────────────────────────────
function GoalRow({
  name, pct, current, target, color, isRate, currentRate, targetRate, onTrack,
}: {
  name: string; pct?: number; current?: number; target?: number; color?: string
  isRate?: boolean; currentRate?: number; targetRate?: number; onTrack?: boolean
}) {
  if (isRate) {
    const rate  = Number(currentRate ?? 0)
    const tRate = Number(targetRate  ?? 0)
    const p     = tRate > 0 ? Math.min((rate / tRate) * 100, 100) : 0
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
          <span style={{ color: 'var(--text)' }}>{name}</span>
          <span className="font-mono" style={{ fontWeight: 600, color: onTrack ? 'var(--positive)' : 'var(--negative)' }}>
            {formatPct(rate)} / {formatPct(tRate)}
          </span>
        </div>
        <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${p}%`, height: '100%', background: onTrack ? 'var(--positive)' : 'var(--negative)', borderRadius: 3 }} />
        </div>
      </div>
    )
  }

  const safePct   = Number(pct ?? 0)
  const reached   = safePct >= 100
  const barColor  = reached ? 'var(--positive)' : (color ?? 'var(--accent)')
  const textColor = reached ? 'var(--positive)' : (color ?? 'var(--accent)')

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: color ?? 'var(--accent)', flexShrink: 0 }} />
          <span style={{ color: 'var(--text)' }}>{name}</span>
        </span>
        <span className="font-mono" style={{ fontWeight: 600, color: textColor }}>{formatPct(safePct)}</span>
      </div>
      <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(safePct, 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-mute)', marginTop: 3 }}>
        <span className="font-mono">{formatMXN(Number(current ?? 0))}</span>
        <span className="font-mono">{formatMXN(Number(target ?? 0))}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
const GOAL_COLORS = ['#702963','#1f7a4d','#a8651b','#2563a0','#7a5191','#3a8a73','#bf6f2e','#525a68']
function getGoalColor(goalId: string, allGoals: { id: string; created_at: string }[]): string {
  const sorted = [...allGoals].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const idx    = sorted.findIndex(g => g.id === goalId)
  return GOAL_COLORS[Math.max(idx, 0) % GOAL_COLORS.length]
}

const QUICK_ACTIONS = [
  { label: 'Expense', color: 'var(--negative)', bg: 'var(--negative-soft)', Icon: TrendingDown, to: '/expenses' },
  { label: 'Income',  color: 'var(--positive)', bg: 'var(--positive-soft)', Icon: TrendingUp,   to: '/earnings' },
  { label: 'Budgets', color: 'var(--info)',     bg: 'var(--info-soft)',     Icon: Target,       to: '/budgets'  },
  { label: 'Goals',   color: 'var(--accent)',   bg: 'var(--accent-soft)',   Icon: Trophy,       to: '/goals'    },
]

export default function DashboardPage() {
  const today    = new Date()
  const navigate = useNavigate()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const { data: dashboard,   isLoading: loadingDash    } = useDashboard(year, month)
  const { data: monthly                                  } = useMonthlyAnalytics(6)
  const { data: categories                               } = useCategoryAnalytics(year, month)
  const { data: budgetProg                               } = useBudgetProgress()
  const { data: projection                               } = useMonthlyProjection(year, month)
  const { data: goals = []                               } = useGoals()
  const { data: weeklyData                               } = useDashboardWeekly(year, month)
  const { data: expData                                  } = useExpenses({
    date_from: `${year}-${String(month).padStart(2,'0')}-01`,
    date_to:   `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`,
    limit:     200,
  })
  const { data: incData     } = useEarnings({
    date_from: `${year}-${String(month).padStart(2,'0')}-01`,
    date_to:   `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`,
    limit:     200,
  })
  const { data: currencies = [] } = useCurrencies()
  const { user }                   = useAuthStore()
  const [generating, setGenerating] = useState(false)

  const isCurrentMonth = month === today.getMonth() + 1 && year === today.getFullYear()

  const { data: cfStatus }  = useCarryForwardStatus(year, month)
  const applyCarryForward   = useApplyCarryForward()
  const cfAppliedRef        = useRef(false)

  useEffect(() => {
    if (
      isCurrentMonth &&
      cfStatus &&
      !cfStatus.applied &&
      Number(cfStatus.balance) !== 0 &&
      !cfAppliedRef.current &&
      !applyCarryForward.isPending
    ) {
      cfAppliedRef.current = true
      applyCarryForward.mutate({ year, month })
    }
  }, [cfStatus, isCurrentMonth])

  const [showExpense, setShowExpense] = useState(false)
  const [showIncome,  setShowIncome]  = useState(false)
  const [showGoal,    setShowGoal]    = useState(false)
  const [showBudget,  setShowBudget]  = useState(false)

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if      (pendingAction === 'expense:open-add') { setShowExpense(true); clearPendingAction() }
    else if (pendingAction === 'earning:open-add') { setShowIncome(true);  clearPendingAction() }
    else if (pendingAction === 'goal:open-add')    { setShowGoal(true);    clearPendingAction() }
    else if (pendingAction === 'budget:open-add')  { setShowBudget(true);  clearPendingAction() }
  }, [pendingAction])

  const featuredGoalId = localStorage.getItem('featuredGoalId') ?? ''
  const net            = Number(dashboard?.net_balance ?? 0)

  const handleDownload = async () => {
    setGenerating(true)
    try {
      await generateMonthlyReport({
        month:     String(month).padStart(2, '0'),
        year,
        monthName: MONTHS[month - 1],
        dashboard,
        expenses:  expData?.data         ?? [],
        earnings:  incData?.data         ?? [],
        categories: categories?.categories ?? [],
        budgets:   budgetProg?.budgets    ?? [],
        goals,
        currencies,
      })
    } finally { setGenerating(false) }
  }

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  if (loadingDash) return <DashboardSkeleton />

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>
            Good morning, {user?.email?.split('@')[0] ?? 'there'}.
          </h1>
          {net !== 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
              {MONTHS[month - 1]} {year}
              {' · '}
              <span style={{ color: net >= 0 ? 'var(--positive)' : 'var(--negative)', fontWeight: 600 }}>
                {net >= 0 ? '+' : ''}{formatMXN(net)} net
              </span>
            </p>
          )}
        </div>

        {/* Period nav + actions — desktop only */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
          <button onClick={prevMonth} className="s-btn s-btn-secondary" style={{ height: 32, width: 32, padding: 0, borderRadius: '50%' }}>
            <ChevronLeft size={14} />
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px',
            background: 'var(--surface)',
            border: 'var(--card-border)',
            borderRadius: 999,
            boxShadow: 'var(--shadow)',
            minWidth: 160,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isCurrentMonth ? 'var(--positive)' : 'var(--text-mute)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1 }}>
                {MONTHS[month - 1]} {year}
              </p>
              <p style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>
                {isCurrentMonth ? 'Current period' : 'Past period'}
              </p>
            </div>
          </div>

          <button onClick={nextMonth} className="s-btn s-btn-secondary" style={{ height: 32, width: 32, padding: 0, borderRadius: '50%' }}>
            <ChevronRight size={14} />
          </button>

          {!isCurrentMonth && (
            <button
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1) }}
              className="s-btn s-btn-secondary"
              style={{ fontSize: 11.5, height: 28, padding: '0 10px' }}
            >
              Today
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={generating || loadingDash}
            className="s-btn s-btn-primary"
          >
            <FileText size={13} />
            {generating ? 'Generating…' : 'PDF Report'}
          </button>
        </div>
      </div>

      {/* ── Mobile net balance bar ───────────────────────────────── */}
      <div
        className="sm:hidden"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-ink))',
          color: '#fff',
          borderRadius: 16,
          padding: '18px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10.5, opacity: 0.75, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              Net balance · {MONTHS[month - 1]} {year}
            </div>
            <div className="font-mono" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 6, lineHeight: 1 }}>
              {net >= 0 ? '+' : ''}{formatMXN(net)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
          <div>
            <div style={{ fontSize: 9.5, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Income</div>
            <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{formatMXN(dashboard?.total_income ?? 0)}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.18)' }} />
          <div>
            <div style={{ fontSize: 9.5, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Expenses</div>
            <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{formatMXN(dashboard?.total_expenses ?? 0)}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.18)' }} />
          <div>
            <div style={{ fontSize: 9.5, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Save rate</div>
            <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{Number(dashboard?.savings_rate ?? 0).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* ── Mobile quick-action cards ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 lg:hidden">
        {QUICK_ACTIONS.map(({ label, color, bg, Icon, to }) => (
          <button
            key={label}
            onClick={() => navigate(to)}
            style={{
              padding: '12px 6px',
              background: 'var(--surface)',
              border: 'var(--card-border)',
              borderRadius: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: bg, color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={15} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── KPI grid ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <KpiCard
          label="Total Income"
          value={formatMXN(dashboard?.total_income ?? 0)}
          icon={<TrendingUp size={14} style={{ color: 'var(--positive)' }} />}
          valueColor="var(--positive)"
          sub={`Savings rate: ${formatPct(dashboard?.savings_rate ?? 0)}`}
        />
        <KpiCard
          label="Total Expenses"
          value={formatMXN(dashboard?.total_expenses ?? 0)}
          icon={<TrendingDown size={14} style={{ color: 'var(--negative)' }} />}
          valueColor="var(--negative)"
          sub={dashboard?.largest_category ? `Largest: ${dashboard.largest_category}` : undefined}
        />
        <KpiCard
          label="Net Balance"
          value={formatMXN(dashboard?.net_balance ?? 0)}
          icon={<Wallet size={14} style={{ color: net >= 0 ? 'var(--info)' : 'var(--negative)' }} />}
          valueColor={net >= 0 ? 'var(--info)' : 'var(--negative)'}
        />
        <KpiCard
          label="Savings Rate"
          value={`${Number(dashboard?.savings_rate ?? 0).toFixed(1)}%`}
          icon={<Target size={14} style={{ color: 'var(--accent)' }} />}
          valueColor="var(--accent)"
          sub="% of income saved"
        />
        <KpiCard
          label="Projected"
          value={formatMXN(Number(projection?.total_projected_mxn ?? 0))}
          icon={<ClipboardList size={14} style={{ color: 'var(--warning)' }} />}
          valueColor="var(--warning)"
          sub={(() => {
            const proj   = Number(projection?.total_projected_mxn ?? 0)
            const actual = Number(dashboard?.total_expenses ?? 0)
            if (proj === 0) return 'No projections set'
            const diff = actual - proj
            return diff > 0 ? `${formatMXN(diff)} over` : `${formatMXN(Math.abs(diff))} under`
          })()}
        />
        {cfStatus && Number(cfStatus.balance) !== 0 && (
          <KpiCard
            label="Carry-forward"
            value={(Number(cfStatus.balance) >= 0 ? '+' : '') + formatMXN(Number(cfStatus.balance))}
            icon={<ArrowRight size={14} style={{ color: Number(cfStatus.balance) >= 0 ? 'var(--positive)' : 'var(--negative)' }} />}
            valueColor={Number(cfStatus.balance) >= 0 ? 'var(--positive)' : 'var(--negative)'}
            sub={`from ${cfStatus.source_period}`}
          />
        )}
      </div>

      {/* ── Charts row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-[14px]">
        <Card>
          <CardHeader
            title="Income vs Expenses"
            subtitle="Last 6 months · MXN"
          />
          <MonthlyChart
            data={(monthly?.months ?? []).map(m => ({
              ...m,
              projected_monthly: m.month === month && m.year === year
                ? Number(projection?.total_projected_mxn ?? 0)
                : Number(m.projected_monthly),
            }))}
          />
        </Card>

        <Card>
          <CardHeader
            title="Spending by category"
            subtitle={dashboard?.period_label}
          />
          <CategoryChart data={categories?.categories ?? []} />
        </Card>
      </div>

      {/* ── Mobile: Budget snapshot ──────────────────────────────── */}
      {(budgetProg?.budgets ?? []).length > 0 && (() => {
        const buds        = budgetProg!.budgets
        const totalSpent  = buds.reduce((s, b) => s + Number(b.spent_amount), 0)
        const totalLimit  = buds.reduce((s, b) => s + Number(b.limit_amount), 0)
        const overallPct  = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
        return (
          <div className="lg:hidden">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Budget · {MONTHS[month - 1]}</span>
              <a href="/budgets" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>View all →</a>
            </div>
            <div className="s-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total spent</div>
                  <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginTop: 4, letterSpacing: '-0.01em' }}>
                    {formatMXN(totalSpent)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                    {buds.length} {buds.length === 1 ? 'category' : 'categories'}
                  </div>
                </div>
                <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: overallPct > 100 ? 'var(--negative)' : overallPct > 80 ? 'var(--warning)' : 'var(--text)' }}>
                  {overallPct}%
                </span>
              </div>
              <div style={{ display: 'flex', height: 6, background: 'var(--bg)', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
                {buds.map(b => (
                  <div key={b.budget_id} style={{ width: totalSpent > 0 ? `${(Number(b.spent_amount) / totalSpent * 100).toFixed(1)}%` : '0%', background: b.color, height: '100%' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {buds.slice(0, 4).map(b => (
                  <span key={b.budget_id} style={{ fontSize: 10.5, padding: '3px 8px', background: 'var(--bg)', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: b.color }} />
                    {b.category_name}
                  </span>
                ))}
                {buds.length > 4 && <span style={{ fontSize: 10.5, padding: '3px 8px', color: 'var(--text-dim)' }}>+{buds.length - 4} more</span>}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Mobile: Goals horizontal scroll ──────────────────────── */}
      {goals.filter(g => g.type !== 'monthly_rate').length > 0 && (
        <div className="lg:hidden">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Goals</span>
            <a href="/goals" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>See all →</a>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 0 4px' }}>
            {goals.filter(g => g.type !== 'monthly_rate').map((goal, idx) => {
              const pct        = Number(goal.pct_complete ?? 0)
              const color      = getGoalColor(goal.id, goals)
              const isFeatured = featuredGoalId ? goal.id === featuredGoalId : idx === 0
              return (
                <div key={goal.id} style={{
                  minWidth: 152, padding: 14,
                  background: 'var(--surface)', border: 'var(--card-border)',
                  borderRadius: 12, flexShrink: 0,
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    {isFeatured ? <Star size={13} style={{ fill: color }} /> : <Trophy size={13} />}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{goal.name}</div>
                  <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, color, marginTop: 4 }}>
                    {formatMXN(Number(goal.current_savings ?? 0))}
                  </div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>
                    of {formatMXN(Number(goal.target_amount ?? 0))}
                  </div>
                  <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Weekly | Budget | Goals — 3-col desktop, stacked mobile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-[14px]">
        {/* Weekly chart — visible on all sizes */}
        <Card>
          <CardHeader
            title="Weekly breakdown"
            subtitle={`${MONTHS[month - 1]} ${year} — income vs expenses vs projected`}
          />
          <DashboardWeeklyChart data={weeklyData?.weeks ?? []} />
        </Card>

        {/* Budget progress — desktop only (mobile shows snapshot above) */}
        <div className="hidden lg:block">
          <Card style={{ height: '100%' }}>
            <CardHeader
              title="Budget progress"
              subtitle="Current period"
              action={
                <a href="/budgets" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  View all <ArrowRight size={10} />
                </a>
              }
            />
            {(budgetProg?.budgets ?? []).length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--text-dim)', textAlign: 'center', padding: '24px 0' }}>
                No active budgets.
              </p>
            ) : (
              (budgetProg?.budgets ?? []).map(b => (
                <BudgetRow
                  key={b.budget_id}
                  name={b.category_name}
                  pct={b.pct_spent}
                  spent={b.spent_amount}
                  limit={b.limit_amount}
                  color={b.color}
                />
              ))
            )}
          </Card>
        </div>

        {/* Goals — desktop only (mobile shows scroll above) */}
        <div className="hidden lg:block">
          <Card style={{ height: '100%' }}>
            <CardHeader
              title="Goals"
              subtitle="Track your financial goals"
              action={
                <a href="/goals" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  View all <ArrowRight size={10} />
                </a>
              }
            />
            {goals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>No goals yet</p>
                <a href="/goals" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                  Create your first goal →
                </a>
              </div>
            ) : (
              goals.map(goal =>
                goal.type === 'monthly_rate' ? (
                  <GoalRow
                    key={goal.id}
                    name={goal.name}
                    isRate
                    currentRate={Number(goal.current_rate_pct ?? 0)}
                    targetRate={Number(goal.target_rate_pct   ?? 0)}
                    onTrack={goal.on_track ?? false}
                  />
                ) : (
                  <GoalRow
                    key={goal.id}
                    name={goal.name}
                    pct={Number(goal.pct_complete ?? 0)}
                    current={Number(goal.current_savings ?? 0)}
                    target={Number(goal.target_amount   ?? 0)}
                    color={getGoalColor(goal.id, goals)}
                  />
                )
              )
            )}
          </Card>
        </div>
      </div>

    </div>

    <Modal open={showExpense} onClose={() => setShowExpense(false)} title="Add expense">
      <ExpenseForm onClose={() => setShowExpense(false)} />
    </Modal>
    <Modal open={showIncome} onClose={() => setShowIncome(false)} title="Add income">
      <EarningForm onClose={() => setShowIncome(false)} />
    </Modal>
    <Modal open={showGoal} onClose={() => setShowGoal(false)} title="New goal" size="lg">
      <GoalForm onClose={() => setShowGoal(false)} />
    </Modal>
    <Modal open={showBudget} onClose={() => setShowBudget(false)} title="New budget">
      <BudgetForm onClose={() => setShowBudget(false)} />
    </Modal>
    </>
  )
}