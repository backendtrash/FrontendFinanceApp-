import { useState, useEffect } from 'react'
import Card, { CardHeader }  from '../../components/ui/Card'
import LoadingSpinner         from '../../components/ui/LoadingSpinner'
import MonthlyChart           from '../../components/charts/MonthlyChart'
import WeeklyChart            from '../../components/charts/WeeklyChart'
import CategoryChart          from '../../components/charts/CategoryChart'
import ProjectedChart         from '../../components/charts/ProjectedChart'
import BudgetActualChart      from '../../components/charts/BudgetActualChart'
import NetWorthChart          from '../../components/charts/NetWorthChart'
import {
  useMonthlyAnalytics,
  useWeeklyAnalytics,
  useCategoryAnalytics,
  useProjectedAnalytics,
  useBudgetProgress,
  useNetWorthHistory,
  useYearOverYear,
  useSpendingTrends,
} from '../../hooks/useQueries'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatMXN, formatPct } from '../../utils/formatters'
import { exportPdf }            from '../../utils/exportPdf'
import { useAddSheetStore }      from '../../store/addSheetStore'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

// ── Tiny period pill tabs ─────────────────────────────────────────────────
function PillTabs({ options, value, onChange }: { options: { label: string; val: number }[]; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, padding: 2, background: 'var(--surface-alt)', borderRadius: 6 }}>
      {options.map(o => (
        <button key={o.val} onClick={() => onChange(o.val)} style={{
          padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer',
          fontSize: 11, fontWeight: 600,
          background: value === o.val ? 'var(--surface)' : 'transparent',
          color: value === o.val ? 'var(--text)' : 'var(--text-mute)',
          boxShadow: value === o.val ? 'var(--shadow)' : 'none',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'analytics:export-pdf') {
      const cats = categories?.categories ?? []
      const rows = cats.map((c: any) => [
        c.category_name,
        Number(c.total_amount).toFixed(2),
        `${Number(c.pct_of_total).toFixed(1)}%`,
      ])
      exportPdf('Analytics — Spending by Category', ['Category','Amount MXN','% of Total'], rows, 'analytics')
      clearPendingAction()
    }
  }, [pendingAction])

  const [monthsBack, setMonthsBack] = useState(6)
  const [weeksBack,  setWeeksBack]  = useState(12)
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const { data: monthly,    isLoading: loadMonthly   } = useMonthlyAnalytics(monthsBack)
  const { data: weekly,     isLoading: loadWeekly    } = useWeeklyAnalytics(weeksBack)
  const { data: categories, isLoading: loadCats      } = useCategoryAnalytics()
  const { data: projected,  isLoading: loadProjected } = useProjectedAnalytics(3, 3)
  const { data: budgetProg }                            = useBudgetProgress()
  const { data: netWorth }                              = useNetWorthHistory(12)
  const { data: yoy }                                   = useYearOverYear(year, month)
  const { data: trends }                                = useSpendingTrends(6)

  // Mobile KPI derived
  const totalIncome   = Number(monthly?.total_income   ?? 0)
  const totalExpenses = Number(monthly?.total_expenses ?? 0)
  const netBalance    = Number(monthly?.net_balance    ?? 0)
  const saveRate      = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0

  // Mobile category donut data
  const catDonutData = (categories?.categories ?? []).slice(0, 6).map((c: any) => ({
    name: c.category_name, value: Number(c.total_amount), color: c.color, pct: Number(c.pct_of_total),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Desktop header ──────────────────────────────────────────── */}
      <div className="hidden sm:block">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Analytics</h1>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>Trends, comparisons, and projections</p>
      </div>

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <h1 className="sm:hidden" style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Analytics</h1>

      {/* ══ MOBILE LAYOUT ═══════════════════════════════════════════ */}
      <div className="flex sm:hidden flex-col gap-4">

        {/* KPI strip 2x2 */}
        {monthly && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { k: 'Income',    v: totalIncome,   c: 'var(--positive)', d: null },
              { k: 'Expenses',  v: totalExpenses, c: 'var(--negative)', d: null },
              { k: 'Net',       v: netBalance,    c: 'var(--info)',      d: null },
              { k: 'Save rate', v: null,           c: 'var(--accent)',   d: `${saveRate.toFixed(1)}%` },
            ].map((s, i) => (
              <div key={i} style={{ padding: 12, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.k}</div>
                <div className="font-mono" style={{ fontSize: 17, fontWeight: 600, color: s.c, marginTop: 4 }}>
                  {s.d ?? (s.v! >= 1000 ? `$${(s.v! / 1000).toFixed(1)}k` : formatMXN(s.v!))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Income vs Expenses trend */}
        <div style={{ padding: 14, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Income vs expenses</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>Last {monthsBack} months</div>
            </div>
            <PillTabs options={[{label:'3m',val:3},{label:'6m',val:6},{label:'1y',val:12}]} value={monthsBack} onChange={setMonthsBack} />
          </div>
          {loadMonthly ? <LoadingSpinner size="sm" /> : <MonthlyChart data={monthly?.months ?? []} />}
        </div>

        {/* Category breakdown */}
        <div style={{ padding: 14, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Spending by category</div>
          {loadCats ? <LoadingSpinner size="sm" /> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 110, height: 110, flexShrink: 0, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catDonutData} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={2} strokeWidth={0}>
                      {catDonutData.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [formatMXN(Number(v)), '']} contentStyle={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 8, fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 8, color: 'var(--text-mute)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                  <div className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                    {totalExpenses >= 1000 ? `$${(totalExpenses/1000).toFixed(1)}k` : `$${Math.round(totalExpenses)}`}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {catDonutData.slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                    <span className="font-mono" style={{ color: 'var(--text-dim)' }}>{c.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Year-over-Year */}
        {yoy && (
          <div style={{ padding: 14, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Year-over-year · {MONTHS[month-1].slice(0,3)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => { if (month===1){setMonth(12);setYear(y=>y-1)}else setMonth(m=>m-1) }}
                  style={{ width: 26, height: 26, borderRadius: '50%', border: 'var(--card-border)', background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={12} /></button>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{MONTHS[month-1].slice(0,3)} {year}</span>
                <button onClick={() => { if (month===12){setMonth(1);setYear(y=>y+1)}else setMonth(m=>m+1) }}
                  style={{ width: 26, height: 26, borderRadius: '50%', border: 'var(--card-border)', background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={12} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { l: 'Income',   current: Number(yoy.current.income),   prev: Number(yoy.previous.income),   pct: Number(yoy.changes.income),   color: 'var(--positive)', inverse: false },
                { l: 'Expenses', current: Number(yoy.current.expenses),  prev: Number(yoy.previous.expenses), pct: Number(yoy.changes.expenses),  color: 'var(--negative)', inverse: true  },
                { l: 'Balance',  current: Number(yoy.current.balance),   prev: Number(yoy.previous.balance),  pct: Number(yoy.changes.balance),   color: Number(yoy.current.balance)>=0?'var(--info)':'var(--negative)', inverse: false },
              ].map(s => (
                <div key={s.l} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{s.l}</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>vs {formatMXN(s.prev)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{formatMXN(s.current)}</div>
                    <span style={{
                      display: 'inline-block', marginTop: 3,
                      fontSize: 9.5, fontWeight: 600, padding: '1px 6px', borderRadius: 999,
                      background: s.pct > 0 ? (s.inverse ? 'var(--negative-soft)' : 'var(--positive-soft)') : s.pct < 0 ? (s.inverse ? 'var(--positive-soft)' : 'var(--negative-soft)') : 'var(--surface-alt)',
                      color: s.pct > 0 ? (s.inverse ? 'var(--negative)' : 'var(--positive)') : s.pct < 0 ? (s.inverse ? 'var(--positive)' : 'var(--negative)') : 'var(--text-mute)',
                    }}>{s.pct > 0 ? '+' : ''}{s.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ DESKTOP LAYOUT ══════════════════════════════════════════ */}
      <div className="hidden sm:contents">

        {/* Monthly Income vs Expenses */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Monthly Income vs Expenses</h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
                {monthly ? `${formatMXN(Number(monthly.total_income))} earned · ${formatMXN(Number(monthly.total_expenses))} spent` : 'Loading...'}
              </p>
            </div>
            <PillTabs options={[{label:'3m',val:3},{label:'6m',val:6},{label:'12m',val:12}]} value={monthsBack} onChange={setMonthsBack} />
          </div>
          {loadMonthly ? <LoadingSpinner size="sm" /> : <MonthlyChart data={monthly?.months ?? []} />}
          {monthly && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16, paddingTop: 16, borderTop: 'var(--card-border)' }}>
              {[
                { k: 'Total Income',   v: formatMXN(Number(monthly.total_income)),   c: 'var(--positive)' },
                { k: 'Total Expenses', v: formatMXN(Number(monthly.total_expenses)), c: 'var(--negative)' },
                { k: 'Net Balance',    v: formatMXN(Number(monthly.net_balance)),     c: Number(monthly.net_balance)>=0?'var(--info)':'var(--negative)' },
              ].map(s => (
                <div key={s.k} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.k}</p>
                  <p className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: s.c, marginTop: 4 }}>{s.v}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Weekly + Category 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <CardHeader title="Weekly Cash Flow" subtitle="Income vs expenses by week" />
              <PillTabs options={[{label:'4w',val:4},{label:'8w',val:8},{label:'12w',val:12},{label:'24w',val:24}]} value={weeksBack} onChange={setWeeksBack} />
            </div>
            {loadWeekly ? <LoadingSpinner size="sm" /> : <WeeklyChart data={weekly?.weeks ?? []} />}
          </Card>

          <Card>
            <CardHeader title="Spending by Category" subtitle="Current month breakdown" />
            {loadCats ? <LoadingSpinner size="sm" /> : (
              <>
                <CategoryChart data={categories?.categories ?? []} />
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 200, overflowY: 'auto' }}>
                  {categories?.categories.slice(0, 8).map((cat: any) => (
                    <div key={cat.category_id ?? 'uncat'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                        <span style={{ color: 'var(--text)' }}>{cat.category_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: 'var(--text-mute)' }}>{formatPct(Number(cat.pct_of_total))}</span>
                        <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text)' }}>{formatMXN(Number(cat.total_amount))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Projected vs Real */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Projected vs Real Spending</h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>Dashed = projection from recurring rules · Solid = actual</p>
            </div>
            {projected && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Monthly projection</div>
                <div className="font-mono" style={{ fontSize: 17, fontWeight: 600, color: 'var(--info)', marginTop: 2 }}>{formatMXN(Number(projected.avg_monthly_projected))}</div>
              </div>
            )}
          </div>
          {loadProjected ? <LoadingSpinner size="sm" /> : (
            <>
              <ProjectedChart data={projected?.months ?? []} />
              {projected && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16, paddingTop: 16, borderTop: 'var(--card-border)' }}>
                  {[
                    { k: 'Avg monthly projected', v: formatMXN(Number(projected.avg_monthly_projected)),  c: 'var(--info)'     },
                    { k: 'Total real (past)',      v: formatMXN(Number(projected.total_real)),            c: 'var(--negative)' },
                    { k: 'Variance',               v: formatMXN(Number(projected.total_variance)),        c: Number(projected.total_variance)<=0?'var(--positive)':'var(--negative)' },
                  ].map(s => (
                    <div key={s.k} style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.k}</p>
                      <p className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: s.c, marginTop: 4 }}>{s.v}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        {/* Budget vs Actual */}
        {budgetProg?.budgets && budgetProg.budgets.length > 0 && (
          <Card>
            <CardHeader title="Budget vs Actual Spending" subtitle="Gray = budget limit · Colored = actual spent · Red = over budget" />
            <BudgetActualChart
              data={budgetProg.budgets.map(b => ({
                category_name: b.category_name,
                limit_amount:  Number(b.limit_amount),
                spent_amount:  Number(b.spent_amount),
                color:         b.color,
              }))}
            />
          </Card>
        )}

        {/* Net Worth Over Time */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Net Worth Over Time</h3>
              <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>Cumulative earnings minus expenses · wealth trajectory</p>
            </div>
            {netWorth && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Current</div>
                <div className="font-mono" style={{ fontSize: 17, fontWeight: 600, color: 'var(--accent)', marginTop: 2 }}>{formatMXN(Number(netWorth.current_worth))}</div>
              </div>
            )}
          </div>
          <NetWorthChart data={netWorth?.months ?? []} />
        </Card>

        {/* YoY + Trends 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>

          {/* Year-over-Year */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>Year-over-Year</h3>
                <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{MONTHS[month-1]} {year} vs {MONTHS[month-1]} {year-1}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => { if (month===1){setMonth(12);setYear(y=>y-1)}else setMonth(m=>m-1) }}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'var(--card-border)', background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={13} /></button>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', minWidth: 72, textAlign: 'center' }}>{MONTHS[month-1].slice(0,3)} {year}</span>
                <button onClick={() => { if (month===12){setMonth(1);setYear(y=>y+1)}else setMonth(m=>m+1) }}
                  style={{ width: 28, height: 28, borderRadius: '50%', border: 'var(--card-border)', background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={13} /></button>
              </div>
            </div>
            {yoy && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Income',   current: Number(yoy.current.income),   prev: Number(yoy.previous.income),   pct: Number(yoy.changes.income),   color: 'var(--positive)', inverse: false },
                  { label: 'Expenses', current: Number(yoy.current.expenses),  prev: Number(yoy.previous.expenses), pct: Number(yoy.changes.expenses),  color: 'var(--negative)', inverse: true  },
                  { label: 'Balance',  current: Number(yoy.current.balance),   prev: Number(yoy.previous.balance),  pct: Number(yoy.changes.balance),   color: Number(yoy.current.balance)>=0?'var(--info)':'var(--negative)', inverse: false },
                ].map(item => (
                  <div key={item.label} style={{ padding: 14, background: 'var(--bg)', borderRadius: 10, textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>{item.label}</div>
                    <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: item.color, marginTop: 6 }}>{formatMXN(item.current)}</div>
                    <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>vs {formatMXN(item.prev)}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 8, padding: '3px 7px', borderRadius: 999,
                      fontSize: 10.5, fontWeight: 600,
                      background: item.pct > 0 ? (item.inverse ? 'var(--negative-soft)' : 'var(--positive-soft)') : item.pct < 0 ? (item.inverse ? 'var(--positive-soft)' : 'var(--negative-soft)') : 'var(--surface-alt)',
                      color: item.pct > 0 ? (item.inverse ? 'var(--negative)' : 'var(--positive)') : item.pct < 0 ? (item.inverse ? 'var(--positive)' : 'var(--negative)') : 'var(--text-mute)',
                    }}>
                      {item.pct > 0 ? <TrendingUp size={9} /> : item.pct < 0 ? <TrendingDown size={9} /> : <Minus size={9} />}
                      {item.pct > 0 ? '+' : ''}{item.pct}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Spending Trends */}
          {trends?.trends && trends.trends.length > 0 && (
            <Card>
              <CardHeader title="Spending Trends" subtitle={`Current month vs ${trends.period_months}-month average`} />
              {(() => {
                const top8       = trends.trends.slice(0, 8)
                const hasHistory = top8.some((t: any) => Number(t.avg_monthly) > 0)
                const maxVal     = hasHistory
                  ? Math.max(...top8.map((t: any) => Math.abs(Number(t.pct_vs_avg))), 1)
                  : Math.max(...top8.map((t: any) => Number(t.current_month)), 1)

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {top8.map((trend: any) => {
                      const isUp    = trend.direction === 'up'
                      const isDown  = trend.direction === 'down'
                      const pct     = Number(trend.pct_vs_avg)
                      const cappedW = hasHistory
                        ? Math.min((Math.abs(pct) / maxVal) * 100, 100)
                        : Math.min((Number(trend.current_month) / maxVal) * 100, 100)

                      return (
                        <div key={trend.category_id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 110px', gap: 12, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            <span style={{ width: 7, height: 7, borderRadius: 4, background: trend.color, flexShrink: 0 }} />
                            <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trend.category_name}</span>
                          </div>
                          <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                            {hasHistory && (
                              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'var(--border)' }} />
                            )}
                            <div style={{
                              position: 'absolute', top: 0, bottom: 0,
                              left: hasHistory ? (isUp ? '50%' : `${50 - cappedW / 2}%`) : 0,
                              width: `${cappedW}%`,
                              background: !hasHistory ? trend.color : isUp ? 'var(--negative)' : isDown ? 'var(--positive)' : 'var(--text-mute)',
                              borderRadius: 4,
                            }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{formatMXN(Number(trend.current_month))}</span>
                            {hasHistory ? (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                                background: isUp ? 'var(--negative-soft)' : isDown ? 'var(--positive-soft)' : 'var(--surface-alt)',
                                color: isUp ? 'var(--negative)' : isDown ? 'var(--positive)' : 'var(--text-mute)',
                              }}>{pct > 0 ? '+' : ''}{pct}%</span>
                            ) : <span style={{ color: 'var(--text-mute)', fontSize: 11 }}>—</span>}
                          </div>
                        </div>
                      )
                    })}
                    <p style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4, textAlign: 'center' }}>
                      {hasHistory ? `vs ${trends.period_months}-month avg · Red = up · Green = down` : 'Trends appear once you have 2+ months of data'}
                    </p>
                  </div>
                )
              })()}
            </Card>
          )}
        </div>

      </div>{/* end desktop */}
    </div>
  )
}