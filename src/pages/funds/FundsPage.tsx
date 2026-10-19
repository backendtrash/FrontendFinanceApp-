import { useState, useEffect } from 'react'
import {
  PiggyBank, Plus, Pencil, Wallet, Check, AlertTriangle, CalendarClock,
} from 'lucide-react'
import {
  useSinkingFunds, useCreateSinkingFund, useUpdateSinkingFund,
  useDeleteSinkingFund, useContributeToFund, usePayoutFund,
  useCurrencies,
} from '../../hooks/useQueries'
import Button         from '../../components/ui/Button'
import Input          from '../../components/ui/Input'
import Modal          from '../../components/ui/Modal'
import Badge          from '../../components/ui/Badge'
import Card           from '../../components/ui/Card'
import ConfirmRow     from '../../components/ui/ConfirmRow'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useDeleteConfirm }      from '../../hooks/useDeleteConfirm'
import { formatMXN, formatDate, todayISO } from '../../utils/formatters'
import { useAddSheetStore }      from '../../store/addSheetStore'
import { getApiErrorMessage }    from '../../utils/apiError'
import type {
  SinkingFund, SinkingFundCreate, SinkingFundMode, FundCadence, RepeatInterval,
} from '../../types/index'

// ── Style A canonical palette — earthy jewel tones matching design tokens ──
const FUND_COLORS = [
  '#702963', '#1f7a4d', '#a8651b', '#2563a0',
  '#7a5191', '#3a8a73', '#bf6f2e', '#525a68',
]

function getFundColor(fundId: string, all: SinkingFund[]): string {
  const sorted = [...all].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const idx    = sorted.findIndex(f => f.id === fundId)
  return FUND_COLORS[Math.max(idx, 0) % FUND_COLORS.length]
}

const STATUS_META: Record<string, { label: string; variant: 'positive' | 'negative' | 'warning' | 'info' | 'accent' | 'muted' }> = {
  on_track: { label: 'On track',    variant: 'info'     },
  ahead:    { label: 'Ahead',       variant: 'positive' },
  behind:   { label: 'Behind',      variant: 'warning'  },
  funded:   { label: 'Fully funded',variant: 'positive' },
  overdue:  { label: 'Overdue',     variant: 'negative' },
  paid:     { label: 'Paid',        variant: 'muted'    },
}

const CADENCE_LABEL: Record<FundCadence, string> = {
  weekly:  'week',
  monthly: 'month',
}

const REPEAT_OPTIONS: { value: RepeatInterval; label: string }[] = [
  { value: 'none',       label: "Doesn't repeat" },
  { value: 'monthly',    label: 'Every month'    },
  { value: 'quarterly',  label: 'Every 3 months' },
  { value: 'semiannual', label: 'Every 6 months' },
  { value: 'annual',     label: 'Every year'     },
]

const selectClass =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500'

// ── Create form ────────────────────────────────────────────────────────────
export function FundForm({ onClose }: { onClose: () => void }) {
  const { data: currencies = [] } = useCurrencies()
  const createFund = useCreateSinkingFund()
  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''

  const [mode,        setMode]        = useState<SinkingFundMode>('target_by_date')
  const [name,        setName]        = useState('')
  const [amount,      setAmount]      = useState('')
  const [currency,    setCurrency]    = useState(mxnId)
  const [dueDate,     setDueDate]     = useState('')
  const [perPeriod,   setPerPeriod]   = useState('')
  const [cadence,     setCadence]     = useState<FundCadence>('monthly')
  const [repeat,      setRepeat]      = useState<RepeatInterval>('none')
  const [startAmount, setStartAmount] = useState('')
  const [notes,       setNotes]       = useState('')
  const [error,       setError]       = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Fund name is required'); return }
    if (mode === 'target_by_date') {
      if (!amount || parseFloat(amount) <= 0) { setError('Target amount is required'); return }
      if (!dueDate) { setError('A due date is required to work out what to set aside'); return }
    } else if (!perPeriod || parseFloat(perPeriod) <= 0) {
      setError('Enter how much you want to set aside each period'); return
    }
    if (repeat !== 'none' && !dueDate) {
      setError('A repeating fund needs a due date to roll forward from'); return
    }

    const data: SinkingFundCreate = {
      name:    name.trim(),
      mode,
      cadence,
      repeat_interval: repeat,
      notes:   notes.trim() || undefined,
      currency_id: currency || mxnId,
      start_amount: startAmount ? parseFloat(startAmount) : undefined,
    }
    if (amount)    data.target_amount       = parseFloat(amount)
    if (dueDate)   data.due_date            = dueDate
    if (perPeriod) data.contribution_amount = parseFloat(perPeriod)

    try { await createFund.mutateAsync(data); onClose() }
    catch (e: unknown) { setError(getApiErrorMessage(e, 'Failed to create fund')) }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">How do you want to save?</label>
        <div className="flex gap-2">
          {([
            { value: 'target_by_date',   label: '🎯 By a date',   desc: "We'll work out the amount" },
            { value: 'fixed_per_period', label: '💰 Fixed amount', desc: "We'll work out the date"   },
          ] as { value: SinkingFundMode; label: string; desc: string }[]).map(t => (
            <button key={t.value} type="button" onClick={() => setMode(t.value)}
              className={`flex-1 p-3 text-left rounded-lg border transition-colors ${
                mode === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <p className={`text-xs font-medium ${mode === t.value ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Input label="What are you saving for?" placeholder="e.g. Car insurance, Holiday…"
        value={name} onChange={e => setName(e.target.value)} />

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label={mode === 'target_by_date' ? 'Target Amount' : 'Target Amount (optional)'}
            type="number" step="100" min="0" placeholder="12000"
            value={amount} onChange={e => setAmount(e.target.value)}
            hint={mode === 'fixed_per_period' ? 'Leave blank for an open-ended fund' : undefined}
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <select className={selectClass} value={currency || mxnId}
            onChange={e => setCurrency(e.target.value)}>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      {mode === 'fixed_per_period' && (
        <Input label="Set aside each period" type="number" step="50" min="0" placeholder="500"
          value={perPeriod} onChange={e => setPerPeriod(e.target.value)} />
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Set aside every</label>
          <select className={selectClass} value={cadence}
            onChange={e => setCadence(e.target.value as FundCadence)}>
            <option value="weekly">Week</option>
            <option value="monthly">Month</option>
          </select>
        </div>
        <div className="flex-1">
          <Input
            label={mode === 'target_by_date' ? 'Needed by' : 'Needed by (optional)'}
            type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Repeats</label>
        <select className={selectClass} value={repeat}
          onChange={e => setRepeat(e.target.value as RepeatInterval)}>
          {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Annual bills like insurance roll into a fresh cycle once you pay them.
        </p>
      </div>

      <Input label="Already saved (optional)" type="number" step="100" min="0"
        placeholder="Amount you've set aside already"
        value={startAmount} onChange={e => setStartAmount(e.target.value)}
        hint="Counted toward the fund without touching your balance" />

      <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
        <div className="flex items-center gap-1.5">
          <PiggyBank size={13} className="text-blue-600" />
          <p className="text-xs text-blue-700 font-medium">How the money moves</p>
        </div>
        <p className="text-xs text-blue-600 mt-0.5">
          Setting money aside records a real expense, so your balance drops as you save.
          When the bill arrives you pay it from the fund and your balance isn't touched again.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={createFund.isPending} onClick={handleSubmit}>
          Create Fund
        </Button>
      </div>
    </div>
  )
}

// ── Edit form ──────────────────────────────────────────────────────────────
function FundEditForm({ fund, onClose }: { fund: SinkingFund; onClose: () => void }) {
  const updateFund = useUpdateSinkingFund()
  const [name,      setName]      = useState(fund.name ?? '')
  const [amount,    setAmount]    = useState(String(fund.target_amount ?? ''))
  const [dueDate,   setDueDate]   = useState(fund.due_date ?? '')
  const [perPeriod, setPerPeriod] = useState(String(fund.contribution_amount ?? ''))
  const [cadence,   setCadence]   = useState<FundCadence>(fund.cadence)
  const [repeat,    setRepeat]    = useState<RepeatInterval>(fund.repeat_interval)
  const [notes,     setNotes]     = useState(fund.notes ?? '')
  const [error,     setError]     = useState('')

  // Nothing derived is stored, so changing these just recomputes on read.
  const newTarget = parseFloat(amount || '0')
  const overshoot = newTarget > 0 && newTarget < Number(fund.balance_mxn ?? 0)

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Fund name is required'); return }
    try {
      const patch: Partial<SinkingFundCreate> = {
        name: name.trim(),
        notes: notes.trim() || undefined,
        cadence,
        repeat_interval: repeat,
      }
      if (amount)    patch.target_amount       = parseFloat(amount)
      if (dueDate)   patch.due_date            = dueDate
      if (perPeriod) patch.contribution_amount = parseFloat(perPeriod)
      await updateFund.mutateAsync({ id: fund.id, data: patch })
      onClose()
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Failed to update fund'))
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Fund Name" value={name} onChange={e => setName(e.target.value)} />
      <Input label="Target Amount" type="number" step="100" min="0"
        value={amount} onChange={e => setAmount(e.target.value)} />
      {overshoot && (
        <p className="text-xs" style={{ color: 'var(--warning)' }}>
          That's below the {formatMXN(Number(fund.balance_mxn))} already in this fund —
          it'll show as fully funded with a surplus.
        </p>
      )}
      {fund.mode === 'fixed_per_period' && (
        <Input label="Set aside each period" type="number" step="50" min="0"
          value={perPeriod} onChange={e => setPerPeriod(e.target.value)} />
      )}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 mb-1">Set aside every</label>
          <select className={selectClass} value={cadence}
            onChange={e => setCadence(e.target.value as FundCadence)}>
            <option value="weekly">Week</option>
            <option value="monthly">Month</option>
          </select>
        </div>
        <div className="flex-1">
          <Input label="Needed by" type="date" value={dueDate}
            onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Repeats</label>
        <select className={selectClass} value={repeat}
          onChange={e => setRepeat(e.target.value as RepeatInterval)}>
          {REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={updateFund.isPending} onClick={handleSubmit}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

// ── Set aside modal ────────────────────────────────────────────────────────
function SetAsideModal({ open, onClose, fund }: {
  open: boolean; onClose: () => void; fund: SinkingFund | null
}) {
  const contribute = useContributeToFund()
  const [amount, setAmount] = useState('')
  const [date,   setDate]   = useState(todayISO())
  const [notes,  setNotes]  = useState('')
  const [error,  setError]  = useState('')

  useEffect(() => {
    if (fund) {
      setAmount(String(Number(fund.set_aside_this_period ?? 0) || ''))
      setError('')
    }
  }, [fund])

  if (!fund) return null

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { setError('Amount must be greater than zero'); return }
    try {
      await contribute.mutateAsync({
        id: fund.id,
        data: { amount: parseFloat(amount), date, notes: notes || undefined },
      })
      setNotes(''); onClose()
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Failed to set money aside'))
    }
  }

  const pct = Math.min(Number(fund.pct_complete ?? 0), 100)

  return (
    <Modal open={open} onClose={onClose} title={`Set aside for "${fund.name}"`}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Records a real expense, so your balance drops now — the money is
          already gone by the time the bill arrives.
        </p>
        <Input label="Amount (MXN)" type="number" step="50" min="0" placeholder="0.00"
          value={amount} onChange={e => setAmount(e.target.value)} />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Input label="Notes (optional)" placeholder={`Set aside · ${fund.name}`}
          value={notes} onChange={e => setNotes(e.target.value)} />

        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>In this fund</span>
            <span className="font-medium font-mono">{Number(fund.pct_complete ?? 0).toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${pct}%`, background: 'var(--accent)' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
            <span>{formatMXN(Number(fund.balance_mxn ?? 0))}</span>
            <span>{formatMXN(Number(fund.target_amount_mxn ?? 0))}</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={contribute.isPending} onClick={handleSubmit}>
            Set Aside
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Payout modal ───────────────────────────────────────────────────────────
function PayoutModal({ open, onClose, fund }: {
  open: boolean; onClose: () => void; fund: SinkingFund | null
}) {
  const payout = usePayoutFund()
  const [amount, setAmount] = useState('')
  const [date,   setDate]   = useState(todayISO())
  const [renew,  setRenew]  = useState(true)
  const [error,  setError]  = useState('')

  useEffect(() => {
    if (fund) {
      setAmount(String(Number(fund.target_amount_mxn ?? fund.balance_mxn ?? 0) || ''))
      setRenew(Boolean(fund.auto_renew))
      setError('')
    }
  }, [fund])

  if (!fund) return null

  const balance   = Number(fund.balance_mxn ?? 0)
  const requested = parseFloat(amount || '0')
  const shortfall = Math.max(0, requested - balance)
  const repeats   = fund.repeat_interval !== 'none'

  const handleSubmit = async () => {
    if (!requested || requested <= 0) { setError('Amount must be greater than zero'); return }
    try {
      await payout.mutateAsync({
        id: fund.id,
        data: { amount: requested, paid_on: date, renew: repeats ? renew : false },
      })
      onClose()
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Failed to record payout'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Pay "${fund.name}" from the fund`}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          This doesn't touch your balance — the money already left as you saved it.
        </p>
        <Input label="Bill amount (MXN)" type="number" step="50" min="0"
          value={amount} onChange={e => setAmount(e.target.value)} />
        <Input label="Paid on" type="date" value={date} onChange={e => setDate(e.target.value)} />

        <div className="p-3 rounded-xl" style={{ background: 'var(--surface-alt)' }}>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-dim)' }}>
            <span>In the fund</span>
            <span className="font-mono">{formatMXN(balance)}</span>
          </div>
          {shortfall > 0 && (
            <div className="flex items-start gap-1.5 mt-2">
              <AlertTriangle size={13} style={{ color: 'var(--warning)', marginTop: 1 }} />
              <p className="text-xs" style={{ color: 'var(--warning)' }}>
                The fund is {formatMXN(shortfall)} short. We'll add that as a top-up
                expense, so only the {formatMXN(shortfall)} that actually leaves your
                pocket hits your balance.
              </p>
            </div>
          )}
        </div>

        {repeats && (
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" checked={renew} onChange={e => setRenew(e.target.checked)}
              className="mt-0.5" />
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Start the next cycle — rolls the due date forward and carries any
              surplus into it.
            </span>
          </label>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={payout.isPending} onClick={handleSubmit}>
            Record Payment
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Fund card ──────────────────────────────────────────────────────────────
function FundCard({ fund, color, onSetAside, onPayout, onEdit, confirming, onAskDelete, onCancelDelete, onConfirmDelete, deleting }: {
  fund: SinkingFund
  color: string
  onSetAside: () => void
  onPayout: () => void
  onEdit: () => void
  confirming: boolean
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  deleting: boolean
}) {
  const balance   = Number(fund.balance_mxn ?? 0)
  const target    = Number(fund.target_amount_mxn ?? 0)
  const pct       = target > 0 ? Math.min((balance / target) * 100, 100) : 0
  const perPeriod = Number(fund.set_aside_this_period ?? 0)
  const meta      = STATUS_META[fund.status] ?? STATUS_META.on_track

  return (
    <div style={{
      padding: 16, background: 'var(--surface)', border: 'var(--card-border)',
      borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9, background: color + '22', color,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <PiggyBank size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {fund.name}
          </p>
          <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            {perPeriod > 0
              ? <>{formatMXN(perPeriod)} / {CADENCE_LABEL[fund.cadence]}</>
              : 'Nothing due right now'}
            {fund.due_date && <> · by {formatDate(fund.due_date)}</>}
          </p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span className="font-mono" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {formatMXN(balance)}
          </span>
          {target > 0 && (
            <span className="font-mono" style={{ fontSize: 11.5, color: 'var(--text-mute)', alignSelf: 'flex-end' }}>
              of {formatMXN(target)}
            </span>
          )}
        </div>
        <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width .3s' }} />
        </div>
        {fund.projected_completion && fund.status !== 'paid' && fund.status !== 'funded' && (
          <p style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CalendarClock size={11} /> On track for {formatDate(fund.projected_completion)}
          </p>
        )}
        {fund.has_ledger_warning && (
          <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={11} /> A contribution was changed after this fund paid out
          </p>
        )}
      </div>

      {confirming ? (
        <ConfirmRow
          label={`Delete "${fund.name}"? Past set-asides stay in your expenses.`}
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
          loading={deleting}
        />
      ) : (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="sm" onClick={onSetAside} disabled={fund.status === 'paid'}>
            <Wallet size={13} /> Set aside
          </Button>
          <Button size="sm" variant="secondary" onClick={onPayout}
            disabled={Number(fund.balance_mxn ?? 0) <= 0 && fund.status !== 'funded'}>
            <Check size={13} /> Pay bill
          </Button>
          <div style={{ flex: 1 }} />
          <button onClick={onEdit} title="Edit"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', padding: 4 }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mute)' }}>
            <Pencil size={13} />
          </button>
          <button onClick={onAskDelete} title="Delete"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mute)', fontSize: 14, padding: '0 4px' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--negative)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-mute)' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function FundsPage() {
  const [showAdd,     setShowAdd]     = useState(false)
  const [editFund,    setEditFund]    = useState<SinkingFund | null>(null)
  const [setAside,    setSetAside]    = useState<SinkingFund | null>(null)
  const [payoutFund,  setPayoutFund]  = useState<SinkingFund | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const { data: funds = [], isLoading } = useSinkingFunds()
  const deleteFund = useDeleteSinkingFund()
  const { confirmingId, ask, cancel } = useDeleteConfirm()

  // FAB pending-action bridge
  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'fund:open-add') { setShowAdd(true); clearPendingAction() }
    else if (pendingAction === 'fund:open-set-aside') {
      const next = funds.find(f => Number(f.set_aside_this_period ?? 0) > 0)
      if (next) setSetAside(next)
      clearPendingAction()
    } else if (pendingAction === 'fund:open-payout') {
      const ready = funds.find(f => Number(f.balance_mxn ?? 0) > 0)
      if (ready) setPayoutFund(ready)
      clearPendingAction()
    }
  }, [pendingAction, funds])

  const handleDelete = async (fund: SinkingFund) => {
    setDeleteError('')
    try {
      await deleteFund.mutateAsync({ id: fund.id })
      cancel()
    } catch (e: any) {
      if (e?.response?.status === 409) {
        // The fund still holds money — archiving keeps the history intact.
        try {
          await deleteFund.mutateAsync({ id: fund.id, onBalance: 'keep' })
          cancel()
        } catch (inner: unknown) {
          setDeleteError(getApiErrorMessage(inner, 'Failed to delete fund'))
        }
      } else {
        setDeleteError(getApiErrorMessage(e, 'Failed to delete fund'))
      }
    }
  }

  const totalSaved  = funds.reduce((s, f) => s + Number(f.balance_mxn ?? 0), 0)
  const dueNow      = funds.reduce((s, f) => s + Number(f.set_aside_this_period ?? 0), 0)
  const overdueCnt  = funds.filter(f => f.is_overdue).length

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Desktop header */}
        <div className="hidden sm:flex sm:items-center sm:justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
              Sinking Funds
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
              {funds.length} {funds.length === 1 ? 'fund' : 'funds'} · {formatMXN(totalSaved)} set aside
              {overdueCnt > 0 && <> · {overdueCnt} overdue</>}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Fund</Button>
        </div>

        {/* Mobile header */}
        <div className="flex sm:hidden items-center justify-between">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
            Sinking Funds
          </h1>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /></Button>
        </div>

        {isLoading && (
          <div className="py-16 flex justify-center"><LoadingSpinner text="Loading funds..." /></div>
        )}

        {!isLoading && funds.length === 0 && (
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <PiggyBank size={22} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                No sinking funds yet
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6, maxWidth: 420 }}>
                Save a little each week toward the big irregular bills — car insurance,
                a holiday, tuition — so they never land as one brutal expense.
              </p>
              <div style={{ marginTop: 14 }}>
                <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Fund</Button>
              </div>
            </div>
          </Card>
        )}

        {!isLoading && funds.length > 0 && (
          <>
            {/* Stat strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {[
                { k: 'Total set aside', v: formatMXN(totalSaved), color: 'var(--positive)' },
                { k: 'Due this period',  v: formatMXN(dueNow),     color: 'var(--info)'     },
                { k: 'Overdue',          v: String(overdueCnt),    color: overdueCnt > 0 ? 'var(--negative)' : 'var(--text)' },
              ].map((s, i) => (
                <div key={i} className="s-card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {s.k}
                  </div>
                  <div className="font-mono" style={{ fontSize: 19, fontWeight: 600, color: s.color, marginTop: 4 }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>

            {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
              {funds.map(f => (
                <FundCard
                  key={f.id}
                  fund={f}
                  color={getFundColor(f.id, funds)}
                  onSetAside={() => setSetAside(f)}
                  onPayout={() => setPayoutFund(f)}
                  onEdit={() => setEditFund(f)}
                  confirming={confirmingId === f.id}
                  onAskDelete={() => ask(f.id)}
                  onCancelDelete={cancel}
                  onConfirmDelete={() => handleDelete(f)}
                  deleting={deleteFund.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Sinking Fund" size="lg">
        <FundForm onClose={() => setShowAdd(false)} />
      </Modal>
      <Modal open={editFund !== null} onClose={() => setEditFund(null)} title="Edit Fund">
        {editFund && <FundEditForm fund={editFund} onClose={() => setEditFund(null)} />}
      </Modal>
      <SetAsideModal open={setAside !== null} onClose={() => setSetAside(null)} fund={setAside} />
      <PayoutModal   open={payoutFund !== null} onClose={() => setPayoutFund(null)} fund={payoutFund} />
    </>
  )
}
