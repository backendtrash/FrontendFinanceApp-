import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  useProjectedCosts, useDeleteProjectedCost,
  useCategories, useRecurringRules,
  useCarryForwardStatus,
} from '../../hooks/useQueries'
import EditProjectedModal  from '../../components/ui/EditProjectedModal'
import { useAddSheetStore } from '../../store/addSheetStore'
import Button             from '../../components/ui/Button'
import Modal              from '../../components/ui/Modal'
import LoadingSpinner     from '../../components/ui/LoadingSpinner'
import { formatMXN }      from '../../utils/formatters'
import { exportPdf }    from '../../utils/exportPdf'
import type { ProjectedCost, PlanGroup } from '../../types/index'
import ProjectedForm      from './ProjectedForm'

// ── Group metadata ────────────────────────────────────────────────────────
const GROUPS: { key: PlanGroup; label: string; tag: string; desc: string; tagColor: string }[] = [
  { key: 'committed',  label: 'Committed',  tag: 'Locked',    desc: "Fixed costs you can't skip",          tagColor: 'var(--text-mute)' },
  { key: 'living',     label: 'Living',     tag: 'Essential', desc: 'Necessary, but you can flex the amount', tagColor: 'var(--info)' },
  { key: 'lifestyle',  label: 'Lifestyle',  tag: 'Optional',  desc: 'Nice-to-have — trim here first',       tagColor: 'var(--accent)' },
]

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] // 0=Mon..6=Sun
const ordinalDay = (n: number) => {
  const s = ['th','st','nd','rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
function formatChargeDay(c: ProjectedCost): string {
  if (c.frequency === 'one_time') return c.month ? `on ${MONTHS[c.month - 1].slice(0, 3)} ${c.day_of_month ?? 1}` : 'One-time'
  if (c.frequency === 'weekly')   return `Weekly · ${WEEKDAYS[c.day_of_week ?? 0]}s`
  return `Monthly · ${ordinalDay(c.day_of_month ?? 1)}`
}

// ── Donut tooltip ─────────────────────────────────────────────────────────
const DonutTip = ({ active, payload }: any) => {
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

// ── Page ──────────────────────────────────────────────────────────────────
export default function ProjectedPage() {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const [showAdd,       setShowAdd]       = useState(false)

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'projected:open-add') {
      setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'projected:export-pdf') {
      const rows = activeCosts.map(c => [
        c.name,
        catMap[c.category_id ?? '']?.name ?? 'Uncategorized',
        c.plan_group,
        c.frequency,
        Number(c.amount_mxn).toFixed(2),
      ])
      exportPdf('Projected Plan', ['Name','Category','Group','Frequency','Amount MXN'], rows, 'projected-plan')
      clearPendingAction()
    }
  }, [pendingAction])
  const [editCost,      setEditCost]      = useState<ProjectedCost | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const { data: costs = [], isLoading } = useProjectedCosts()
  const { data: rules = [] }            = useRecurringRules()
  const { data: expCats = [] }          = useCategories('expense')
  const deleteCost                      = useDeleteProjectedCost()
  const { data: cfStatus }              = useCarryForwardStatus(year, month)

  const catMap = Object.fromEntries(expCats.map(c => [c.id, c]))

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // Active costs relevant to this month
  const activeCosts = costs.filter(c => {
    if (!c.is_active) return false
    if (c.frequency === 'one_time') return c.month === month && c.year === year
    return true
  })

  const toMonthly = (c: ProjectedCost) =>
    Number(c.amount_mxn) * (c.frequency === 'weekly' ? 4.333 : 1)

  const totalPlanned  = activeCosts.reduce((s, c) => s + toMonthly(c), 0)
  const recurringIncome = rules
    .filter(r => r.type === 'income' && r.is_active)
    .reduce((s, r) => s + Number(r.amount) * (r.frequency === 'weekly' ? 4.333 : 1), 0)
  const cfBalance     = Number(cfStatus?.balance ?? 0)
  const income        = recurringIncome + cfBalance
  const leftToSave    = income - totalPlanned
  const saveRate      = income > 0 ? (leftToSave / income) * 100 : 0
  const allocatedPct  = income > 0 ? (totalPlanned / income) * 100 : 0

  // Per-category allocation for bar + donut
  const byCat: Record<string, number> = {}
  activeCosts.forEach(c => {
    const key = c.category_id ?? '__none__'
    byCat[key] = (byCat[key] ?? 0) + toMonthly(c)
  })
  const allocations = Object.entries(byCat)
    .map(([catId, value]) => {
      const cat = catMap[catId]
      return { name: cat?.name ?? 'Uncategorized', color: cat?.color ?? '#702963', value }
    })
    .sort((a, b) => b.value - a.value)

  const donutData = allocations.map(a => ({
    ...a,
    pct: totalPlanned > 0 ? (a.value / totalPlanned) * 100 : 0,
  }))

  if (isLoading) return <div className="py-16 flex justify-center"><LoadingSpinner text="Loading plan…" /></div>

  // ── Shared: period nav pill ───────────────────────────────────────────
  const periodPill = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={prevMonth} style={{ width: 28, height: 28, borderRadius: 7, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}>
        <ChevronLeft size={13} />
      </button>
      <div style={{ padding: '5px 14px', background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 999, boxShadow: 'var(--shadow)', fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
        {MONTHS[month - 1]} {year}
      </div>
      <button onClick={nextMonth} style={{ width: 28, height: 28, borderRadius: 7, border: 'var(--card-border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}>
        <ChevronRight size={13} />
      </button>
    </div>
  )

  // ── Shared: hero stat cards ───────────────────────────────────────────
  const heroCards = [
    {
      k: 'Expected income',
      v: income,
      color: 'var(--positive)',
      sub: cfBalance !== 0
        ? `Recurring + ${cfBalance >= 0 ? '+' : ''}${formatMXN(cfBalance)} carry-forward from ${cfStatus?.source_period}`
        : 'What you plan to bring in',
    },
    { k: 'Total planned',    v: totalPlanned, color: 'var(--text)',     sub: `${activeCosts.length} planned costs · ${allocatedPct.toFixed(0)}% of income` },
    { k: 'Left to save',     v: leftToSave,   color: leftToSave >= 0 ? 'var(--positive)' : 'var(--negative)', sub: leftToSave >= 0 ? 'Headroom after the plan' : 'Plan exceeds income' },
  ]

  // ── Shared: allocation bar ────────────────────────────────────────────
  const allocationBar = (height = 16, radius = 8) => (
    <div style={{ display: 'flex', height, borderRadius: radius, overflow: 'hidden', background: 'var(--bg)', border: 'var(--card-border)' }}>
      {allocations.map(a => (
        <div key={a.name} title={`${a.name} · ${formatMXN(a.value)}`}
          style={{ width: `${income > 0 ? (a.value / income) * 100 : 0}%`, background: a.color, flexShrink: 0 }} />
      ))}
      {income > 0 && leftToSave > 0 && (
        <div style={{
          flex: 1,
          background: `repeating-linear-gradient(45deg, var(--positive-soft), var(--positive-soft) 6px, transparent 6px, transparent 12px)`,
          borderLeft: '1px dashed var(--positive)',
        }} />
      )}
    </div>
  )

  // ── Plan grouped list (shared between desktop left col + mobile) ──────
  const planGroup = (group: typeof GROUPS[0], mobile = false) => {
    const items = activeCosts.filter(c => c.plan_group === group.key)
    if (items.length === 0) return null
    const subtotal = items.reduce((s, c) => s + toMonthly(c), 0)
    return (
      <div key={group.key}>
        {/* Group header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: mobile ? '4px 4px 8px' : '12px 20px 8px', background: mobile ? 'transparent' : 'var(--bg)', borderBottom: mobile ? 'none' : 'var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: mobile ? 12 : 12.5, fontWeight: 700, color: 'var(--text)' }}>{group.label}</span>
            <span style={{ fontSize: mobile ? 8.5 : 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: group.tagColor, background: 'var(--surface)', border: 'var(--card-border)', padding: '2px 7px', borderRadius: 999 }}>{group.tag}</span>
            {!mobile && <span style={{ fontSize: 11.5, color: 'var(--text-mute)' }}>{group.desc}</span>}
          </div>
          <span className="font-mono" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-dim)' }}>{formatMXN(subtotal)}</span>
        </div>

        {/* Rows */}
        {mobile ? (
          <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
            {items.map((cost, ci) => {
              const cat = catMap[cost.category_id ?? '']
              return (
                <div key={cost.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: ci === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: (cat?.color ?? '#702963') + '22', color: cat?.color ?? '#702963', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {(cat?.name ?? cost.name).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cost.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat?.name ?? 'Uncategorized'} · {formatChargeDay(cost)}{cost.notes ? ` · ${cost.notes}` : ''}
                    </div>
                  </div>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                    {formatMXN(toMonthly(cost))}
                  </span>
                  <button onClick={() => { setEditCost(cost); setShowEditModal(true) }}
                    style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={async () => { if (!confirm(`Delete "${cost.name}"?`)) return; await deleteCost.mutateAsync(cost.id) }}
                    style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '0 2px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
                </div>
              )
            })}
          </div>
        ) : (
          items.map((cost) => {
            const cat = catMap[cost.category_id ?? '']
            return (
              <div key={cost.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px 24px', gap: 10, alignItems: 'center', padding: '12px 20px', borderBottom: 'var(--card-border)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 5, background: cat?.color ?? '#702963', flexShrink: 0 }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{cost.name}</span>
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-mute)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat?.name ?? 'Uncategorized'} · {formatChargeDay(cost)}{cost.notes ? ` · ${cost.notes}` : ''}
                    </span>
                  </span>
                </span>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>{formatMXN(toMonthly(cost))}</span>
                <button onClick={() => { setEditCost(cost); setShowEditModal(true) }}
                  style={{ width: 26, height: 26, borderRadius: 6, border: 'var(--card-border)', background: 'var(--bg)', color: 'var(--text-mute)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>
                  <Pencil size={12} />
                </button>
                <button
                  onClick={async () => { if (!confirm(`Delete "${cost.name}"?`)) return; await deleteCost.mutateAsync(cost.id) }}
                  style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Desktop header ───────────────────────────────────────── */}
        <div className="hidden sm:flex sm:items-end sm:justify-between gap-4 flex-wrap">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
              Money · Monthly plan
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, margin: '6px 0 0', letterSpacing: '-0.02em', color: 'var(--text)' }}>
              Plan your month
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '4px 0 0', maxWidth: 560 }}>
              Lay out everything you expect to spend in {MONTHS[month - 1]} before it happens. Adjust freely — this is your plan, not a rule.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {periodPill}
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add planned cost</Button>
          </div>
        </div>

        {/* ── Mobile header ────────────────────────────────────────── */}
        <div className="flex sm:hidden items-center justify-between">
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>Monthly plan</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: '2px 0 0' }}>Plan your month</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {periodPill}
            <button onClick={() => setShowAdd(true)} style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* ── Hero stat row (desktop) ───────────────────────────────── */}
        <div className="hidden sm:grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {heroCards.map(s => (
            <div key={s.k} style={{ padding: '18px 20px', background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14, boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>{s.k}</div>
              <div className="font-mono" style={{ fontSize: 28, fontWeight: 600, color: s.color, letterSpacing: '-0.01em', lineHeight: 1 }}>{formatMXN(s.v)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Mobile hero card ─────────────────────────────────────── */}
        <div className="flex sm:hidden flex-col" style={{ padding: 18, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 16, boxShadow: 'var(--shadow)', gap: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Left to save · {MONTHS[month - 1]}</div>
          <div className="font-mono" style={{ fontSize: 32, fontWeight: 600, color: leftToSave >= 0 ? 'var(--positive)' : 'var(--negative)', marginTop: 6, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {formatMXN(leftToSave)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 3 }}>{saveRate.toFixed(0)}% savings rate if you stick to the plan</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: 'var(--card-border)' }}>
            {[
              { l: 'Income',  v: formatMXN(income),       c: 'var(--positive)' },
              { l: 'Planned', v: formatMXN(totalPlanned), c: 'var(--text)' },
              { l: 'Items',   v: String(activeCosts.length), c: 'var(--text)' },
            ].map((s, idx) => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                {idx > 0 && <div style={{ width: 1, background: 'var(--border)', marginRight: 16 }} />}
                <div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.l}</div>
                  <div className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: s.c, marginTop: 3 }}>{s.v}</div>
                </div>
              </div>
            ))}
          </div>
          {allocations.length > 0 && <div style={{ marginTop: 14 }}>{allocationBar(12, 6)}</div>}
        </div>

        {/* ── Allocation bar card (desktop) ─────────────────────────── */}
        {allocations.length > 0 && (
          <div className="hidden sm:block" style={{ padding: 20, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Where this month's income goes</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>Planned spend by category, plus what's left to save</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{formatMXN(income)}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-mute)' }}>total income</div>
              </div>
            </div>
            {allocationBar(16, 8)}
            {/* Legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: 14 }}>
              {allocations.map(a => (
                <span key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--text-dim)' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: a.color }} />
                  {a.name}
                  <span className="font-mono" style={{ color: 'var(--text-mute)' }}>
                    {a.value >= 1000 ? `$${(a.value / 1000).toFixed(1)}k` : formatMXN(a.value)}
                  </span>
                </span>
              ))}
              {income > 0 && leftToSave > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: 'var(--positive)', fontWeight: 600 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, border: '1px dashed var(--positive)', background: 'var(--positive-soft)' }} />
                  Left to save
                  <span className="font-mono">{leftToSave >= 1000 ? `$${(leftToSave / 1000).toFixed(1)}k` : formatMXN(leftToSave)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Two-column (desktop): plan list + donut/nudge ────────── */}
        {activeCosts.length > 0 && (
          <div className="hidden sm:grid" style={{ gridTemplateColumns: '1.65fr 1fr', gap: 14, alignItems: 'start' }}>

            {/* Plan list */}
            <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>The plan</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>Grouped by how flexible each cost is</div>
                </div>
                <span className="font-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{formatMXN(totalPlanned)}</span>
              </div>
              {GROUPS.map(g => planGroup(g, false))}
              <button onClick={() => setShowAdd(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', background: 'transparent', border: 'none', borderTop: '1px dashed var(--border-strong)', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                <Plus size={13} /> Add a planned cost
              </button>
            </div>

            {/* Right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Donut */}
              <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Planned allocation</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 16 }}>Share of plan by category</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 150, height: 150, flexShrink: 0, position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={66} paddingAngle={2} strokeWidth={0}>
                          {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={<DonutTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Planned</div>
                      <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 1 }}>
                        {totalPlanned >= 1000 ? `$${(totalPlanned / 1000).toFixed(1)}k` : formatMXN(totalPlanned)}
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {donutData.map(a => (
                      <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 4, background: a.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                        <span className="font-mono" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>{a.pct.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Savings nudge */}
              {income > 0 && (
                <div style={{ padding: 18, borderRadius: 14, background: 'var(--accent-soft)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface)', border: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 14 }}>✦</div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent-ink)' }}>If you stick to this plan</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.55, margin: 0 }}>
                    You'll set aside{' '}
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-ink)' }}>{formatMXN(leftToSave)}</span>
                    {' '}this month — a {saveRate.toFixed(0)}% savings rate.
                    {GROUPS.filter(g => g.key === 'lifestyle').map(g => (
                      <span key={g.key}> Trim <strong style={{ color: 'var(--text)' }}>Lifestyle</strong> first if you want to push that higher.</span>
                    ))}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Mobile: group cards ───────────────────────────────────── */}
        {activeCosts.length > 0 && (
          <div className="flex sm:hidden flex-col" style={{ gap: 12 }}>
            {GROUPS.map(g => planGroup(g, true))}
            <button onClick={() => setShowAdd(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, background: 'transparent', border: '1px dashed var(--border-strong)', borderRadius: 14, color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              <Plus size={13} /> Add a planned cost
            </button>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {activeCosts.length === 0 && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Plus size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No planned costs yet</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 16 }}>Add what you expect to spend in {MONTHS[month - 1]}</p>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> Add planned cost</Button>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add planned cost" size="lg">
        <ProjectedForm onClose={() => setShowAdd(false)} />
      </Modal>

      <EditProjectedModal
        cost={editCost}
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditCost(null) }}
      />
    </>
  )
}