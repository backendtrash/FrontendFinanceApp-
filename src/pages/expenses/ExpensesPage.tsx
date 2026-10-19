import { useState, useEffect, Fragment }                              from 'react'
import { TrendingDown, Upload, Plus, RefreshCw, Trash, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useExpenses, useCreateExpense, useDeleteExpense,
  useCategories, useCurrencies, useRecurringRules,
  useCreateRecurringRule, useDeleteRecurringRule,
  useMonthlyProjection,
} from '../../hooks/useQueries'
import Card                 from '../../components/ui/Card'
import Button               from '../../components/ui/Button'
import Input                from '../../components/ui/Input'
import Modal                from '../../components/ui/Modal'
import Badge                from '../../components/ui/Badge'
import SegmentedControl     from '../../components/ui/SegmentedControl'
import { TableSkeleton }      from '../../components/ui/Skeleton'
import LoadingSpinner       from '../../components/ui/LoadingSpinner'
import ImportModal          from '../../components/ui/ImportModal'
import RecurringToggle      from '../../components/ui/RecurringToggle'
import { formatMXN, formatDate, todayISO } from '../../utils/formatters'
import { importExpenses, getExpenseMonths } from '../../api/expenses'
import { exportPdf }         from '../../utils/exportPdf'
import MonthPicker           from '../../components/ui/MonthPicker'
import { useQuery }          from '@tanstack/react-query'
import DangerZone            from '../../components/ui/DangerZone'
import { useAddSheetStore }   from '../../store/addSheetStore'
import { useQueryClient }    from '@tanstack/react-query'
import { QUERY_KEYS }        from '../../hooks/useQueries'
import EditExpenseModal       from '../../components/ui/EditExpenseModal'
import FilterBar              from '../../components/ui/FilterBar'
import { useDeleteConfirm } from '../../hooks/useDeleteConfirm'
import ConfirmRow           from '../../components/ui/ConfirmRow'
import type {
  ExpenseCreate, RecurringRuleCreate,
  Expense, ExpenseFilters,
} from '../../types/index'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ── Expense Form ──────────────────────────────────────────────────────────
export function ExpenseForm({ onClose, initialRecurring = false }: { onClose: () => void; initialRecurring?: boolean }) {
  const { data: categories  = [] } = useCategories('expense')
  const { data: currencies  = [] } = useCurrencies()
  const createExpense               = useCreateExpense()
  const createRule                  = useCreateRecurringRule()

  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''

  const [form, setForm] = useState<ExpenseCreate>({
    amount:       0,
    currency_id:  mxnId,
    category_id:  undefined,
    date:         todayISO(),
    notes:        '',
    is_recurring: false,
  })

  // null = not recurring, object = recurring rule config
  const [recurringRule, setRecurringRule] =
    useState<Partial<RecurringRuleCreate> | null>(
      initialRecurring ? { frequency: 'monthly', day_of_month: 1 } : null
    )

  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.amount || form.amount <= 0) {
      setError('Amount must be greater than zero')
      return
    }

    const currencyId = form.currency_id || mxnId
    if (!currencyId) {
      setError('Please select a currency')
      return
    }

    try {
      if (recurringRule) {
        // Create recurring rule instead of one-time expense
        await createRule.mutateAsync({
          type:         'expense',
          amount:       form.amount,
          currency_id:  currencyId,
          category_id:  form.category_id || undefined,
          description:  recurringRule.description || form.notes || undefined,
          frequency:    recurringRule.frequency ?? 'weekly',
          day_of_week:  recurringRule.day_of_week,
          day_of_month: recurringRule.day_of_month,
        })
      } else {
        // One-time expense
        await createExpense.mutateAsync({
          ...form,
          currency_id:  currencyId,
          category_id:  form.category_id || undefined,
          notes:        form.notes        || undefined,
        })
      }
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to save')
    }
  }

  

  const isLoading = createExpense.isPending || createRule.isPending

  return (
    <div className="space-y-4">
      {/* Amount + Currency */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount || ''}
            onChange={e => setForm(p => ({
              ...p, amount: parseFloat(e.target.value) || 0
            }))}
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-300
                       rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={form.currency_id || mxnId}
            onChange={e => setForm(p => ({ ...p, currency_id: e.target.value }))}
          >
            {currencies.map(c => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-300
                     rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          value={form.category_id ?? ''}
          onChange={e => setForm(p => ({
            ...p, category_id: e.target.value || undefined
          }))}
        >
          <option value="">No category</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Date — hidden when recurring (rule handles dates) */}
      {!recurringRule && (
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
        />
      )}

      {/* Notes */}
      <Input
        label="Notes (optional)"
        placeholder="What was this for?"
        value={form.notes ?? ''}
        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
      />

      {/* Recurring toggle */}
      <RecurringToggle
        type="expense"
        currencies={currencies}
        categories={categories}
        value={recurringRule}
        onChange={setRecurringRule}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" loading={isLoading} onClick={handleSubmit}>
          {recurringRule ? 'Create Rule' : 'Add Expense'}
        </Button>
      </div>
    </div>
  )
}

// ── Rules Tab ─────────────────────────────────────────────────────────────
function RulesTab() {
  const { data: rules   = [], isLoading } = useRecurringRules()
  const { data: categories = [] }          = useCategories('expense')
  const { data: currencies = [] }          = useCurrencies()
  const deleteRule                          = useDeleteRecurringRule()

  const expenseRules = rules.filter(r => r.type === 'expense')
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const curMap = Object.fromEntries(currencies.map(c => [c.id, c]))

  if (isLoading) {
    return <div className="py-12 flex justify-center">
      <LoadingSpinner text="Loading rules..." />
    </div>
  }

  if (!expenseRules.length) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center
                        justify-center mx-auto mb-3">
          <RefreshCw size={22} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">
          No recurring expense rules yet
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Toggle "Recurring" when adding an expense
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-4 py-3 text-xs font-medium text-gray-500">Description</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">Category</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">Schedule</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">Next Due</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">Amount</th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500">Status</th>
            <th className="px-4 py-3">&nbsp;</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {expenseRules.map(rule => {
            const cat = catMap[rule.category_id ?? '']
            const cur = curMap[rule.currency_id]

            const schedule = rule.frequency === 'weekly'
              ? `Every ${DAY_NAMES[rule.day_of_week ?? 0]}`
              : `Day ${rule.day_of_month ?? 1} of month`

            return (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">
                  {rule.description ?? <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {cat ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Uncategorized</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{schedule}</td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(rule.next_due_date)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {cur?.symbol}{Number(rule.amount).toLocaleString('es-MX', {
                    minimumFractionDigits: 2
                  })}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={rule.is_active ? 'positive' : 'muted'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this recurring rule?')) return
                      await deleteRule.mutateAsync(rule.id)
                    }}
                    className="
                      p-1.5 rounded-lg text-gray-300
                      hover:text-red-500 hover:bg-red-50
                      transition-all
                    "
                    title="Delete rule"
                  >
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Expenses Page ─────────────────────────────────────────────────────────
export default function ExpensesPage() {
  const qc  = useQueryClient()
  const now = new Date()

  // Default to current month key e.g. "2026-05"
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [tab,              setTab]              = useState<'transactions' | 'rules'>('transactions')
  const [showAdd,          setShowAdd]          = useState(false)
  const [openWithRecurring, setOpenWithRecurring] = useState(false)
  const [showImport,       setShowImport]       = useState(false)

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'expense:open-add') {
      setOpenWithRecurring(false); setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'expense:open-add-recurring') {
      setOpenWithRecurring(true); setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'expense:open-import') {
      setShowImport(true); clearPendingAction()
    } else if (pendingAction === 'expense:export-pdf') {
      const rows = expenses.map(e => [
        e.date,
        catMap[e.category_id ?? '']?.name ?? 'Uncategorized',
        e.notes ?? '',
        Number(e.amount).toFixed(2),
        Number(e.amount_mxn ?? e.amount).toFixed(2),
      ])
      exportPdf('Expenses', ['Date','Category','Notes','Amount','MXN'], rows, 'expenses')
      clearPendingAction()
    }
  }, [pendingAction])
  const [editExpense,     setEditExpense]     = useState<Expense | null>(null)
  const [showEditExpense, setShowEditExpense] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey)
  const [search,       setSearch]       = useState('')
  const [filters,          setFilters]          = useState<ExpenseFilters>({})
  const [mobileFilterCatId, setMobileFilterCatId] = useState('')
  const deleteConfirm = useDeleteConfirm()

  // Fetch available months
  const { data: months = [] } = useQuery({
    queryKey: ['expense-months'],
    queryFn:  getExpenseMonths,
    staleTime: 1000 * 60 * 5,
  })

  // Build date range from selected month
  const [selYear, selMonth] = selectedMonth.split('-').map(Number)
  const firstDay = `${selectedMonth}-01`
  const lastDay  = `${selectedMonth}-${new Date(selYear, selMonth, 0).getDate()}`

  const { data, isLoading } = useExpenses({
    limit:       100,
    offset:      0,
    date_from:   firstDay,
    date_to:     lastDay,
    category_id: filters.category_id,
    currency_id: filters.currency_id,
  })

  

  // Client-side search filter

  // Client-side search filter applied after fetch
  const expenses = (data?.data ?? []).filter(exp =>
    !search ||
    exp.notes?.toLowerCase().includes(search.toLowerCase())
  )
  const deleteExpense                  = useDeleteExpense()
  const { data: categories = [] }     = useCategories('expense')
  const { data: currencies  = [] }    = useCurrencies()

  const catMap   = Object.fromEntries(categories.map(c => [c.id, c]))
  const curMap   = Object.fromEntries(currencies.map(c => [c.id, c]))

  const total    = (data?.data ?? []).reduce((s, e) => s + Number(e.amount_mxn ?? e.amount), 0)
  const recCount = (data?.data ?? []).filter(e => e.is_recurring).length

  const { data: projection } = useMonthlyProjection(selYear, selMonth)
  const projectedTotal = projection ? Number(projection.total_projected_mxn) : 0
  const vsProjected    = projectedTotal > 0 ? projectedTotal - total : null

  const daysInMonth   = new Date(selYear, selMonth, 0).getDate()
  const isCurrentMonthSelected = selectedMonth === currentMonthKey
  const daysElapsed   = isCurrentMonthSelected ? now.getDate() : daysInMonth
  const avgPerDay     = daysElapsed > 0 ? total / daysElapsed : 0

  const catTotals = (data?.data ?? []).reduce((map, e) => {
    const id = e.category_id ?? ''
    map[id] = (map[id] || 0) + Number(e.amount_mxn ?? e.amount)
    return map
  }, {} as Record<string, number>)

  const topMobileCats = categories
    .filter(c => catTotals[c.id] > 0)
    .sort((a, b) => (catTotals[b.id] || 0) - (catTotals[a.id] || 0))
    .slice(0, 4)

  const mobileExpenses = mobileFilterCatId
    ? expenses.filter(e => e.category_id === mobileFilterCatId)
    : expenses

  const byDate = mobileExpenses.reduce((map, e) => {
    if (!map[e.date]) map[e.date] = []
    map[e.date].push(e)
    return map
  }, {} as Record<string, typeof expenses>)
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="hidden sm:flex sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
              Expenses
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
              <span className="font-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{formatMXN(total)}</span>
              {' '}across {expenses.length} transactions
            </p>
          </div>
          <div className="flex gap-2 justify-center sm:justify-end flex-wrap">
            <MonthPicker
              months={months}
              selectedKey={selectedMonth}
              onSelect={key => { setSelectedMonth(key); setSearch('') }}
              type="expense"
            />
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={13} /> Import
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={13} /> Add Expense
            </Button>
          </div>
        </div>

        {/* ── Stat strip ──────────────────────────────────────────── */}
        <div className="hidden sm:grid sm:grid-cols-4" style={{ gap: 12 }}>
          {([
            { k: 'Total spent',  v: formatMXN(total),   sub: selectedMonth,                    color: undefined },
            { k: 'Recurring',    v: formatMXN((data?.data ?? []).filter(e => e.is_recurring).reduce((s,e) => s + Number(e.amount_mxn ?? e.amount), 0)), sub: `${recCount} rules`, color: undefined },
            { k: 'Avg per day',  v: formatMXN(avgPerDay), sub: `Day ${daysElapsed} of ${daysInMonth}`, color: undefined },
            vsProjected !== null
              ? { k: 'vs projected', v: (vsProjected >= 0 ? '−' : '+') + formatMXN(Math.abs(vsProjected)), sub: vsProjected >= 0 ? `Under by ${(vsProjected / projectedTotal * 100).toFixed(1)}%` : `Over by ${(Math.abs(vsProjected) / projectedTotal * 100).toFixed(1)}%`, color: vsProjected >= 0 ? 'var(--positive)' : 'var(--negative)' }
              : { k: 'vs projected', v: '—', sub: 'No projection', color: undefined },
          ] as { k: string; v: string; sub: string; color: string | undefined }[]).map((s, i) => (
            <div key={i} className="s-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.k}</div>
              <div className="font-mono" style={{ fontSize: 19, fontWeight: 600, color: s.color ?? 'var(--text)', marginTop: 4 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="hidden sm:flex sm:items-center sm:justify-between flex-wrap gap-3">
          <SegmentedControl
            tabs={[
              { id: 'transactions', label: 'Transactions' },
              { id: 'rules',        label: 'Rules' },
            ]}
            active={tab}
            onChange={v => setTab(v as 'transactions' | 'rules')}
          />

          {tab === 'transactions' && (
            <FilterBar
              categories={categories}
              currencies={currencies}
              onFilter={f => {
                setSearch(f.search)
                setFilters({
                  date_from:   f.date_from   || undefined,
                  date_to:     f.date_to     || undefined,
                  category_id: f.category_id || undefined,
                  currency_id: f.currency_id || undefined,
                })
              }}
            />
          )}
        </div>

        {tab === 'rules' ? (
          <Card padding={false}><RulesTab /></Card>
        ) : isLoading ? (
          <Card padding={false}><TableSkeleton rows={8} /></Card>
        ) : expenses.length === 0 ? (
          <>
            {/* Mobile empty — month nav stays accessible */}
            <div className="mobile-list">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <button
                  onClick={() => { const d = new Date(selYear, selMonth - 2, 1); setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}
                ><ChevronLeft size={14} /></button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {new Date(selYear, selMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>
                    {isCurrentMonthSelected ? 'Current period' : 'Past period'}
                  </div>
                </div>
                <button
                  onClick={() => { const d = new Date(selYear, selMonth, 1); setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`) }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}
                ><ChevronRight size={14} /></button>
              </div>
              <div style={{ textAlign: 'center', padding: '20px 0 40px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--negative-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <TrendingDown size={22} style={{ color: 'var(--negative)' }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No expenses this month</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Try a different month or add one</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}><Upload size={13} /> Import</Button>
                  <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Expense</Button>
                </div>
              </div>
            </div>
            {/* Desktop empty */}
            <div className="desktop-table">
              <Card padding={false}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--negative-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <TrendingDown size={22} style={{ color: 'var(--negative)' }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No expenses yet</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Add one manually or import from CSV/JSON</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}><Upload size={13} /> Import</Button>
                    <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add Expense</Button>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* ── Mobile layout ─────────────────────────────────────── */}
            <div className="mobile-list">
              {/* Summary card */}
              <div style={{
                padding: 16, background: 'var(--surface)',
                border: 'var(--card-border)', borderRadius: 14, marginBottom: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total spent</div>
                    <div className="font-mono" style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)', marginTop: 4, letterSpacing: '-0.01em' }}>{formatMXN(total)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{expenses.length} transactions · {daysElapsed} of {daysInMonth} days</div>
                  </div>
                  {vsProjected !== null && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4,
                      background: vsProjected >= 0 ? 'var(--positive-soft)' : 'var(--negative-soft)',
                      color: vsProjected >= 0 ? 'var(--positive)' : 'var(--negative)',
                      letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0,
                    }}>
                      {vsProjected >= 0
                        ? `−${(vsProjected / projectedTotal * 100).toFixed(1)}%`
                        : `+${(Math.abs(vsProjected) / projectedTotal * 100).toFixed(1)}%`}
                    </span>
                  )}
                </div>
                {total > 0 && (
                  <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, marginTop: 12, overflow: 'hidden', display: 'flex' }}>
                    {categories
                      .filter(c => catTotals[c.id] > 0)
                      .sort((a, b) => (catTotals[b.id] || 0) - (catTotals[a.id] || 0))
                      .map(c => (
                        <div key={c.id} style={{ width: `${(catTotals[c.id] / total) * 100}%`, background: c.color, height: '100%' }} />
                      ))}
                  </div>
                )}
              </div>

              {/* Mobile month nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <button
                  onClick={() => {
                    const d = new Date(selYear, selMonth - 2, 1)
                    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                  }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}
                >
                  <ChevronLeft size={14} />
                </button>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {new Date(selYear, selMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>
                    {isCurrentMonthSelected ? 'Current period' : 'Past period'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const d = new Date(selYear, selMonth, 1)
                    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
                  }}
                  style={{ width: 32, height: 32, borderRadius: 8, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Filter chips */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
                {([{ id: '', name: 'All' }, ...topMobileCats] as { id: string; name: string }[]).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setMobileFilterCatId(c.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 999,
                      background: mobileFilterCatId === c.id ? 'var(--text)' : 'var(--surface)',
                      color: mobileFilterCatId === c.id ? 'var(--bg)' : 'var(--text)',
                      border: `1px solid ${mobileFilterCatId === c.id ? 'var(--text)' : 'var(--border)'}`,
                      fontSize: 11.5, fontWeight: 600, flexShrink: 0, cursor: 'pointer',
                    }}
                  >{c.name}</button>
                ))}
              </div>

              {/* Grouped list by date */}
              {sortedDates.map(date => {
                const dayExps = byDate[date]
                const dayTotal = dayExps.reduce((s, e) => s + Number(e.amount_mxn ?? e.amount), 0)
                return (
                  <div key={date} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{formatDate(date)}</div>
                      <div className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)' }}>−{formatMXN(dayTotal)}</div>
                    </div>
                    <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
                      {dayExps.map((e, i) => {
                        const cat = catMap[e.category_id ?? '']
                        const cur = curMap[e.currency_id]
                        return (
                          <div
                            key={e.id}
                            onClick={() => { setEditExpense(e); setShowEditExpense(true) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '12px 14px',
                              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                              background: (cat?.color || '#9ca3af') + '20',
                              color: cat?.color || '#9ca3af',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: 14,
                            }}>
                              {(cat?.name ?? 'U').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {e.notes ?? 'Expense'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                                {cat?.name ?? 'Uncategorized'}
                                {e.is_recurring && (
                                  <span style={{ fontSize: 9, padding: '1px 5px', background: 'var(--info-soft)', color: 'var(--info)', borderRadius: 3, fontWeight: 600, letterSpacing: '0.04em' }}>↻</span>
                                )}
                              </div>
                            </div>
                            <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                              −{cur?.symbol ?? '$'}{Number(e.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              onClick={async (ev) => { ev.stopPropagation(); if (!confirm('Delete this expense?')) return; await deleteExpense.mutateAsync(e.id) }}
                              style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: '0 2px' }}
                              onMouseEnter={ev => (ev.currentTarget.style.color = 'var(--negative)')}
                              onMouseLeave={ev => (ev.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── Desktop table ─────────────────────────────────────── */}
            <div className="desktop-table">
              <Card padding={false}>
                <div className="overflow-x-auto">
                  <table className="w-full" style={{ fontSize: 12.5 }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                      <tr style={{ borderBottom: 'var(--card-border)' }}>
                        {['Date','Category','Notes','Amount','MXN',''].map((h, i) => (
                          <th key={i} style={{
                            padding: '10px 16px',
                            fontSize: 10.5, fontWeight: 600,
                            color: 'var(--text-dim)',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            textAlign: i >= 3 && i < 5 ? 'right' : 'left',
                            whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => {
                        const cat = catMap[e.category_id ?? '']
                        const cur = curMap[e.currency_id]
                        return (
                          <Fragment key={e.id}>
                            <tr
                              style={{ borderBottom: 'var(--card-border)', cursor: 'pointer', transition: 'background 120ms ease' }}
                              onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-alt)')}
                              onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                              onClick={() => { setEditExpense(e); setShowEditExpense(true) }}
                            >
                              <td style={{ padding: '11px 16px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }} className="font-mono">
                                {formatDate(e.date)}
                              </td>
                              <td style={{ padding: '11px 16px' }}>
                                {cat ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text)' }}>{cat.name}</span>
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>Uncategorized</span>
                                )}
                              </td>
                              <td style={{ padding: '11px 16px', color: 'var(--text-dim)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {e.notes ?? <span style={{ color: 'var(--text-mute)' }}>—</span>}
                              </td>
                              <td style={{ padding: '11px 16px', textAlign: 'right' }} className="font-mono">
                                <span style={{ fontWeight: 600, color: 'var(--negative)' }}>
                                  −{cur?.symbol ?? ''}{Number(e.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--text-mute)', fontSize: 11.5 }} className="font-mono">
                                {formatMXN(e.amount_mxn)}
                              </td>
                              <td style={{ padding: '11px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                  {e.is_recurring && <Badge variant="info">↻</Badge>}
                                  <button
                                    onClick={(ev) => { ev.stopPropagation(); deleteConfirm.ask(e.id) }}
                                    style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-mute)', cursor: 'pointer', display: 'flex', transition: 'all 120ms ease' }}
                                    onMouseEnter={ev => { ev.currentTarget.style.color = 'var(--negative)'; ev.currentTarget.style.background = 'var(--negative-soft)' }}
                                    onMouseLeave={ev => { ev.currentTarget.style.color = 'var(--text-mute)'; ev.currentTarget.style.background = 'transparent' }}
                                    title="Delete expense"
                                  >
                                    <Trash size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {deleteConfirm.confirmingId === e.id && (
                              <tr>
                                <td colSpan={6} style={{ padding: '0 8px 4px' }}>
                                  <ConfirmRow
                                    label={`Delete "${e.notes ?? 'this expense'}"?`}
                                    loading={deleteExpense.isPending}
                                    onConfirm={async () => {
                                      setShowEditExpense(false)
                                      setEditExpense(null)
                                      await deleteExpense.mutateAsync(e.id)
                                      deleteConfirm.clear()
                                    }}
                                    onCancel={deleteConfirm.cancel}
                                  />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        <ExpenseForm onClose={() => { setShowAdd(false); setOpenWithRecurring(false) }} initialRecurring={openWithRecurring} />
      </Modal>
      {/* Edit Modal */}
      <EditExpenseModal
        expense={editExpense}
        open={showEditExpense}
        onClose={() => {
          setShowEditExpense(false)
          setEditExpense(null)
        }}
        categories={categories}
        currencies={currencies}
      />
      {/* Import Modal */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        type="expense"
        categories={categories}
        currencies={currencies}
        onImport={importExpenses}
      />
      {/* Danger zone */}
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--negative)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Danger Zone
        </p>
        <DangerZone
          label="Delete all expenses"
          description="Permanently deletes all your expense records"
          onConfirm={async () => {
            const { deleteAllExpenses } = await import('../../api/goals')
            await deleteAllExpenses()
            qc.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
            qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
          }}
        />
      </div>
    </>
  )
}