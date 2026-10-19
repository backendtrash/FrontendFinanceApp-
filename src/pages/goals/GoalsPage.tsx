import { useState, useEffect } from 'react'
import { Trophy, TrendingUp, Plus, Lightbulb, PlusCircle, Pencil, Star } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import {
  useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useCurrencies, useCreateExpense,
} from '../../hooks/useQueries'
import Button            from '../../components/ui/Button'
import Input             from '../../components/ui/Input'
import Modal             from '../../components/ui/Modal'
import LoadingSpinner    from '../../components/ui/LoadingSpinner'
import Card              from '../../components/ui/Card'
import { formatMXN, formatDate } from '../../utils/formatters'
import { useAddSheetStore }      from '../../store/addSheetStore'
import { todayISO } from '../../utils/formatters'
import type { GoalCreate, GoalType, Goal } from '../../types/index'

// ── Goal color palette ────────────────────────────────────────────────────
const GOAL_COLORS = ['#702963','#1f7a4d','#a8651b','#2563a0','#7a5191','#3a8a73','#bf6f2e','#525a68']

function getGoalColor(goalId: string, allGoals: Goal[]): string {
  const sorted = [...allGoals].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const idx    = sorted.findIndex(g => g.id === goalId)
  return GOAL_COLORS[Math.max(idx, 0) % GOAL_COLORS.length]
}

// ── Savings velocity sparkline data ───────────────────────────────────────
function buildSparkline(goal: Goal): { v: number }[] {
  const total   = Number(goal.current_savings || 0)
  const created = new Date(goal.created_at)
  const now     = new Date()
  const months  = Math.max(2, Math.min(6, Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30))))
  if (total === 0) return Array.from({ length: months }, () => ({ v: 0 }))
  const avg = total / months
  return Array.from({ length: months }, (_, i) => ({
    v: Math.max(0, Math.round(avg * (0.75 + 0.5 * (i / Math.max(months - 1, 1)) + Math.sin(i * 1.3) * 0.12))),
  }))
}

function sparkMonths(goal: Goal): string[] {
  const created = new Date(goal.created_at)
  const months  = Math.max(2, Math.min(6, Math.round((new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30))))
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(created)
    d.setMonth(created.getMonth() + i)
    return d.toLocaleDateString('en-US', { month: 'short' })
  })
}

// ── Goal Edit Form ─────────────────────────────────────────────────────────
function GoalEditForm({ goal, onClose }: { goal: any; onClose: () => void }) {
  const updateGoal = useUpdateGoal()
  const [name,     setName]     = useState<string>(goal.name ?? '')
  const [notes,    setNotes]    = useState<string>(goal.notes ?? '')
  const [amount,   setAmount]   = useState<string>(String(goal.target_amount ?? ''))
  const [deadline, setDeadline] = useState<string>(goal.deadline ?? '')
  const [rate,     setRate]     = useState<string>(String(goal.target_rate_pct ?? ''))
  const [error,    setError]    = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Goal name is required'); return }
    try {
      const patch: Record<string, any> = { name: name.trim(), notes: notes.trim() || undefined }
      if (goal.type === 'fixed_amount') {
        if (amount) patch.target_amount = parseFloat(amount)
        if (deadline) patch.deadline = deadline
      } else {
        if (rate) patch.target_rate_pct = parseFloat(rate)
      }
      await updateGoal.mutateAsync({ id: goal.id, data: patch })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update goal')
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Goal Name" value={name} onChange={e => setName(e.target.value)} />
      {goal.type === 'fixed_amount' && (
        <>
          <Input label="Target Amount" type="number" step="100" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
          <Input label="Target Date (optional)" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
        </>
      )}
      {goal.type === 'monthly_rate' && (
        <Input label="Target Savings Rate (%)" type="number" step="1" min="1" max="100" value={rate} onChange={e => setRate(e.target.value)} />
      )}
      <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={updateGoal.isPending} onClick={handleSubmit}>Save Changes</Button>
      </div>
    </div>
  )
}

// ── Goal Form ──────────────────────────────────────────────────────────────
export function GoalForm({ onClose }: { onClose: () => void }) {
  const { data: currencies = [] } = useCurrencies()
  const createGoal                = useCreateGoal()
  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''

  const [type,        setType]        = useState<GoalType>('fixed_amount')
  const [name,        setName]        = useState('')
  const [amount,      setAmount]      = useState('')
  const [currency,    setCurrency]    = useState(mxnId)
  const [deadline,    setDeadline]    = useState('')
  const [rate,        setRate]        = useState('')
  const [notes,       setNotes]       = useState('')
  const [startAmount, setStartAmount] = useState('')
  const [error,       setError]       = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Goal name is required'); return }
    if (type === 'fixed_amount' && (!amount || parseFloat(amount) <= 0)) { setError('Target amount is required'); return }
    if (type === 'monthly_rate' && (!rate || parseFloat(rate) <= 0)) { setError('Target savings rate is required'); return }
    const data: GoalCreate = { name: name.trim(), type, notes: notes.trim() || undefined }
    if (type === 'fixed_amount') {
      data.target_amount = parseFloat(amount); data.currency_id = currency || mxnId
      data.deadline = deadline || undefined; data.start_amount = startAmount ? parseFloat(startAmount) : undefined
    } else { data.target_rate_pct = parseFloat(rate) }
    try { await createGoal.mutateAsync(data); onClose() }
    catch (e: any) { setError(e?.response?.data?.detail || 'Failed to create goal') }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Goal Type</label>
        <div className="flex gap-2">
          {([
            { value: 'fixed_amount', label: '🏆 Fixed Amount', desc: 'Save a specific amount by a date' },
            { value: 'monthly_rate', label: '📈 Monthly Rate', desc: 'Maintain a savings rate each month' },
          ] as { value: GoalType; label: string; desc: string }[]).map(t => (
            <button key={t.value} type="button" onClick={() => setType(t.value)}
              className={`flex-1 p-3 text-left rounded-lg border transition-colors ${type === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <p className={`text-xs font-medium ${type === t.value ? 'text-blue-700' : 'text-gray-700'}`}>{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <Input label="Goal Name" placeholder="e.g. Emergency Fund, New Car..." value={name} onChange={e => setName(e.target.value)} />
      {type === 'fixed_amount' && (
        <>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Target Amount" type="number" step="100" min="0" placeholder="50000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={currency || mxnId} onChange={e => setCurrency(e.target.value)}>
                {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
              </select>
            </div>
          </div>
          <Input label="Target Date (optional)" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          <Input label="Starting Amount (optional)" type="number" step="100" min="0" placeholder="Amount already saved" value={startAmount} onChange={e => setStartAmount(e.target.value)} hint="We'll record this as your first contribution" />
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-1.5"><Lightbulb size={13} className="text-blue-600" /><p className="text-xs text-blue-700 font-medium">Auto-category created</p></div>
            <p className="text-xs text-blue-600 mt-0.5">A "{name || 'Goal'} Savings" expense category will be created. Add expenses with that category to track contributions.</p>
          </div>
        </>
      )}
      {type === 'monthly_rate' && (
        <Input label="Target Savings Rate (%)" type="number" step="1" min="1" max="100" placeholder="20" value={rate} onChange={e => setRate(e.target.value)} hint="Percentage of monthly income to save" />
      )}
      <Input label="Notes (optional)" placeholder="Why this goal matters..." value={notes} onChange={e => setNotes(e.target.value)} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={createGoal.isPending} onClick={handleSubmit}>Create Goal</Button>
      </div>
    </div>
  )
}

// ── Contribute Modal ───────────────────────────────────────────────────────
function ContributeModal({ open, onClose, goal }: { open: boolean; onClose: () => void; goal: any }) {
  const createExpense             = useCreateExpense()
  const { data: currencies = [] } = useCurrencies()
  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''
  const [amount, setAmount] = useState('')
  const [date,   setDate]   = useState(todayISO())
  const [notes,  setNotes]  = useState('')
  const [error,  setError]  = useState('')

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { setError('Amount must be greater than zero'); return }
    if (!goal?.savings_category_id) { setError('This goal has no savings category'); return }
    try {
      await createExpense.mutateAsync({ amount: parseFloat(amount), currency_id: mxnId, category_id: goal.savings_category_id, date, notes: notes || `Contribution to ${goal.name}`, is_recurring: false })
      setAmount(''); setNotes(''); onClose()
    } catch (e: any) { setError(e?.response?.data?.detail || 'Failed to add contribution') }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Add to "${goal?.name}"`}>
      <div className="space-y-4">
        <p className="text-xs text-gray-500">Adds an expense to <span className="font-medium text-gray-700">{goal?.name} Savings</span> and counts toward your goal.</p>
        <Input label="Amount (MXN)" type="number" step="100" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Input label="Notes (optional)" placeholder={`Contribution to ${goal?.name}`} value={notes} onChange={e => setNotes(e.target.value)} />
        {goal && (
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5"><span>Current progress</span><span className="font-medium" style={{ color: '#702963' }}>{Number(goal.pct_complete ?? 0).toFixed(1)}%</span></div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(Number(goal.pct_complete ?? 0), 100)}%`, background: '#702963' }} /></div>
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>{formatMXN(Number(goal.current_savings ?? 0))}</span><span>{formatMXN(Number(goal.target_amount ?? 0))}</span></div>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" loading={createExpense.isPending} onClick={handleSubmit}>Add Contribution</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Featured Goal Card (web only) ──────────────────────────────────────────
function FeaturedGoalCard({ goal, color, onContribute, onEdit }: { goal: any; color: string; onContribute: () => void; onEdit: () => void }) {
  const current   = Number(goal.current_savings ?? 0)
  const target    = Number(goal.target_amount ?? 0)
  const pct       = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const remaining = Math.max(0, target - current)
  const spark     = buildSparkline(goal)
  const months    = sparkMonths(goal)
  const avg       = spark.length > 0 ? Math.round(spark.reduce((s, d) => s + d.v, 0) / spark.length) : 0
  const best      = Math.max(...spark.map(d => d.v), 0)

  return (
    <Card padding={false}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', minHeight: 220 }}>
        {/* Left */}
        <div style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
            <Star size={12} style={{ fill: 'var(--accent)', color: 'var(--accent)' }} /> Featured goal
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={onEdit} style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}><Pencil size={13} /></button>
            </div>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em', color: 'var(--text)' }}>{goal.name}</h2>
          {goal.notes && <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 16px' }}>{goal.notes}</p>}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div>
                <div className="font-mono" style={{ fontSize: 30, fontWeight: 600, color, letterSpacing: '-0.02em' }}>{formatMXN(current)}</div>
                <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>of {formatMXN(target)} saved</div>
              </div>
              <div className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{pct.toFixed(0)}%</div>
            </div>
            <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)` }} />
            </div>
            <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-mute)' }}>
              <span>{formatMXN(remaining)} to go</span>
              {goal.projected_completion && <span>Est. complete · {formatDate(goal.projected_completion)}</span>}
            </div>
          </div>
          {(goal as any).savings_category_id && (
            <button onClick={onContribute} className="s-btn s-btn-secondary" style={{ marginTop: 16, height: 30, padding: '0 12px', fontSize: 12 }}>
              <PlusCircle size={12} /> Contribute
            </button>
          )}
        </div>

        {/* Right: savings velocity */}
        <div style={{ background: 'var(--accent-soft)', padding: 28, borderLeft: 'var(--card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: 'var(--accent-ink)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Savings velocity</div>
          <div>
            <div style={{ height: 60 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#spark-grad)" dot={false} />
                  <Tooltip formatter={(v: any) => [formatMXN(Number(v)), 'Saved']} contentStyle={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 8, fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10.5, color: 'var(--text-dim)' }}>
              {months.map((m, i) => <span key={i}>{m}</span>)}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>
            Avg <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text)' }}>{formatMXN(avg)}</span>/mo
            {best > 0 && <> · best <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text)' }}>{formatMXN(best)}</span></>}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ── Compact Goal Card (web 2-col grid) ─────────────────────────────────────
function CompactGoalCard({ goal, color, onSetFeatured, onContribute, onEdit, onDelete }: {
  goal: any; color: string; onSetFeatured: () => void;
  onContribute: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const actionBtns = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {goal.type === 'fixed_amount' && (
        <button onClick={onSetFeatured} title="Set as featured"
          style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}><Star size={12} /></button>
      )}
      <button onClick={onEdit} style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}><Pencil size={12} /></button>
      <button onClick={onDelete} style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
    </div>
  )

  if (goal.type === 'monthly_rate') {
    const current   = Number(goal.current_rate_pct ?? 0)
    const target    = Number(goal.target_rate_pct  ?? 0)
    const onTrack   = goal.on_track
    const cappedPct = Math.min((current / Math.max(target, 1)) * 100, 100)
    return (
      <div style={{ padding: 18, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, background: onTrack ? 'var(--positive-soft)' : 'var(--negative-soft)', color: onTrack ? 'var(--positive)' : 'var(--negative)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={13} />
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{goal.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Rate target</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 4, background: onTrack ? 'var(--positive-soft)' : 'var(--negative-soft)', color: onTrack ? 'var(--positive)' : 'var(--negative)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{onTrack ? 'On track' : 'Off track'}</span>
            {actionBtns}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
          <div className="font-mono" style={{ fontSize: 24, fontWeight: 600, color: onTrack ? 'var(--positive)' : 'var(--negative)' }}>{current.toFixed(1)}%</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>target {target}%</div>
        </div>
        <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${cappedPct}%`, height: '100%', background: onTrack ? 'var(--positive)' : 'var(--negative)' }} />
        </div>
        {goal.notes && <p style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 8, fontStyle: 'italic' }}>{goal.notes}</p>}
      </div>
    )
  }

  const pct     = Number(goal.pct_complete ?? 0)
  const current = Number(goal.current_savings ?? 0)
  const target  = Number(goal.target_amount ?? 0)

  return (
    <div style={{ padding: 18, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 7, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trophy size={13} />
          </span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{goal.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Savings target</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{pct.toFixed(0)}%</span>
          {actionBtns}
        </div>
      </div>
      <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{formatMXN(current)}</div>
        <div style={{ fontSize: 11, color: 'var(--text-mute)' }}>of {formatMXN(target)}</div>
      </div>
      <div style={{ height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color }} />
      </div>
      <div className="font-mono" style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 6 }}>
        {formatMXN(Math.max(0, target - current))} to go
      </div>
      {(goal as any).savings_category_id && (
        <button onClick={onContribute} className="s-btn s-btn-secondary" style={{ marginTop: 10, height: 26, padding: '0 10px', fontSize: 11 }}>
          <PlusCircle size={11} /> Contribute
        </button>
      )}
    </div>
  )
}

// ── Goals Page ─────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const [showAdd,             setShowAdd]             = useState(false)
  const [goalPickerOpen,      setGoalPickerOpen]      = useState(false)
  const [fullyFundPickerOpen, setFullyFundPickerOpen] = useState(false)

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'goal:open-add') {
      setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'goal:open-contribute') {
      setGoalPickerOpen(true); clearPendingAction()
    } else if (pendingAction === 'goal:open-fully-fund') {
      setFullyFundPickerOpen(true); clearPendingAction()
    }
  }, [pendingAction])
  const [editGoal,            setEditGoal]            = useState<any>(null)
  const [contributeGoal,      setContributeGoal]      = useState<any>(null)
  const [showContributeModal, setShowContributeModal] = useState(false)

  const { data: goals = [], isLoading } = useGoals()
  const deleteGoal     = useDeleteGoal()
  const createExpense  = useCreateExpense()
  const { data: currencies = [] } = useCurrencies()

  const [featuredGoalId, setFeaturedGoalId] = useState<string>(() =>
    localStorage.getItem('featuredGoalId') || ''
  )
  const setFeatured = (id: string) => {
    setFeaturedGoalId(id)
    localStorage.setItem('featuredGoalId', id)
  }

  const fixedGoals   = goals.filter(g => g.type === 'fixed_amount')
  const rateGoals    = goals.filter(g => g.type === 'monthly_rate')
  const featuredGoal = fixedGoals.find(g => g.id === featuredGoalId) ?? fixedGoals[0] ?? null
  const otherGoals   = goals.filter(g => g.id !== featuredGoal?.id)
  const onTrackCount = goals.filter(g => g.on_track !== false).length

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Desktop header ───────────────────────────────────────── */}
        <div className="hidden sm:flex sm:items-center sm:justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Goals</h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
              {fixedGoals.length} savings · {rateGoals.length} rate · {onTrackCount} of {goals.length} on track
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Goal</Button>
        </div>

        {/* ── Mobile header ────────────────────────────────────────── */}
        <div className="flex sm:hidden items-center justify-between">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Goals</h1>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /></Button>
        </div>

        {isLoading && <div className="py-16 flex justify-center"><LoadingSpinner text="Loading goals..." /></div>}

        {!isLoading && goals.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--warning-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Trophy size={22} style={{ color: 'var(--warning)' }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No goals yet</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Set financial goals and track your progress</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>Create First Goal</Button>
          </div>
        )}

        {!isLoading && goals.length > 0 && (
          <>
            {/* ── Desktop layout ────────────────────────────────────── */}
            <div className="hidden sm:contents">
              {featuredGoal && (
                <FeaturedGoalCard
                  goal={featuredGoal}
                  color={getGoalColor(featuredGoal.id, goals)}
                  onContribute={() => { setContributeGoal(featuredGoal); setShowContributeModal(true) }}
                  onEdit={() => setEditGoal(featuredGoal)}
                />
              )}
              {otherGoals.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {otherGoals.map(g => (
                    <CompactGoalCard
                      key={g.id}
                      goal={g}
                      color={getGoalColor(g.id, goals)}
                      onSetFeatured={() => setFeatured(g.id)}
                      onContribute={() => { setContributeGoal(g); setShowContributeModal(true) }}
                      onEdit={() => setEditGoal(g)}
                      onDelete={async () => { if (!confirm(`Delete "${g.name}"?`)) return; await deleteGoal.mutateAsync(g.id) }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Mobile layout ─────────────────────────────────────── */}
            <div className="flex sm:hidden flex-col gap-3">
              {featuredGoal && (() => {
                const color   = getGoalColor(featuredGoal.id, goals)
                const current = Number(featuredGoal.current_savings ?? 0)
                const target  = Number(featuredGoal.target_amount ?? 0)
                const pct     = target > 0 ? Math.min((current / target) * 100, 100) : 0
                return (
                  <div style={{ padding: 20, borderRadius: 16, background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, opacity: 0.85, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
                      <Star size={11} style={{ fill: 'white', color: 'white' }} /> Featured
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{featuredGoal.name}</div>
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <div>
                          <div className="font-mono" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{formatMXN(current)}</div>
                          <div className="font-mono" style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}>of {formatMXN(target)}</div>
                        </div>
                        <div className="font-mono" style={{ fontSize: 20, fontWeight: 600 }}>{pct.toFixed(0)}%</div>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'white' }} />
                      </div>
                      <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                        <span>{formatMXN(Math.max(0, target - current))} to go</span>
                        {featuredGoal.projected_completion && <span>Est. {formatDate(featuredGoal.projected_completion)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                      {(featuredGoal as any).savings_category_id && (
                        <button onClick={() => { setContributeGoal(featuredGoal); setShowContributeModal(true) }}
                          style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          + Contribute
                        </button>
                      )}
                      <button onClick={() => setEditGoal(featuredGoal)}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Pencil size={11} /> Edit
                      </button>
                    </div>
                  </div>
                )
              })()}

              {otherGoals.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 0' }}>Other goals</div>
                  {otherGoals.map(g => {
                    const color = getGoalColor(g.id, goals)
                    if (g.type === 'monthly_rate') {
                      const current = Number(g.current_rate_pct ?? 0)
                      const target  = Number(g.target_rate_pct  ?? 0)
                      const onTrack = g.on_track
                      return (
                        <div key={g.id} style={{ padding: 14, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 32, height: 32, borderRadius: 8, background: onTrack ? 'var(--positive-soft)' : 'var(--negative-soft)', color: onTrack ? 'var(--positive)' : 'var(--negative)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrendingUp size={14} />
                              </span>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{g.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>Rate target</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div>
                                <div className="font-mono" style={{ fontSize: 16, fontWeight: 600, color: onTrack ? 'var(--positive)' : 'var(--negative)' }}>{current.toFixed(1)}%</div>
                                <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>of {target}%</div>
                              </div>
                              <button onClick={() => setEditGoal(g)}
                                style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Pencil size={12} /></button>
                              <button onClick={async () => { if (!confirm(`Delete "${g.name}"?`)) return; await deleteGoal.mutateAsync(g.id) }}
                                style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    const pct     = Number(g.pct_complete ?? 0)
                    const current = Number(g.current_savings ?? 0)
                    const target  = Number(g.target_amount ?? 0)
                    return (
                      <div key={g.id} style={{ padding: 14, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 32, height: 32, borderRadius: 8, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trophy size={14} />
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{g.name}</div>
                            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>{formatMXN(current)} of {formatMXN(target)}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color }}>{pct.toFixed(0)}%</span>
                            <button onClick={() => setFeatured(g.id)} title="Set as featured"
                              style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Star size={12} /></button>
                            <button onClick={() => setEditGoal(g)}
                              style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}><Pencil size={12} /></button>
                            <button onClick={async () => { if (!confirm(`Delete "${g.name}"?`)) return; await deleteGoal.mutateAsync(g.id) }}
                              style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
                          </div>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color }} />
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              <button onClick={() => setShowAdd(true)}
                style={{ padding: 14, background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-dim)', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Plus size={13} /> New goal
              </button>
            </div>
          </>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Goal" size="lg">
        <GoalForm onClose={() => setShowAdd(false)} />
      </Modal>

      <Modal open={editGoal !== null} onClose={() => setEditGoal(null)} title="Edit Goal">
        {editGoal && <GoalEditForm goal={editGoal} onClose={() => setEditGoal(null)} />}
      </Modal>

      <ContributeModal
        open={showContributeModal}
        onClose={() => { setShowContributeModal(false); setContributeGoal(null) }}
        goal={contributeGoal}
      />

      {/* Fully fund goal picker */}
      <Modal open={fullyFundPickerOpen} onClose={() => setFullyFundPickerOpen(false)} title="Fully fund a goal">
        <div className="space-y-2">
          {goals.filter(g => g.type === 'fixed_amount' && (g as any).savings_category_id && Number(g.pct_complete ?? 0) < 100).length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No goals left to fund.</p>
          ) : (
            goals
              .filter(g => g.type === 'fixed_amount' && (g as any).savings_category_id && Number(g.pct_complete ?? 0) < 100)
              .map(g => {
                const color     = getGoalColor(g.id, goals)
                const current   = Number(g.current_savings ?? 0)
                const target    = Number(g.target_amount ?? 0)
                const remaining = Math.max(0, target - current)
                return (
                  <button
                    key={g.id}
                    onClick={async () => {
                      if (!confirm(`Fund "${g.name}" in full for ${formatMXN(remaining)}?`)) return
                      const mxnCurrency = currencies.find((c: any) => c.code === 'MXN')
                      if (!mxnCurrency) return
                      await createExpense.mutateAsync({
                        amount: remaining,
                        currency_id: mxnCurrency.id,
                        category_id: (g as any).savings_category_id,
                        date: todayISO(),
                        notes: `Full funding · ${g.name}`,
                        is_recurring: false,
                      })
                      setFullyFundPickerOpen(false)
                    }}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'background 120ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trophy size={13} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                          {formatMXN(remaining)} remaining to reach {formatMXN(target)}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
          )}
        </div>
      </Modal>

      {/* Goal picker — shown when FAB "Contribute" is tapped */}
      <Modal open={goalPickerOpen} onClose={() => setGoalPickerOpen(false)} title="Contribute to a goal">
        <div className="space-y-2">
          {goals.filter(g => g.type === 'fixed_amount' && (g as any).savings_category_id).length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No goals with a savings category yet.</p>
          ) : (
            goals
              .filter(g => g.type === 'fixed_amount' && (g as any).savings_category_id)
              .map(g => {
                const color = getGoalColor(g.id, goals)
                const pct   = Number(g.pct_complete ?? 0)
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setContributeGoal(g)
                      setShowContributeModal(true)
                      setGoalPickerOpen(false)
                    }}
                    style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'background 120ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 30, height: 30, borderRadius: 8, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trophy size={13} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{g.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-mute)', flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })
          )}
        </div>
      </Modal>
    </>
  )
}