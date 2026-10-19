import { useState, useEffect, Fragment }            from 'react'
import { TrendingUp, Upload, Plus, Trash, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import {
  useEarnings, useCreateEarning, useDeleteEarning,
  useCategories, useCurrencies, useRecurringRules,
  useCreateRecurringRule, useDeleteRecurringRule,
} from '../../hooks/useQueries'
import Card                 from '../../components/ui/Card'
import Button               from '../../components/ui/Button'
import Input                from '../../components/ui/Input'
import Modal                from '../../components/ui/Modal'
import Badge                from '../../components/ui/Badge'
import SegmentedControl     from '../../components/ui/SegmentedControl'
import LoadingSpinner       from '../../components/ui/LoadingSpinner'
import { TableSkeleton }      from '../../components/ui/Skeleton'
import ImportModal          from '../../components/ui/ImportModal'
import RecurringToggle      from '../../components/ui/RecurringToggle'
import { formatMXN, formatDate, todayISO } from '../../utils/formatters'
import { importEarnings, getEarningMonths } from '../../api/earnings'
import { exportPdf }        from '../../utils/exportPdf'
import MonthPicker          from '../../components/ui/MonthPicker'
import { useQuery }         from '@tanstack/react-query'
import DangerZone            from '../../components/ui/DangerZone'
import { useAddSheetStore }   from '../../store/addSheetStore'
import { useQueryClient }    from '@tanstack/react-query'
import { QUERY_KEYS }        from '../../hooks/useQueries'
import EditEarningModal       from '../../components/ui/EditEarningModal'
import { useDeleteConfirm } from '../../hooks/useDeleteConfirm'
import ConfirmRow           from '../../components/ui/ConfirmRow'
import FilterBar              from '../../components/ui/FilterBar'
import type {
  EarningCreate, RecurringRuleCreate,
  Earning, ExpenseFilters,
} from '../../types/index'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

// ── Earning Form ──────────────────────────────────────────────────────────
export function EarningForm({ onClose, initialRecurring = false }: { onClose: () => void; initialRecurring?: boolean }) {
  const { data: categories  = [] } = useCategories('income')
  const { data: currencies  = [] } = useCurrencies()
  const createEarning               = useCreateEarning()
  const createRule                  = useCreateRecurringRule()

  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''

  const [form, setForm] = useState<EarningCreate>({
    amount:       0,
    currency_id:  mxnId,
    category_id:  undefined,
    date:         todayISO(),
    notes:        '',
    is_recurring: false,
  })

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

    try {
      if (recurringRule) {
        await createRule.mutateAsync({
          type:         'income',
          amount:       form.amount,
          currency_id:  currencyId,
          category_id:  form.category_id || undefined,
          description:  recurringRule.description || form.notes || undefined,
          frequency:    recurringRule.frequency ?? 'weekly',
          day_of_week:  recurringRule.day_of_week,
          day_of_month: recurringRule.day_of_month,
        })
      } else {
        await createEarning.mutateAsync({
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

  const isLoading = createEarning.isPending || createRule.isPending

  return (
    <div className="space-y-4">
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

      {!recurringRule && (
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
        />
      )}

      <Input
        label="Notes (optional)"
        placeholder="Salary, freelance project..."
        value={form.notes ?? ''}
        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
      />

      <RecurringToggle
        type="income"
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
          {recurringRule ? 'Create Rule' : 'Add Earning'}
        </Button>
      </div>
    </div>
  )
}

// ── Rules Tab ─────────────────────────────────────────────────────────────
function RulesTab() {
  const { data: rules      = [], isLoading } = useRecurringRules()
  const { data: categories = [] }             = useCategories('income')
  const { data: currencies = [] }             = useCurrencies()
  const deleteRule                             = useDeleteRecurringRule()

  const incomeRules = rules.filter(r => r.type === 'income')
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const curMap = Object.fromEntries(currencies.map(c => [c.id, c]))

  if (isLoading) {
    return <div className="py-12 flex justify-center">
      <LoadingSpinner text="Loading rules..." />
    </div>
  }

  if (!incomeRules.length) {
    return (
      <div className="py-16 text-center">
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--positive-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <RefreshCw size={20} style={{ color: 'var(--positive)' }} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No recurring income rules yet</p>
        <p style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 4 }}>Toggle "Recurring" when adding an earning</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: 'var(--card-border)' }}>
            {['Description','Category','Schedule','Next Due','Amount','Status',''].map((h, i) => (
              <th key={i} style={{ padding: '10px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: i === 4 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {incomeRules.map(rule => {
            const cat = catMap[rule.category_id ?? '']
            const cur = curMap[rule.currency_id]
            const schedule = rule.frequency === 'weekly'
              ? `Every ${DAY_NAMES[rule.day_of_week ?? 0]}`
              : `Day ${rule.day_of_month ?? 1} of month`

            return (
              <tr key={rule.id}
                style={{ borderBottom: 'var(--card-border)', transition: 'background 120ms ease' }}
                onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-alt)')}
                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '11px 16px', color: 'var(--text)' }}>
                  {rule.description ?? <span style={{ color: 'var(--text-mute)' }}>—</span>}
                </td>
                <td style={{ padding: '11px 16px' }}>
                  {cat ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 4, background: cat.color }} />
                      <span style={{ color: 'var(--text)' }}>{cat.name}</span>
                    </span>
                  ) : <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>Uncategorized</span>}
                </td>
                <td style={{ padding: '11px 16px', color: 'var(--text-dim)' }}>{schedule}</td>
                <td style={{ padding: '11px 16px', color: 'var(--text-dim)' }} className="font-mono">{formatDate(rule.next_due_date)}</td>
                <td style={{ padding: '11px 16px', textAlign: 'right' }} className="font-mono">
                  <span style={{ fontWeight: 600, color: 'var(--positive)' }}>
                    +{cur?.symbol}{Number(rule.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </td>
                <td style={{ padding: '11px 16px' }}>
                  <Badge variant={rule.is_active ? 'positive' : 'muted'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                  <button
                    onClick={async () => {
                      if (!confirm('Delete this recurring rule?')) return
                      await deleteRule.mutateAsync(rule.id)
                    }}
                    style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-mute)', cursor: 'pointer', display: 'flex', transition: 'all 120ms ease' }}
                    onMouseEnter={ev => { ev.currentTarget.style.color = 'var(--negative)'; ev.currentTarget.style.background = 'var(--negative-soft)' }}
                    onMouseLeave={ev => { ev.currentTarget.style.color = 'var(--text-mute)'; ev.currentTarget.style.background = 'transparent' }}
                  >
                    <Trash size={13} />
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

// ── Earnings Page ─────────────────────────────────────────────────────────
export default function EarningsPage() {
  const qc  = useQueryClient()
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [tab,           setTab]           = useState<'transactions' | 'rules'>('transactions')
  const [showAdd,           setShowAdd]           = useState(false)
  const [openWithRecurring,  setOpenWithRecurring]  = useState(false)

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'earning:open-add') {
      setOpenWithRecurring(false); setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'earning:open-add-recurring') {
      setOpenWithRecurring(true); setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'earning:open-import') {
      setShowImport(true); clearPendingAction()
    } else if (pendingAction === 'earning:export-pdf') {
      const rows = earnings.map(e => [
        e.date,
        catMap[e.category_id ?? '']?.name ?? 'Uncategorized',
        e.notes ?? '',
        Number(e.amount).toFixed(2),
        Number(e.amount_mxn ?? e.amount).toFixed(2),
      ])
      exportPdf('Earnings', ['Date','Category','Notes','Amount','MXN'], rows, 'earnings')
      clearPendingAction()
    }
  }, [pendingAction])
  const [showImport,    setShowImport]    = useState(false)
  const [editEarning,     setEditEarning]     = useState<Earning | null>(null)
  const [showEditEarning, setShowEditEarning] = useState(false)
  const [selectedMonth,   setSelectedMonth]   = useState(currentMonthKey)
  const [filters,         setFilters]         = useState<ExpenseFilters>({})
  const deleteConfirm = useDeleteConfirm()

  const { data: months = [] } = useQuery({
    queryKey: ['earning-months'],
    queryFn:  getEarningMonths,
    staleTime: 1000 * 60 * 5,
  })

  const [selYear, selMonth] = selectedMonth.split('-').map(Number)
  const firstDay = `${selectedMonth}-01`
  const lastDay  = `${selectedMonth}-${new Date(selYear, selMonth, 0).getDate()}`

  const { data, isLoading } = useEarnings({
    limit:       100,
    offset:      0,
    date_from:   firstDay,
    date_to:     lastDay,
    category_id: filters.category_id,
    currency_id: filters.currency_id,
  })

  const earnings = (data?.data ?? [])
  const deleteEarning                  = useDeleteEarning()
  const { data: categories = [] }     = useCategories('income')
  const { data: currencies  = [] }    = useCurrencies()

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const curMap = Object.fromEntries(currencies.map(c => [c.id, c]))

  const total        = earnings.reduce((s, e) => s + Number(e.amount_mxn ?? e.amount), 0)
  const recurringTotal = earnings.filter(e => e.is_recurring).reduce((s, e) => s + Number(e.amount_mxn ?? e.amount), 0)
  const oneTimeTotal   = total - recurringTotal
  const recCount       = earnings.filter(e => e.is_recurring).length
  const oneTimeCount   = earnings.length - recCount

  const isCurrentMonthSelected = selectedMonth === currentMonthKey

  // Date grouping for mobile
  const byDate = earnings.reduce((map, e) => {
    if (!map[e.date]) map[e.date] = []
    map[e.date].push(e)
    return map
  }, {} as Record<string, typeof earnings>)
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Page header (desktop only) ───────────────────────────── */}
        <div className="hidden sm:flex sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
              Earnings
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
              <span className="font-mono" style={{ color: 'var(--positive)', fontWeight: 600 }}>+{formatMXN(total)}</span>
              {' '}received across {earnings.length} entries
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <MonthPicker months={months} selectedKey={selectedMonth} onSelect={key => setSelectedMonth(key)} type="income" />
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={13} /> Import
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus size={13} /> Add Earning
            </Button>
          </div>
        </div>

        {/* ── Stat strip (desktop only) ────────────────────────────── */}
        <div className="hidden sm:grid sm:grid-cols-4" style={{ gap: 12 }}>
          {([
            { k: 'Received',   v: formatMXN(total),        sub: selectedMonth,                    color: 'var(--positive)' },
            { k: 'Recurring',  v: formatMXN(recurringTotal), sub: `${recCount} active rules`,      color: undefined },
            { k: 'One-time',   v: formatMXN(oneTimeTotal),   sub: `${oneTimeCount} entries`,       color: undefined },
            { k: 'vs last mo', v: '—',                        sub: 'No prior month data',           color: undefined },
          ] as { k: string; v: string; sub: string; color: string | undefined }[]).map((s, i) => (
            <div key={i} className="s-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.k}</div>
              <div className="font-mono" style={{ fontSize: 19, fontWeight: 600, color: s.color ?? 'var(--text)', marginTop: 4 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs + filter (desktop only) ─────────────────────────── */}
        <div className="hidden sm:flex sm:items-center sm:justify-between flex-wrap gap-3">
          <SegmentedControl
            tabs={[{ id: 'transactions', label: 'Transactions' }, { id: 'rules', label: 'Rules' }]}
            active={tab}
            onChange={v => setTab(v as 'transactions' | 'rules')}
          />
          {tab === 'transactions' && (
            <FilterBar
              categories={categories}
              currencies={currencies}
              onFilter={f => {
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

        {/* ── Content ─────────────────────────────────────────────── */}
        {tab === 'rules' ? (
          <Card padding={false}><RulesTab /></Card>
        ) : isLoading ? (
          <Card padding={false}><TableSkeleton rows={8} /></Card>
        ) : earnings.length === 0 ? (
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
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--positive-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <TrendingUp size={22} style={{ color: 'var(--positive)' }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No earnings this month</h3>
                <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Try a different month or add one</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}><Upload size={13}/> Import</Button>
                  <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Earning</Button>
                </div>
              </div>
            </div>
            {/* Desktop empty */}
            <div className="desktop-table">
              <Card padding={false}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--positive-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <TrendingUp size={22} style={{ color: 'var(--positive)' }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No earnings yet</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Add one manually or import from CSV/JSON</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}><Upload size={13}/> Import</Button>
                    <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13}/> Add Earning</Button>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* ── Mobile layout ─────────────────────────────────────── */}
            <div className="mobile-list">
              {/* Hero card */}
              <div style={{
                padding: 18, borderRadius: 14, marginBottom: 12,
                background: 'linear-gradient(135deg, var(--positive), #0f5e3a)',
                color: 'white',
              }}>
                <div style={{ fontSize: 10.5, opacity: 0.85, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Received this month</div>
                <div className="font-mono" style={{ fontSize: 30, fontWeight: 600, marginTop: 6, letterSpacing: '-0.02em' }}>+{formatMXN(total)}</div>
                <div style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4 }}>{earnings.length} transactions · {isCurrentMonthSelected ? 'current period' : selectedMonth}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                  <div>
                    <div style={{ fontSize: 9.5, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recurring</div>
                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{formatMXN(recurringTotal)}</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <div style={{ fontSize: 9.5, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>One-time</div>
                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{formatMXN(oneTimeTotal)}</div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
                  <div>
                    <div style={{ fontSize: 9.5, opacity: 0.7, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Entries</div>
                    <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{earnings.length}</div>
                  </div>
                </div>
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

              {/* Grouped list by date */}
              {sortedDates.map(date => {
                const dayExps = byDate[date]
                const dayTotal = dayExps.reduce((s, e) => s + Number(e.amount_mxn ?? e.amount), 0)
                return (
                  <div key={date} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{formatDate(date)}</div>
                      <div className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--positive)' }}>+{formatMXN(dayTotal)}</div>
                    </div>
                    <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
                      {dayExps.map((e, i) => {
                        const cur = curMap[e.currency_id]
                        return (
                          <div
                            key={e.id}
                            onClick={() => { setEditEarning(e); setShowEditEarning(true) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '12px 14px',
                              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{
                              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                              background: 'var(--positive-soft)', color: 'var(--positive)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <TrendingUp size={15} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {e.notes ?? 'Earning'}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                                {formatDate(e.date)}
                                {e.is_recurring && (
                                  <span style={{ fontSize: 9, padding: '1px 5px', background: 'var(--info-soft)', color: 'var(--info)', borderRadius: 3, fontWeight: 600, letterSpacing: '0.04em' }}>RECURRING</span>
                                )}
                              </div>
                            </div>
                            <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--positive)', flexShrink: 0 }}>
                              +{cur?.symbol ?? '$'}{Number(e.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              onClick={async (ev) => { ev.stopPropagation(); if (!confirm('Delete this earning?')) return; await deleteEarning.mutateAsync(e.id) }}
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
                          <th key={i} style={{ padding: '10px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: i >= 3 && i < 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map(e => {
                        const cat = catMap[e.category_id ?? '']
                        const cur = curMap[e.currency_id]
                        return (
                          <Fragment key={e.id}>
                            <tr
                              style={{ borderBottom: 'var(--card-border)', cursor: 'pointer', transition: 'background 120ms ease' }}
                              onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--surface-alt)')}
                              onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                              onClick={() => { setEditEarning(e); setShowEditEarning(true) }}
                            >
                              <td style={{ padding: '11px 16px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }} className="font-mono">{formatDate(e.date)}</td>
                              <td style={{ padding: '11px 16px' }}>
                                {cat ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text)' }}>{cat.name}</span>
                                  </span>
                                ) : <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>Uncategorized</span>}
                              </td>
                              <td style={{ padding: '11px 16px', color: 'var(--text-dim)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {e.notes ?? <span style={{ color: 'var(--text-mute)' }}>—</span>}
                              </td>
                              <td style={{ padding: '11px 16px', textAlign: 'right' }} className="font-mono">
                                <span style={{ fontWeight: 600, color: 'var(--positive)' }}>
                                  +{cur?.symbol ?? ''}{Number(e.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td style={{ padding: '11px 16px', textAlign: 'right', color: 'var(--text-mute)', fontSize: 11.5 }} className="font-mono">
                                {formatMXN(e.amount_mxn)}
                              </td>
                              <td style={{ padding: '11px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                  {e.is_recurring && <Badge variant="info">↻</Badge>}
                                  <button
                                    onClick={ev => { ev.stopPropagation(); deleteConfirm.ask(e.id) }}
                                    style={{ padding: 5, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-mute)', cursor: 'pointer', display: 'flex', transition: 'all 120ms ease' }}
                                    onMouseEnter={ev => { ev.currentTarget.style.color = 'var(--negative)'; ev.currentTarget.style.background = 'var(--negative-soft)' }}
                                    onMouseLeave={ev => { ev.currentTarget.style.color = 'var(--text-mute)'; ev.currentTarget.style.background = 'transparent' }}
                                    title="Delete earning"
                                  ><Trash size={13} /></button>
                                </div>
                              </td>
                            </tr>
                            {deleteConfirm.confirmingId === e.id && (
                              <tr><td colSpan={6} style={{ padding: '0 8px 4px' }}>
                                <ConfirmRow
                                  label={`Delete "${e.notes ?? 'this earning'}"?`}
                                  loading={deleteEarning.isPending}
                                  onConfirm={async () => { setShowEditEarning(false); setEditEarning(null); await deleteEarning.mutateAsync(e.id); deleteConfirm.clear() }}
                                  onCancel={deleteConfirm.cancel}
                                />
                              </td></tr>
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Earning">
        <EarningForm onClose={() => { setShowAdd(false); setOpenWithRecurring(false) }} initialRecurring={openWithRecurring} />
      </Modal>
      <EditEarningModal
        earning={editEarning}
        open={showEditEarning}
        onClose={() => { setShowEditEarning(false); setEditEarning(null) }}
        categories={categories}
        currencies={currencies}
      />
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        type="income"
        categories={categories}
        currencies={currencies}
        onImport={importEarnings}
      />
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--negative)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Danger Zone
        </p>
        <DangerZone
          label="Delete all earnings"
          description="Permanently deletes all your earning records"
          onConfirm={async () => {
            const { deleteAllEarnings } = await import('../../api/goals')
            await deleteAllEarnings()
            qc.invalidateQueries({ queryKey: QUERY_KEYS.earnings })
            qc.invalidateQueries({ queryKey: QUERY_KEYS.dashboard })
          }}
        />
      </div>
    </>
  )
}