import { useState, useEffect } from 'react'
import { Target, Bell, Plus, AlertTriangle, Pencil } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget,
  useCategories, useCurrencies, useBudgetAlerts, useClearBudgetAlerts,
} from '../../hooks/useQueries'
import Card               from '../../components/ui/Card'
import { useAddSheetStore } from '../../store/addSheetStore'
import Button             from '../../components/ui/Button'
import Input              from '../../components/ui/Input'
import Modal              from '../../components/ui/Modal'
import LoadingSpinner     from '../../components/ui/LoadingSpinner'
import { formatMXN, formatPct } from '../../utils/formatters'
import type { BudgetCreate, BudgetPeriod } from '../../types/index'

// ── Budget Edit Form ──────────────────────────────────────────────────────
function BudgetEditForm({ budget, onClose }: { budget: any; onClose: () => void }) {
  const updateBudget = useUpdateBudget()
  const [limitAmount, setLimitAmount] = useState(String(budget.limit_amount ?? ''))
  const [period, setPeriod] = useState<BudgetPeriod>(budget.period ?? 'monthly')
  const [alertThreshold, setAlertThreshold] = useState(Number(budget.alert_threshold ?? 80))
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const val = parseFloat(limitAmount)
    if (!val || val <= 0) { setError('Limit amount must be greater than zero'); return }
    try {
      await updateBudget.mutateAsync({ id: budget.id, data: { limit_amount: val, alert_threshold: alertThreshold, period } })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update budget')
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Limit Amount" type="number" step="0.01" min="0" placeholder="0.00"
        value={limitAmount} onChange={e => setLimitAmount(e.target.value)} />
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Reset Period</label>
        <div className="flex gap-2">
          {(['weekly', 'monthly'] as BudgetPeriod[]).map(p => (
            <button key={p} type="button" onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${period === p ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Alert at {alertThreshold}% spent</label>
        <input type="range" min="10" max="100" step="5" value={alertThreshold}
          onChange={e => setAlertThreshold(parseInt(e.target.value))} className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>10%</span><span>50%</span><span>100%</span></div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={updateBudget.isPending} onClick={handleSubmit}>Save Changes</Button>
      </div>
    </div>
  )
}

// ── Budget Form ───────────────────────────────────────────────────────────
export function BudgetForm({ onClose }: { onClose: () => void }) {
  const { data: categories = [] } = useCategories('expense')
  const { data: currencies  = [] } = useCurrencies()
  const createBudget               = useCreateBudget()
  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''

  const [form, setForm] = useState<BudgetCreate>({
    category_id: undefined, limit_amount: 0,
    currency_id: mxnId, period: 'monthly', alert_threshold: 80,
  })
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.limit_amount || form.limit_amount <= 0) { setError('Limit amount must be greater than zero'); return }
    try {
      await createBudget.mutateAsync({ ...form, currency_id: form.currency_id || mxnId, category_id: form.category_id || undefined })
      onClose()
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      setError(typeof detail === 'string' && detail.includes('already exists') ? 'A budget for this category already exists' : detail || 'Failed to create budget')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
        <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          value={form.category_id ?? ''} onChange={e => setForm(p => ({ ...p, category_id: e.target.value || undefined }))}>
          <option value="">All Categories (Global Budget)</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">Leave empty to set a total spending limit</p>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Input label="Limit Amount" type="number" step="0.01" min="0" placeholder="0.00"
            value={form.limit_amount || ''} onChange={e => setForm(p => ({ ...p, limit_amount: parseFloat(e.target.value) || 0 }))} />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={form.currency_id || mxnId} onChange={e => setForm(p => ({ ...p, currency_id: e.target.value }))}>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Reset Period</label>
        <div className="flex gap-2">
          {(['weekly', 'monthly'] as BudgetPeriod[]).map(p => (
            <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, period: p }))}
              className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${form.period === p ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {p === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Alert at {form.alert_threshold}% spent</label>
        <input type="range" min="10" max="100" step="5" value={form.alert_threshold}
          onChange={e => setForm(p => ({ ...p, alert_threshold: parseInt(e.target.value) }))} className="w-full accent-blue-600" />
        <div className="flex justify-between text-xs text-gray-400 mt-1"><span>10%</span><span>50%</span><span>100%</span></div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={createBudget.isPending} onClick={handleSubmit}>Create Budget</Button>
      </div>
    </div>
  )
}

// ── Budget Card ────────────────────────────────────────────────────────────
function BudgetCard({ budget, categoryName, color, onDelete, onEdit }: { budget: any; categoryName: string; color: string; onDelete: () => void; onEdit: () => void }) {
  const pct       = Number(budget.pct_spent)
  const spent     = Number(budget.spent_amount)
  const limit     = Number(budget.limit_amount)
  const remaining = Number(budget.remaining)
  const cappedPct = Math.min(pct, 100)
  const isOver    = spent > limit
  const isWarn    = pct > 80 && !isOver
  const barColor  = isOver ? 'var(--negative)' : isWarn ? 'var(--warning)' : 'var(--positive)'

  return (
    <div style={{ padding: 16, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{categoryName}</span>
        {isOver && <span style={{ fontSize: 9, padding: '2px 5px', background: 'var(--negative-soft)', color: 'var(--negative)', borderRadius: 3, fontWeight: 700, letterSpacing: '0.04em' }}>OVER</span>}
        <button onClick={onEdit} style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')} title="Edit"><Pencil size={13} /></button>
        <button onClick={onDelete} style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
      </div>
      <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: barColor, marginBottom: 3 }}>{formatMXN(spent)}</div>
      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 10 }}>of {formatMXN(limit)} · {formatPct(pct)} used</div>
      <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${cappedPct}%`, height: '100%', background: barColor, transition: 'width .3s' }} />
        {isOver && <div style={{ position: 'absolute', top: 0, right: 0, width: 2, height: '100%', background: 'var(--negative)' }} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5 }} className="font-mono">
        <span style={{ color: isOver ? 'var(--negative)' : 'var(--positive)', fontWeight: 600 }}>
          {isOver ? `+${formatMXN(Math.abs(remaining))} over` : `${formatMXN(remaining)} left`}
        </span>
        <span style={{ color: 'var(--text-mute)' }}>alert {budget.alert_threshold}%</span>
      </div>
    </div>
  )
}

// ── Monthly Progress Donut tooltip ─────────────────────────────────────────
const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 11 }}>
      <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{d.name}</p>
      <p style={{ color: 'var(--text-dim)' }}>{formatMXN(d.value)}</p>
      <p style={{ color: 'var(--text-mute)' }}>{d.pct.toFixed(1)}%</p>
    </div>
  )
}

// ── Budgets Page ───────────────────────────────────────────────────────────
export default function BudgetsPage() {
  const [showAdd,          setShowAdd]          = useState(false)
  const [adjustPickerOpen, setAdjustPickerOpen] = useState(false)

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'budget:open-add') {
      setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'budget:open-adjust') {
      setAdjustPickerOpen(true); clearPendingAction()
    } else if (pendingAction === 'budget:clear-alerts') {
      clearAlerts.mutate()
      clearPendingAction()
    }
  }, [pendingAction])
  const [showAlerts,  setShowAlerts]  = useState(false)
  const [editBudget,  setEditBudget]  = useState<any>(null)

  const clearAlerts                          = useClearBudgetAlerts()
  const { data: budgets   = [], isLoading } = useBudgets(false)
  const { data: alerts    = [] }             = useBudgetAlerts(20)
  const { data: categories = [] }            = useCategories('expense')
  const deleteBudget                         = useDeleteBudget()

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const activeBudgets   = budgets.filter(b => b.is_active)
  const inactiveBudgets = budgets.filter(b => !b.is_active)

  // Monthly progress stats
  const totalLimit   = activeBudgets.reduce((s, b) => s + Number(b.limit_amount), 0)
  const totalSpent   = activeBudgets.reduce((s, b) => s + Number(b.spent_amount), 0)
  const totalRemain  = totalLimit - totalSpent
  const pctUsed      = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const overCount    = activeBudgets.filter(b => Number(b.pct_spent) > 100).length
  const now          = new Date()
  const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft     = daysInMonth - now.getDate()
  const dailyLeft    = daysLeft > 0 && totalRemain > 0 ? totalRemain / daysLeft : 0

  // Donut data: per-category spent
  const donutData = activeBudgets
    .filter(b => b.category_id && Number(b.spent_amount) > 0)
    .map(b => {
      const cat = catMap[b.category_id!]
      return { name: cat?.name ?? 'Unknown', value: Number(b.spent_amount), color: cat?.color ?? '#9ca3af', pct: totalSpent > 0 ? (Number(b.spent_amount) / totalSpent) * 100 : 0 }
    })
  // If no per-category data, show a single total arc
  const donutFinal = donutData.length > 0 ? donutData : totalSpent > 0 ? [{ name: 'Total', value: totalSpent, color: 'var(--accent)', pct: 100 }] : []

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header (desktop) ────────────────────────────────── */}
        <div className="hidden sm:flex sm:items-center sm:justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Budgets</h1>
            {totalLimit > 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                <span className="font-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{formatMXN(totalSpent)}</span>
                {' '}of <span className="font-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{formatMXN(totalLimit)}</span>
                {' '}spent · {formatPct(pctUsed)} used
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {alerts.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowAlerts(true)}>
                <Bell size={13} /> {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Budget</Button>
          </div>
        </div>

        {/* ── Mobile header ────────────────────────────────────────── */}
        <div className="flex sm:hidden items-center justify-between">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Budgets</h1>
          <div className="flex gap-2">
            {alerts.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowAlerts(true)}>
                <Bell size={13} /> {alerts.length}
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /></Button>
          </div>
        </div>

        {isLoading && <div className="py-16 flex justify-center"><LoadingSpinner text="Loading budgets..." /></div>}

        {!isLoading && budgets.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Target size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No budgets yet</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Set spending limits to track your goals</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>Create First Budget</Button>
          </div>
        )}

        {!isLoading && activeBudgets.length > 0 && (
          <>
            {/* ── Monthly progress card ────────────────────────────── */}
            <Card>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Monthly progress</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>All categories combined</div>
              </div>
              {/* Desktop layout */}
              <div className="hidden sm:flex sm:items-center sm:gap-6">
                {/* Donut */}
                <div style={{ width: 140, height: 140, flexShrink: 0, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutFinal} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={2} strokeWidth={0}>
                        {donutFinal.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Used</div>
                    <div className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginTop: 1 }}>{formatPct(pctUsed)}</div>
                  </div>
                </div>

                {/* Right side */}
                <div style={{ flex: 1 }}>
                  {/* Stacked bar */}
                  <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    {activeBudgets.filter(b => b.category_id && Number(b.spent_amount) > 0).map(b => {
                      const cat = catMap[b.category_id!]
                      return <div key={b.id} style={{ width: `${(Number(b.spent_amount) / totalLimit) * 100}%`, background: cat?.color ?? '#9ca3af', height: '100%' }} />
                    })}
                  </div>
                  <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11.5, color: 'var(--text-dim)' }}>
                    <span>{formatMXN(totalSpent)} spent</span>
                    <span>{formatMXN(totalRemain)} remaining</span>
                    <span>{formatMXN(totalLimit)} budgeted</span>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11.5 }}>
                    <div>
                      <div style={{ color: 'var(--text-mute)', fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Days left</div>
                      <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>{daysLeft}</div>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <div>
                      <div style={{ color: 'var(--text-mute)', fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Daily budget</div>
                      <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                        {dailyLeft > 0 ? (dailyLeft >= 1000 ? `$${(dailyLeft / 1000).toFixed(1)}k` : `$${Math.round(dailyLeft)}`) : '—'}
                      </div>
                    </div>
                    <div style={{ width: 1, background: 'var(--border)' }} />
                    <div>
                      <div style={{ color: 'var(--text-mute)', fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Over budget</div>
                      <div className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: overCount > 0 ? 'var(--negative)' : 'var(--text)', marginTop: 2 }}>
                        {overCount} {overCount === 1 ? 'category' : 'categories'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile layout — donut left + stats right */}
              <div className="flex sm:hidden items-center gap-5">
                <div style={{ width: 120, height: 120, flexShrink: 0, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutFinal} dataKey="value" cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={2} strokeWidth={0}>
                        {donutFinal.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                    <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{formatPct(pctUsed)}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-mute)', fontWeight: 600 }}>used</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Remaining</div>
                  <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--accent)', marginTop: 2 }}>{formatMXN(totalRemain)}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>of {formatMXN(totalLimit)} budgeted</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{daysLeft} days</span> left
                    {overCount > 0 && <> · <span style={{ color: 'var(--negative)', fontWeight: 600 }}>{overCount} over</span></>}
                  </div>
                </div>
              </div>
            </Card>

            {/* ── Active budgets grid (desktop) ─────────────────────── */}
            <div className="hidden sm:block">
              <h2 style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Active</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {activeBudgets.map(b => {
                  const cat = catMap[b.category_id ?? '']
                  return <BudgetCard key={b.id} budget={b} categoryName={cat?.name ?? 'All Categories'} color={cat?.color ?? '#702963'}
                    onEdit={() => setEditBudget(b)}
                  onDelete={async () => { if (!confirm('Delete this budget?')) return; await deleteBudget.mutateAsync(b.id) }} />
                })}
              </div>
            </div>

            {/* ── Mobile budget list ────────────────────────────────── */}
            <div className="flex sm:hidden flex-col gap-2">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 4px 8px' }}>By category</div>
              {activeBudgets.map(b => {
                const cat   = catMap[b.category_id ?? '']
                const pct   = Number(b.pct_spent)
                const spent = Number(b.spent_amount)
                const limit = Number(b.limit_amount)
                const over  = pct > 100
                const warn  = pct > 80 && !over
                const barColor = over ? 'var(--negative)' : warn ? 'var(--warning)' : 'var(--positive)'
                return (
                  <div key={b.id} style={{ padding: '12px 14px', background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 5, background: cat?.color ?? '#702963', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{cat?.name ?? 'All Categories'}</span>
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{formatPct(pct)}</span>
                      {over && <span style={{ fontSize: 9, padding: '1px 5px', background: 'var(--negative-soft)', color: 'var(--negative)', borderRadius: 3, fontWeight: 700, letterSpacing: '0.04em' }}>OVER</span>}
                    </div>
                    <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                      <span style={{ color: barColor, fontWeight: 600 }}>{formatMXN(spent)}</span>
                      <span>of {formatMXN(limit)}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, marginTop: 6, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor }} />
                      {over && <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: 'var(--negative)' }} />}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                      <button onClick={() => setEditBudget(b)}
                        style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={async () => { if (!confirm('Delete this budget?')) return; await deleteBudget.mutateAsync(b.id) }}
                        style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', fontSize: 14 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {!isLoading && inactiveBudgets.length > 0 && (
          <div>
            <h2 style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Inactive</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {inactiveBudgets.map(b => {
                const cat = catMap[b.category_id ?? '']
                return <BudgetCard key={b.id} budget={b} categoryName={cat?.name ?? 'All Categories'} color={cat?.color ?? '#6B7280'}
                  onEdit={() => setEditBudget(b)}
                  onDelete={async () => { if (!confirm('Delete this budget?')) return; await deleteBudget.mutateAsync(b.id) }} />
              })}
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Budget">
        <BudgetForm onClose={() => setShowAdd(false)} />
      </Modal>

      <Modal open={adjustPickerOpen} onClose={() => setAdjustPickerOpen(false)} title="Select a budget to adjust">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeBudgets.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>No active budgets</p>
          )}
          {activeBudgets.map(b => {
            const cat = catMap[b.category_id ?? '']
            const pct = Number(b.pct_spent)
            const isOver = pct > 100
            const barColor = isOver ? 'var(--negative)' : pct > 80 ? 'var(--warning)' : 'var(--positive)'
            return (
              <button
                key={b.id}
                onClick={() => { setEditBudget(b); setAdjustPickerOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '12px 14px', background: 'var(--surface)', border: 'var(--card-border)',
                  borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
              >
                <span style={{ width: 10, height: 10, borderRadius: 5, background: cat?.color ?? '#702963', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {cat?.name ?? 'All Categories'}
                </span>
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {formatMXN(Number(b.limit_amount))}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: barColor, minWidth: 36, textAlign: 'right' }}>
                  {pct.toFixed(0)}%
                </span>
              </button>
            )
          })}
        </div>
      </Modal>

      {editBudget && (
        <Modal open={editBudget !== null} onClose={() => setEditBudget(null)} title="Edit Budget">
          <BudgetEditForm budget={editBudget} onClose={() => setEditBudget(null)} />
        </Modal>
      )}

      <Modal open={showAlerts} onClose={() => setShowAlerts(false)} title="Budget Alerts" size="lg">
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No alerts yet</p>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">{formatPct(Number(alert.pct_spent))} of budget used</p>
                  </div>
                  <p className="text-xs text-amber-600 mt-0.5">{formatMXN(Number(alert.amount_spent))} spent of {formatMXN(Number(alert.limit_amount))} limit</p>
                </div>
                <p className="text-xs text-amber-500">{alert.triggered_date}</p>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}