import { useState, useRef, useEffect } from 'react'
import { useVirtualizer }        from '@tanstack/react-virtual'
import { Inbox, Trash2, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Check } from 'lucide-react'
import {
  useExpenses, useEarnings, useBudgets,
  useCategories, useCurrencies,
  useDeleteExpense, useProjectedCosts, useCreateExpense, QUERY_KEYS,
  useSinkingFunds, useContributeToFund,
} from '../../hooks/useQueries'
import { usePreferencesStore }   from '../../store/preferencesStore'
import { getApiErrorMessage }    from '../../utils/apiError'
import Card                      from '../../components/ui/Card'
import Button                    from '../../components/ui/Button'
import Modal                     from '../../components/ui/Modal'
import Input                     from '../../components/ui/Input'
import LoadingSpinner             from '../../components/ui/LoadingSpinner'
import { formatMXN, formatDate } from '../../utils/formatters'
import { splitExpense }          from '../../api/goals'
import { updateExpense }         from '../../api/expenses'
import { updateEarning }         from '../../api/earnings'
import { useAddSheetStore }       from '../../store/addSheetStore'
import { useQueryClient }        from '@tanstack/react-query'
import type { Expense, ProjectedCost, SinkingFund } from '../../types/index'

// ── Week helpers ───────────────────────────────────────────────────────────
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return {
    week: 1 + Math.round(
      ((d.getTime() - week1.getTime()) / 86400000
        - 3 + ((week1.getDay() + 6) % 7)) / 7
    ),
    year: d.getFullYear(),
  }
}

function startOfWeek(date: Date, weekStartDay: number): Date {
  const d = new Date(date); d.setHours(0, 0, 0, 0)
  const diff = (d.getDay() - weekStartDay + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

function getCostsForDay(costs: ProjectedCost[], dateStr: string): ProjectedCost[] {
  const d   = new Date(dateStr + 'T00:00:00')
  const dow = (d.getDay() + 6) % 7  // convert JS 0=Sun..6=Sat -> app 0=Mon..6=Sun (matches day_of_week)
  const dom = d.getDate()
  const mon = d.getMonth() + 1
  const yr  = d.getFullYear()
  return costs.filter(pc => {
    if (!pc.is_active) return false
    if (pc.frequency === 'one_time') {
      if (!pc.month || !pc.year) return false
      return pc.year === yr && pc.month === mon && (pc.day_of_month ?? 1) === dom
    }
    if (pc.frequency === 'monthly') return (pc.day_of_month ?? 1) === dom
    return (pc.day_of_week ?? 1) === dow
  })
}

// -- Move to a Day Modal ---------------------------------------------------
function MoveToDayModal({ open, onClose, expenses, earnings, weekStart, catMap }: {
  open: boolean
  onClose: () => void
  expenses: any[]
  earnings: any[]
  weekStart: string
  catMap: Record<string, any>
}) {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<{ id: string; type: 'expense' | 'income'; label: string; date: string; amount: string; color: string } | null>(null)
  const [targetDay, setTargetDay] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const allTx = [
    ...expenses.map(e => ({
      id: e.id, type: 'expense' as const,
      label: e.notes ?? 'Expense',
      date: e.date,
      amount: formatMXN(Number(e.amount_mxn ?? e.amount)),
      color: catMap[e.category_id ?? '']?.color ?? 'var(--negative)',
    })),
    ...earnings.map(e => ({
      id: e.id, type: 'income' as const,
      label: e.notes ?? 'Earning',
      date: e.date,
      amount: '+' + formatMXN(Number(e.amount_mxn ?? e.amount)),
      color: 'var(--positive)',
    })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().slice(0, 10)
  })

  const handleMove = async () => {
    if (!selected || !targetDay) return
    setLoading(true)
    try {
      if (selected.type === 'expense') {
        await updateExpense(selected.id, { date: targetDay })
        qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      } else {
        await updateEarning(selected.id, { date: targetDay })
        qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
      }
      setSelected(null); setTargetDay(''); setError(''); onClose()
    } catch (e: any) {
      setError((e as any)?.response?.data?.detail || 'Failed to move entry')
    } finally { setLoading(false) }
  }

  const handleClose = () => { setSelected(null); setTargetDay(''); setError(''); onClose() }

  return (
    <Modal open={open} onClose={handleClose} title={selected ? 'Pick a day' : 'Select a transaction'}>
      {!selected ? (
        <div className="space-y-2">
          {allTx.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', textAlign: 'center', padding: '20px 0' }}>No transactions this week.</p>
          )}
          {allTx.map(tx => (
            <button
              key={tx.id}
              onClick={() => setSelected(tx)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms ease' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
            >
              <span style={{ width: 32, height: 32, borderRadius: 8, background: tx.color + '22', color: tx.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tx.type === 'expense' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{formatDate(tx.date)}</div>
              </div>
              <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: tx.color, flexShrink: 0 }}>{tx.amount}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div style={{ padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {selected.label} · {formatDate(selected.date)}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8 }}>Move to:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {weekDays.map(day => (
                <button
                  key={day}
                  onClick={() => setTargetDay(day)}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: targetDay === day ? 'var(--accent)' : 'var(--surface)',
                    color: targetDay === day ? 'var(--accent-ink)' : 'var(--text)',
                    boxShadow: targetDay === day ? 'none' : 'var(--shadow)',
                  }}
                >
                  {new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </button>
              ))}
            </div>
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--negative)' }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setSelected(null); setTargetDay('') }}>Back</Button>
            <Button className="flex-1" loading={loading} disabled={!targetDay} onClick={handleMove}>Move</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Pay Projected Cost Modal ──────────────────────────────────────────────
function PayModal({ cost, open, onClose, catMap }: {
  cost: ProjectedCost | null
  open: boolean
  onClose: () => void
  catMap: Record<string, any>
}) {
  const qc                      = useQueryClient()
  const createExpenseForPay     = useCreateExpense()
  const { data: currencies = [] } = useCurrencies()
  const mxnId = currencies.find((cu: any) => cu.code === 'MXN')?.id ?? ''
  const [date,    setDate]      = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading]   = useState(false)
  const [error,   setError]     = useState('')

  if (!cost) return null
  const amount = Number(cost.amount_mxn)
  const cat    = catMap[cost.category_id ?? '']

  const handlePay = async () => {
    if (!mxnId) return
    setLoading(true)
    try {
      await createExpenseForPay.mutateAsync({
        amount,
        currency_id: mxnId,
        category_id: cost.category_id ?? undefined,
        date,
        notes: cost.name,
        is_recurring: false,
        projected_cost_id: cost.id,
      })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      onClose()
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Failed to create expense'))
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Mark as paid">
      <div className="space-y-4">
        <div style={{ padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cost.name}</div>
          {cat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 11.5, color: 'var(--text-dim)' }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: cat.color }} />
              {cat.name}
            </div>
          )}
          <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--negative)', marginTop: 8 }}>{formatMXN(amount)}</div>
        </div>
        <Input label="Date paid" type="date" value={date} onChange={e => setDate(e.target.value)} />
        {error && <p style={{ fontSize: 12, color: 'var(--negative)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} onClick={handlePay}>Create expense</Button>
        </div>
      </div>
    </Modal>
  )
}
// ── Move Modal ─────────────────────────────────────────────────────────────
function MoveModal({ expense, open, onClose }: { expense: Expense | null; open: boolean; onClose: () => void }) {
  const qc              = useQueryClient()
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleMove = async () => {
    if (!expense || !date) return
    setLoading(true)
    try {
      await updateExpense(expense.id, { date })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      onClose(); setDate(''); setError('')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to move expense')
    } finally { setLoading(false) }
  }

  if (!expense) return null
  return (
    <Modal open={open} onClose={onClose} title="Move to Different Week">
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{expense.notes ?? 'Expense'}</p>
          <p className="text-xs text-gray-500 mt-1">Currently: {formatDate(expense.date)} · {formatMXN(expense.amount_mxn)}</p>
        </div>
        <Input label="New Date" type="date" value={date} onChange={e => setDate(e.target.value)} hint="Expense will move to the week containing this date" />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} disabled={!date} onClick={handleMove}>Move Expense</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Split Modal ────────────────────────────────────────────────────────────
function SplitModal({ expense, open, onClose }: { expense: Expense | null; open: boolean; onClose: () => void }) {
  const qc                      = useQueryClient()
  const [splitAmt,  setSplitAmt]  = useState('')
  const [splitDate, setSplitDate] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  if (!expense) return null
  const total       = Number(expense.amount)
  const splitAmount = parseFloat(splitAmt) || 0
  const keepAmount  = Math.max(0, total - splitAmount)

  const handleSplit = async () => {
    if (splitAmount <= 0 || splitAmount >= total) { setError(`Amount must be between 0.01 and ${(total - 0.01).toFixed(2)}`); return }
    if (!splitDate) { setError('Please select a date for the split amount'); return }
    setLoading(true)
    try {
      await splitExpense(expense.id, { original_amount: keepAmount, original_date: expense.date, split_amount: splitAmount, split_date: splitDate })
      qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      onClose(); setSplitAmt(''); setSplitDate(''); setError('')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to split expense')
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="Split Across Weeks">
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{expense.notes ?? 'Expense'}</p>
          <p className="text-xs text-gray-500 mt-1">Total: {total.toFixed(2)} · {formatDate(expense.date)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Stays on</p>
            <p className="text-lg font-bold text-green-700">{keepAmount.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(expense.date)}</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Moves to</p>
            <p className="text-lg font-bold text-blue-700">{splitAmount > 0 ? splitAmount.toFixed(2) : '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{splitDate ? formatDate(splitDate) : 'New date'}</p>
          </div>
        </div>
        <Input label="Amount to Move" type="number" step="0.01" min="0.01" max={String(total - 0.01)} placeholder={`Between 0.01 and ${(total - 0.01).toFixed(2)}`} value={splitAmt} onChange={e => setSplitAmt(e.target.value)} />
        <Input label="New Date for Moved Amount" type="date" value={splitDate} onChange={e => setSplitDate(e.target.value)} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={loading} disabled={!splitAmt || !splitDate} onClick={handleSplit}>Split Expense</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Set Aside Modal (sinking funds) ─────────────────────────────────────────
// Near-copy of PayModal above, but posts a fund contribution instead of a
// bare expense — same real-expense-under-the-hood mechanics, just routed
// through the fund so the ledger stays linked.
function SetAsideModal({ fund, amount, open, onClose }: {
  fund:   SinkingFund | null
  amount: number
  open:   boolean
  onClose: () => void
}) {
  const contribute          = useContributeToFund()
  const [date,    setDate]  = useState(new Date().toISOString().slice(0, 10))
  const [error,   setError] = useState('')

  if (!fund) return null

  const handleSetAside = async () => {
    setError('')
    try {
      await contribute.mutateAsync({
        id: fund.id,
        data: { amount, date, notes: `Set aside · ${fund.name}` },
      })
      onClose()
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Failed to set money aside'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Set aside for this fund">
      <div className="space-y-4">
        <div style={{ padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{fund.name}</div>
          <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--info)', marginTop: 8 }}>
            {formatMXN(amount)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Records a real expense — your balance drops now, not when the bill lands.
          </div>
        </div>
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        {error && <p style={{ fontSize: 12, color: 'var(--negative)' }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={contribute.isPending} onClick={handleSetAside}>
            Set aside
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Week View Page ─────────────────────────────────────────────────────────
export default function WeekViewPage() {
  const today         = new Date()
  const { weekStartDay } = usePreferencesStore()

  const [weekOffset, setWeekOffset] = useState(0)

  const displayDate = new Date(today)
  displayDate.setDate(today.getDate() + weekOffset * 7)
  const { week, year } = getISOWeek(displayDate)

  const [moveTarget,   setMoveTarget]   = useState<Expense | null>(null)
  const [moveToDayOpen, setMoveToDayOpen] = useState(false)
  const [payTarget,     setPayTarget]     = useState<ProjectedCost | null>(null)
  const [setAsideTarget, setSetAsideTarget] = useState<SinkingFund | null>(null)

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'week:open-move') {
      setMoveToDayOpen(true); clearPendingAction()
    }
  }, [pendingAction])
  const [splitTarget,  setSplitTarget]  = useState<Expense | null>(null)
  const [selectedDay,  setSelectedDay]  = useState<string | null>(null)
  const tableContainerRef              = useRef<HTMLDivElement>(null)

  const start = startOfWeek(displayDate, weekStartDay)
  const end   = new Date(start); end.setDate(start.getDate() + 6)
  const weekStartStr   = start.toISOString().slice(0, 10)
  const weekEndStr     = end.toISOString().slice(0, 10)
  const todayStr       = today.toISOString().slice(0, 10)

  // Calendar-month window spanning the week — used only for paid-detection
  const monthStart = weekStartStr.slice(0, 7) + '-01'
  const [pmEy, pmEm] = weekEndStr.split('-').map(Number)
  const monthEnd = pmEy + '-' + String(pmEm).padStart(2, '0') + '-' + String(new Date(pmEy, pmEm, 0).getDate()).padStart(2, '0')

  const { data,          isLoading } = useExpenses({ date_from: weekStartStr, date_to: weekEndStr, limit: 100 })
  const { data: monthExpData }       = useExpenses({ date_from: monthStart, date_to: monthEnd, limit: 500 })
  const { data: earningsData }       = useEarnings({ date_from: weekStartStr, date_to: weekEndStr, limit: 100 })
  const { data: budgets = [] }       = useBudgets(true)
  const { data: categories = [] }    = useCategories('expense')
  const { data: currencies  = [] }   = useCurrencies()
  const deleteExpense                = useDeleteExpense()
  const { data: projectedCosts = [] } = useProjectedCosts()
  const { data: sinkingFunds = [] }   = useSinkingFunds()

  const catMap   = Object.fromEntries(categories.map(c => [c.id, c]))
  const curMap   = Object.fromEntries(currencies.map(c => [c.id, c]))
  const expenses = (data?.data ?? []).filter(e => e.date >= weekStartStr && e.date <= weekEndStr)
  const earnings = (earningsData?.data ?? []).filter(e => e.date >= weekStartStr && e.date <= weekEndStr)

  // A planned cost counts as paid when a linked expense exists in its period:
  // weekly -> this week; monthly/one_time -> anywhere in the calendar month
  const weekPaidIds  = new Set(expenses.map(e => e.projected_cost_id).filter(Boolean))
  const monthPaidIds = new Set((monthExpData?.data ?? []).map(e => e.projected_cost_id).filter(Boolean))
  // A planned cost paid out of a sinking fund has no expense behind it —
  // the payout is a ledger row, not a transaction — so it needs its own set.
  const fundPaidCostIds = new Set(
    sinkingFunds.filter(f => f.projected_cost_id && f.paid_this_cycle)
                .map(f => f.projected_cost_id)
  )
  const isPaid = (pc: ProjectedCost) =>
    fundPaidCostIds.has(pc.id) ||
    (pc.frequency === 'weekly' ? weekPaidIds.has(pc.id) : monthPaidIds.has(pc.id))

  const weekProjectedCosts = projectedCosts.filter(pc => {
    if (!pc.is_active) return false
    if (pc.frequency === 'one_time') {
      if (!pc.month || !pc.year) return false
      const dom = pc.day_of_month ?? 1
      const costDateStr = new Date(pc.year, pc.month - 1, dom).toISOString().slice(0, 10)
      return costDateStr >= weekStartStr && costDateStr <= weekEndStr
    }
    if (pc.frequency === 'monthly') {
      const dom = pc.day_of_month ?? 1
      const wStart = new Date(weekStartStr + 'T00:00:00')
      const wEnd   = new Date(weekEndStr   + 'T00:00:00')
      const seen   = new Set<string>()
      const cur    = new Date(wStart)
      while (cur <= wEnd) {
        const ky = cur.getFullYear() + '-' + cur.getMonth()
        if (!seen.has(ky)) {
          seen.add(ky)
          const y = cur.getFullYear(), m = cur.getMonth()
          const daysInMonth = new Date(y, m + 1, 0).getDate()
          if (dom <= daysInMonth) {
            const candidate = new Date(y, m, dom).toISOString().slice(0, 10)
            if (candidate >= weekStartStr && candidate <= weekEndStr) return true
          }
        }
        cur.setDate(cur.getDate() + 1)
      }
      return false
    }
    return true
  })
  const displayedProjectedCosts = selectedDay ? getCostsForDay(projectedCosts, selectedDay) : weekProjectedCosts

  const sumUnpaid = (costs: ProjectedCost[]) =>
    costs.reduce((s, pc) => isPaid(pc) ? s : s + Number(pc.amount_mxn), 0)

  const weekProjectedTotal      = sumUnpaid(weekProjectedCosts)
  const displayedProjectedTotal = selectedDay ? sumUnpaid(displayedProjectedCosts) : weekProjectedTotal

  // ── Sinking fund set-asides due this week ────────────────────────────────
  // Which funds land in this week, mirroring weekProjectedCosts above:
  // weekly cadence is due every week; monthly is due when its day of month
  // falls inside the window.
  const weekFunds = sinkingFunds.filter(f => {
    if (!f.is_active) return false
    // Past weeks show what actually happened via the transactions table —
    // a catch-up figure recomputed from today's balance would be nonsense.
    if (weekOffset < 0) return false
    if (f.cadence === 'weekly') return true
    const dom    = f.contribution_day_of_month ?? 1
    const wStart = new Date(weekStartStr + 'T00:00:00')
    const wEnd   = new Date(weekEndStr   + 'T00:00:00')
    const seen   = new Set<string>()
    const cur    = new Date(wStart)
    while (cur <= wEnd) {
      const ky = cur.getFullYear() + '-' + cur.getMonth()
      if (!seen.has(ky)) {
        seen.add(ky)
        const y = cur.getFullYear(), m = cur.getMonth()
        const daysInMonth = new Date(y, m + 1, 0).getDate()
        if (dom <= daysInMonth) {
          const candidate = new Date(y, m, dom).toISOString().slice(0, 10)
          if (candidate >= weekStartStr && candidate <= weekEndStr) return true
        }
      }
      cur.setDate(cur.getDate() + 1)
    }
    return false
  })

  // Sum rather than flag. isPaid treats any linked expense as full payment,
  // which is fine for a bill paid in one go but wrong for a set-aside, where
  // partial funding is the normal case.
  const setAsideFor = (f: SinkingFund) =>
    (f.cadence === 'weekly' ? expenses : (monthExpData?.data ?? []))
      .filter(e => e.sinking_fund_id === f.id)
      .reduce((s, e) => s + Number(e.amount_mxn), 0)

  // Current week uses the catch-up-aware figure; future weeks use the
  // steady-state one, since catch-up is computed against today's balance.
  const dueFor = (f: SinkingFund) =>
    Number(weekOffset === 0 ? f.set_aside_this_period : f.base_per_period) || 0

  const outstandingFor = (f: SinkingFund) => Math.max(0, dueFor(f) - setAsideFor(f))

  const weekFundTotal = weekFunds.reduce((s, f) => s + outstandingFor(f), 0)
  const weekPlanTotal = displayedProjectedTotal + (selectedDay ? 0 : weekFundTotal)

  const filteredExpenses = selectedDay ? expenses.filter(e => e.date === selectedDay) : expenses

  const totalMXN     = expenses.reduce((s, e) => s + Number(e.amount_mxn), 0)
  const filteredTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount_mxn), 0)
  const weekIncome   = earnings.reduce((s, e) => s + Number(e.amount_mxn ?? e.amount), 0)
  const monthlyBudget = budgets.reduce((s, b) => s + Number(b.limit_amount ?? 0), 0)
  const weeklyBudget  = monthlyBudget > 0 ? monthlyBudget / 4.33 : 0
  const dailyBudget   = weeklyBudget / 7

  // Spend with no planned cost behind it — the discretionary slice of the week.
  // Costs settled through the Pay button carry a projected_cost_id and drop out;
  // so do sinking-fund set-asides, which carry a sinking_fund_id. A set-aside is
  // the most planned money in the app and must never read as unplanned.
  const unplannedSpend = expenses.reduce(
    (s, e) => (e.projected_cost_id || e.sinking_fund_id) ? s : s + Number(e.amount_mxn), 0)
  const unplannedPct   = totalMXN > 0 ? Math.round((unplannedSpend / totalMXN) * 100) : 0

  const isCurrentWeek = weekOffset === 0

  // Group by day
  const spendByDay: Record<string, number> = {}
  expenses.forEach(e => { spendByDay[e.date] = (spendByDay[e.date] ?? 0) + Number(e.amount_mxn) })
  const incomeByDay: Record<string, number> = {}
  earnings.forEach(e => { incomeByDay[e.date] = (incomeByDay[e.date] ?? 0) + Number(e.amount_mxn ?? e.amount) })

  const days = Array.from({ length: 7 }, (_, i) => {
    const d      = new Date(start)
    d.setDate(start.getDate() + i)
    const ds     = d.toISOString().slice(0, 10)
    const spend  = spendByDay[ds] ?? 0
    const income = incomeByDay[ds] ?? 0
    const pct    = dailyBudget > 0 ? (spend / dailyBudget) * 100 : 0
    return {
      date: d, dateStr: ds,
      name: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      day:  d.getDate(),
      spend, income, pct,
      projected: getCostsForDay(projectedCosts, ds).reduce((s, pc) => s + Number(pc.amount_mxn), 0),
      isToday: ds === todayStr,
      barColor: (dailyBudget > 0 && pct > 100) ? 'var(--negative)' : spend > 0 ? 'var(--positive)' : 'var(--border)',
    }
  })

  const maxDaySpend = Math.max(...days.map(d => d.spend), 1)

  const rowVirtualizer = useVirtualizer({
    count: filteredExpenses.length, getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, overscan: 8,
  })

  // ── Shared week nav content ──────────────────────────────────────────────
  const weekNav = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <button onClick={() => setWeekOffset(p => p - 1)} style={{ width: 32, height: 32, borderRadius: 8, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}>
        <ChevronLeft size={14} />
      </button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          Week {week} · {year}
          {isCurrentWeek && (
            <span style={{ fontSize: 10, fontWeight: 600, background: 'var(--info-soft)', color: 'var(--info)', padding: '2px 8px', borderRadius: 999, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Current</span>
          )}
        </div>
        <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 3 }}>
          {`${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
        </div>
      </div>
      <button onClick={() => setWeekOffset(p => p + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}>
        <ChevronRight size={14} />
      </button>
    </div>
  )

  // ── Shared day strip content ─────────────────────────────────────────────
  const dayStripDesktop = (
    <div className="s-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days.map((d, i) => (
          <div key={d.dateStr} onClick={() => setSelectedDay(prev => prev === d.dateStr ? null : d.dateStr)}
            style={{
              padding: '14px 10px',
              borderRight: i < 6 ? 'var(--card-border)' : 'none',
              background: selectedDay === d.dateStr ? 'var(--accent-soft)' : d.isToday ? 'var(--surface-alt)' : 'transparent',
              position: 'relative', cursor: 'pointer', transition: 'background 120ms ease',
            }}>
            {(d.isToday || selectedDay === d.dateStr) && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }} />}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: d.isToday ? 'var(--accent-ink)' : 'var(--text-mute)' }}>{d.name}</div>
                <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em', color: d.isToday ? 'var(--accent)' : 'var(--text)', marginTop: 2, lineHeight: 1 }}>{d.day}</div>
              </div>
              {d.pct > 100 && dailyBudget > 0 && (
                <span style={{ fontSize: 9, padding: '1px 5px', background: 'var(--negative-soft)', color: 'var(--negative)', borderRadius: 3, fontWeight: 700, letterSpacing: '0.04em' }}>OVER</span>
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: (dailyBudget > 0 && d.pct > 100) ? 'var(--negative)' : d.spend > 0 ? 'var(--text)' : 'var(--text-mute)' }}>
                {d.spend > 0 ? (d.spend >= 1000 ? `$${(d.spend / 1000).toFixed(1)}k` : `$${Math.round(d.spend)}`) : '—'}
              </div>
            </div>
            <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: `${dailyBudget > 0 ? Math.min(d.pct, 100) : (d.spend / maxDaySpend) * 100}%`, height: '100%', background: d.barColor, borderRadius: 2 }} />
            </div>
            {(d.spend > 0 || d.income > 0) && (() => {
              const net = d.income - d.spend
              const fmt = (n: number) => Math.abs(n) >= 1000 ? `$${(Math.abs(n) / 1000).toFixed(1)}k` : `$${Math.round(Math.abs(n))}`
              return (
                <div className="font-mono" style={{ marginTop: 5, fontSize: 10, fontWeight: 600, color: net >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                  {net >= 0 ? '+' : '−'}{fmt(net)} net
                </div>
              )
            })()}
            {d.projected > 0 && (
              <div className="font-mono" style={{ marginTop: 3, fontSize: 10, fontWeight: 600, color: 'var(--info)' }}>
                {'$' + (d.projected >= 1000 ? (d.projected / 1000).toFixed(1) + 'k' : Math.round(d.projected))} plan
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Desktop layout ──────────────────────────────────────────── */}
        <div className="desktop-table" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
            Week View
          </h1>

          {weekNav}

          {!isCurrentWeek && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setWeekOffset(0)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to current week
              </button>
            </div>
          )}

          {dayStripDesktop}

          {selectedDay && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                Showing <strong style={{ color: 'var(--text)' }}>{new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
                {' · '}{filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'}
              </span>
              <button onClick={() => setSelectedDay(null)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Clear filter
              </button>
            </div>
          )}

          {/* 4-card stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { k: 'Spent this week',  v: formatMXN(totalMXN),   color: 'var(--negative)', icon: <TrendingDown size={14} />, sub: null },
              { k: 'Earned this week', v: formatMXN(weekIncome),  color: 'var(--positive)', icon: <TrendingUp size={14} />, sub: null },
              { k: 'Unplanned spend',  v: formatMXN(unplannedSpend), color: 'var(--negative)', icon: null, sub: totalMXN > 0 ? `${unplannedPct}% of spend` : null },
              { k: selectedDay ? 'Day plan' : 'Week plan', v: formatMXN(weekPlanTotal), color: 'var(--info)', icon: null,
                sub: !selectedDay && weekFundTotal > 0 ? `${formatMXN(weekFundTotal)} set aside` : null },
            ].map((s, i) => (
              <div key={i} className="s-card" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{s.k}</div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.v}</div>
                {s.sub && <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s.sub}</div>}
              </div>
            ))}
          </div>

          {/* Planned costs for this month */}
          {displayedProjectedCosts.length > 0 && (
            <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Planned this week</div>
                <div className="font-mono" style={{ fontSize: 12, color: 'var(--info)', fontWeight: 600 }}>{formatMXN(displayedProjectedTotal)}</div>
              </div>
              <table style={{ width: '100%', fontSize: 12.5 }}>
                <tbody>
                  {displayedProjectedCosts.map(pc => {
                    const cat = catMap[pc.category_id ?? '']
                    return (
                      <tr key={pc.id} style={{ borderBottom: 'var(--card-border)', opacity: isPaid(pc) ? 0.5 : 1 }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 16px' }}>
                          {cat ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-dim)' }}>{cat.name}</span>
                            </span>
                          ) : <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>Uncategorized</span>}
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 600 }}>{pc.name}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-dim)', fontSize: 11.5 }}>
                          {pc.frequency === 'one_time' ? 'One-time' : pc.frequency === 'weekly' ? 'Weekly' : 'Monthly'}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }} className="font-mono">
                          <span style={{ fontWeight: 600, color: 'var(--info)' }}>{formatMXN(Number(pc.amount_mxn))}</span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          {isPaid(pc) ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'var(--surface-alt)', color: 'var(--positive)', borderRadius: 6 }}>
                              <Check size={12} /> Paid
                            </span>
                          ) : (
                            <button
                              onClick={() => setPayTarget(pc)}
                              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'var(--positive-soft)', color: 'var(--positive)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sinking funds due this week */}
          {!selectedDay && weekFunds.length > 0 && (
            <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Sinking funds</div>
                <div className="font-mono" style={{ fontSize: 12, color: 'var(--info)', fontWeight: 600 }}>{formatMXN(weekFundTotal)}</div>
              </div>
              <table style={{ width: '100%', fontSize: 12.5 }}>
                <tbody>
                  {weekFunds.map(f => {
                    const outstanding = outstandingFor(f)
                    const funded      = outstanding <= 0
                    return (
                      <tr key={f.id} style={{ borderBottom: 'var(--card-border)', opacity: funded ? 0.5 : 1 }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '10px 16px', color: 'var(--text)', fontWeight: 600 }}>{f.name}</td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-dim)', fontSize: 11.5 }}>
                          {f.cadence === 'weekly' ? 'Weekly' : 'Monthly'} set-aside
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }} className="font-mono">
                          <span style={{ fontWeight: 600, color: 'var(--info)' }}>{formatMXN(outstanding)}</span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          {funded ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'var(--surface-alt)', color: 'var(--positive)', borderRadius: 6 }}>
                              <Check size={12} /> Funded
                            </span>
                          ) : (
                            <button
                              onClick={() => setSetAsideTarget(f)}
                              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'var(--info-soft)', color: 'var(--info)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                              Set aside
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Transactions table */}
          <Card padding={false}>
            {isLoading ? (
              <div className="py-16 flex justify-center"><LoadingSpinner text="Loading week..." /></div>
            ) : expenses.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Inbox size={22} style={{ color: 'var(--text-mute)' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>No expenses this week</p>
                <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Try navigating to a different week</p>
              </div>
            ) : (
              <div ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: 12.5 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                    <tr style={{ borderBottom: 'var(--card-border)' }}>
                      {['Date','Category','Notes','Amount (MXN)','Actions'].map((h, i) => (
                        <th key={i} style={{ padding: '10px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: i === 3 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowVirtualizer.getVirtualItems()[0] && (
                      <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}><td /></tr>
                    )}
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                      const exp = filteredExpenses[virtualRow.index]
                      const cat = catMap[exp.category_id ?? '']
                      const cur = curMap[exp.currency_id]
                      return (
                        <tr key={exp.id} style={{ borderBottom: 'var(--card-border)', transition: 'background 120ms ease' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '11px 16px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }} className="font-mono">{formatDate(exp.date)}</td>
                          <td style={{ padding: '11px 16px' }}>
                            {cat ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                                <span style={{ color: 'var(--text)' }}>{cat.name}</span>
                              </span>
                            ) : <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>Uncategorized</span>}
                          </td>
                          <td style={{ padding: '11px 16px', color: 'var(--text-dim)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {exp.notes ?? <span style={{ color: 'var(--text-mute)' }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                            <p className="font-mono" style={{ fontWeight: 600, color: 'var(--negative)' }}>{formatMXN(exp.amount_mxn)}</p>
                            {exp.currency_id !== currencies.find(c => c.code === 'MXN')?.id && (
                              <p className="font-mono" style={{ fontSize: 10.5, color: 'var(--text-mute)' }}>
                                {cur?.symbol}{Number(exp.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button onClick={() => setMoveTarget(exp)} style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, background: 'var(--accent-soft)', color: 'var(--accent-ink)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Move</button>
                              <button onClick={() => setSplitTarget(exp)} style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, background: 'var(--info-soft)', color: 'var(--info)', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Split</button>
                              <button onClick={async () => { if (!confirm('Delete this expense?')) return; await deleteExpense.mutateAsync(exp.id) }}
                                style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-mute)', cursor: 'pointer', display: 'flex', transition: 'all 120ms ease' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--negative)'; e.currentTarget.style.background = 'var(--negative-soft)' }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mute)'; e.currentTarget.style.background = 'transparent' }}>
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {rowVirtualizer.getVirtualItems().length > 0 && (() => {
                      const items = rowVirtualizer.getVirtualItems()
                      const last  = items[items.length - 1]
                      const rem   = rowVirtualizer.getTotalSize() - last.end
                      return rem > 0 ? <tr style={{ height: `${rem}px` }}><td /></tr> : null
                    })()}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `2px solid var(--border-strong)`, background: 'var(--surface-alt)' }}>
                      <td colSpan={3} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        {selectedDay ? 'Day Total' : 'Week Total'}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }} className="font-mono">
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--negative)' }}>{formatMXN(selectedDay ? filteredTotal : totalMXN)}</span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* ── Mobile layout ────────────────────────────────────────────── */}
        <div className="mobile-list" style={{ display: 'none' }}>
          {/* Mobile week nav */}
          {weekNav}

          {!isCurrentWeek && (
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <button onClick={() => setWeekOffset(0)} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to current week
              </button>
            </div>
          )}

          {/* Summary card */}
          <div style={{ padding: 16, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14, marginTop: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Spent this week</div>
              <div className="font-mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--negative)', marginTop: 4 }}>{formatMXN(totalMXN)}</div>
              {weekIncome > 0 && (
                <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--positive)', marginTop: 3, fontWeight: 600 }}>+{formatMXN(weekIncome)} earned</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Projected</div>
              <div className="font-mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--info)', marginTop: 4 }}>{formatMXN(weekPlanTotal)}</div>
            </div>
          </div>

          {/* Mobile day strip — vertical bars */}
          <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {days.map(d => {
                const maxBar = 50
                const barH   = dailyBudget > 0
                  ? Math.min(maxBar, (d.spend / dailyBudget) * maxBar)
                  : d.spend > 0 ? maxBar * 0.4 : 2
                const isSelected = selectedDay === d.dateStr
                return (
                  <div key={d.dateStr} onClick={() => setSelectedDay(prev => prev === d.dateStr ? null : d.dateStr)}
                    style={{
                      padding: '6px 2px', borderRadius: 6, cursor: 'pointer', transition: 'background 120ms ease',
                      background: isSelected ? 'var(--accent-soft)' : d.isToday ? 'var(--surface-alt)' : 'transparent',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      outline: isSelected ? '2px solid var(--accent)' : 'none',
                    }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: d.isToday ? 'var(--accent-ink)' : 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d.name}</div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600, color: d.isToday ? 'var(--accent)' : 'var(--text)', marginTop: 2 }}>{d.day}</div>
                    <div style={{ height: maxBar, display: 'flex', alignItems: 'flex-end', marginTop: 6, width: 12 }}>
                      <div style={{ width: '100%', height: Math.max(barH, 2), background: d.barColor, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Planned costs — mobile */}
          {displayedProjectedCosts.length > 0 && (
            <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Planned this week</div>
                <div className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--info)' }}>{formatMXN(displayedProjectedTotal)}</div>
              </div>
              {displayedProjectedCosts.map((pc, i) => {
                const cat = catMap[pc.category_id ?? '']
                return (
                  <div key={pc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', opacity: isPaid(pc) ? 0.5 : 1 }}>
                    <div style={{ width: 4, height: 32, background: cat?.color ?? 'var(--info)', borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{cat?.name ?? 'Uncategorized'}</div>
                    </div>
                    <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--info)', flexShrink: 0 }}>{formatMXN(Number(pc.amount_mxn))}</div>
                    {isPaid(pc) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', fontSize: 11, fontWeight: 600, background: 'var(--surface-alt)', color: 'var(--positive)', borderRadius: 6, flexShrink: 0 }}>
                        <Check size={12} /> Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => setPayTarget(pc)}
                        style={{ padding: '4px 9px', fontSize: 11, fontWeight: 600, background: 'var(--positive-soft)', color: 'var(--positive)', border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
                        Pay
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Sinking funds — mobile */}
          {!selectedDay && weekFunds.length > 0 && (
            <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Sinking funds</div>
                <div className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--info)' }}>{formatMXN(weekFundTotal)}</div>
              </div>
              {weekFunds.map((f, i) => {
                const outstanding = outstandingFor(f)
                const funded      = outstanding <= 0
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--border)', opacity: funded ? 0.5 : 1 }}>
                    <div style={{ width: 4, height: 32, background: 'var(--info)', borderRadius: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{f.cadence === 'weekly' ? 'Weekly' : 'Monthly'} set-aside</div>
                    </div>
                    <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--info)', flexShrink: 0 }}>{formatMXN(outstanding)}</div>
                    {funded ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 9px', fontSize: 11, fontWeight: 600, background: 'var(--surface-alt)', color: 'var(--positive)', borderRadius: 6, flexShrink: 0 }}>
                        <Check size={12} /> Funded
                      </span>
                    ) : (
                      <button
                        onClick={() => setSetAsideTarget(f)}
                        style={{ padding: '4px 9px', fontSize: 11, fontWeight: 600, background: 'var(--info-soft)', color: 'var(--info)', border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
                        Set aside
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Transaction list */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}><LoadingSpinner text="Loading..." /></div>
          ) : filteredExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Inbox size={22} style={{ color: 'var(--text-mute)' }} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{selectedDay ? 'No expenses on this day' : 'No expenses this week'}</p>
              {selectedDay && <button onClick={() => setSelectedDay(null)} style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Show all days</button>}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 8px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {selectedDay ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'This week'}
                </div>
                {selectedDay && <button onClick={() => setSelectedDay(null)} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>All days</button>}
              </div>
              <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
                {filteredExpenses.map((exp, i) => {
                  const cat = catMap[exp.category_id ?? '']
                  return (
                    <div key={exp.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                    }}>
                      <div style={{ width: 4, height: 36, background: cat?.color || 'var(--text-mute)', borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exp.notes ?? 'Expense'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
                          {cat?.name ?? 'Uncategorized'} · {formatDate(exp.date)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--negative)' }}>
                          −{formatMXN(exp.amount_mxn)}
                        </span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setMoveTarget(exp)} style={{ padding: '3px 7px', fontSize: 10.5, fontWeight: 600, background: 'var(--accent-soft)', color: 'var(--accent-ink)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Move</button>
                          <button onClick={() => setSplitTarget(exp)} style={{ padding: '3px 7px', fontSize: 10.5, fontWeight: 600, background: 'var(--info-soft)', color: 'var(--info)', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Split</button>
                          <button onClick={async () => { if (!confirm('Delete?')) return; await deleteExpense.mutateAsync(exp.id) }} style={{ padding: 4, color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', marginTop: 4, background: 'var(--surface-alt)', borderRadius: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selectedDay ? 'Day total' : 'Week total'}</span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--negative)' }}>{formatMXN(selectedDay ? filteredTotal : totalMXN)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <MoveModal  expense={moveTarget}  open={moveTarget  !== null} onClose={() => setMoveTarget(null)} />
      <PayModal
        cost={payTarget}
        open={payTarget !== null}
        onClose={() => setPayTarget(null)}
        catMap={catMap}
      />
      <SetAsideModal
        fund={setAsideTarget}
        amount={setAsideTarget ? outstandingFor(setAsideTarget) : 0}
        open={setAsideTarget !== null}
        onClose={() => setSetAsideTarget(null)}
      />
      <MoveToDayModal
        open={moveToDayOpen}
        onClose={() => setMoveToDayOpen(false)}
        expenses={expenses}
        earnings={earnings}
        weekStart={weekStartStr}
        catMap={catMap}
      />
      <SplitModal expense={splitTarget} open={splitTarget !== null} onClose={() => setSplitTarget(null)} />
    </>
  )
}