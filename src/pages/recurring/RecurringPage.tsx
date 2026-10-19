import { useState, useRef, useEffect } from 'react'
import { useVirtualizer }              from '@tanstack/react-virtual'
import { RefreshCw, TrendingDown, TrendingUp, CheckCircle, X } from 'lucide-react'
import {
  useRecurringRules, useDeleteRecurringRule,
  useCategories, useCurrencies, useMonthlyProjection,
} from '../../hooks/useQueries'
import Card               from '../../components/ui/Card'
import Modal              from '../../components/ui/Modal'
import LoadingSpinner     from '../../components/ui/LoadingSpinner'
import { formatMXN, formatDate } from '../../utils/formatters'
import { exportPdf }          from '../../utils/exportPdf'
import { processRecurringRules } from '../../api/recurring'
import DangerZone         from '../../components/ui/DangerZone'
import RecurringRuleForm  from './RecurringRuleForm'
import { useAddSheetStore } from '../../store/addSheetStore'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function RecurringPage() {
  const [processing, setProcessing] = useState(false)
  const [processResult, setResult]  = useState<any>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all')
  const [showAdd,  setShowAdd]  = useState(false)
  const [addType,  setAddType]  = useState<'expense' | 'income'>('expense')

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'recurring:open-add-expense') {
      setAddType('expense'); setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'recurring:open-add-income') {
      setAddType('income');  setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'recurring:export-pdf') {
      const rows = rules.map(r => [
        r.type,
        r.description ?? '',
        catMap[r.category_id ?? '']?.name ?? 'Uncategorized',
        schedule(r),
        formatDate(r.next_due_date),
        Number(r.amount).toFixed(2),
      ])
      exportPdf('Recurring Rules', ['Type','Description','Category','Schedule','Next Due','Amount'], rows, 'recurring-rules')
      clearPendingAction()
    }
  }, [pendingAction])

  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth() + 1

  const { data: rules      = [], isLoading } = useRecurringRules()
  const { data: categories = [] }             = useCategories()
  const { data: currencies = [] }             = useCurrencies()
  const { data: projection }                  = useMonthlyProjection(year, month)
  const deleteRule                             = useDeleteRecurringRule()

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const curMap = Object.fromEntries(currencies.map(c => [c.id, c]))

  const filtered = rules.filter(r => typeFilter === 'all' ? true : r.type === typeFilter)

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: filtered.length, getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, overscan: 8,
  })

  const handleProcess = async () => {
    setProcessing(true)
    try { const result = await processRecurringRules(); setResult(result) }
    catch (e) { setResult({ error: 'Processing failed' }) }
    finally { setProcessing(false) }
  }

  // ── Stat computations ────────────────────────────────────────────────────
  const expRules = rules.filter(r => r.type === 'expense' && r.is_active)
  const incRules = rules.filter(r => r.type === 'income'  && r.is_active)
  const toMonthly = (r: any) => Number(r.amount) * (r.frequency === 'weekly' ? 4.33 : 1)
  const monthlyExp    = expRules.reduce((s, r) => s + toMonthly(r), 0)
  const monthlyInc    = incRules.reduce((s, r) => s + toMonthly(r), 0)
  const projectedTotal = Number(projection?.total_projected_mxn ?? 0)
  const netRecurring  = monthlyInc - monthlyExp
  const projectedNet  = monthlyInc - projectedTotal
  const activeRules  = rules.filter(r => r.is_active && r.next_due_date)
  const nextDueRule  = activeRules.sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))[0]

  const schedule = (r: any) => r.frequency === 'weekly'
    ? `Every ${DAY_NAMES[r.day_of_week ?? 0]}`
    : `Day ${r.day_of_month ?? 1} monthly`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="hidden sm:flex sm:items-end sm:justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
            Recurring rules
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
            {rules.length} rules total · {rules.filter(r => r.is_active).length} active
            {nextDueRule && ` · next ${formatDate(nextDueRule.next_due_date)}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleProcess}
            disabled={processing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'var(--card-border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12.5, fontWeight: 600, cursor: processing ? 'wait' : 'pointer' }}>
            <RefreshCw size={13} /> Process due rules
          </button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex sm:hidden items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Recurring</h1>
      </div>

      {/* ── Process result banner ────────────────────────────────────── */}
      {processResult && (
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: processResult.error ? 'var(--negative-soft)' : 'var(--positive-soft)',
          border: `1px solid ${processResult.error ? 'var(--negative)' : 'var(--positive)'}33`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: processResult.error ? 'var(--negative)' : 'var(--positive)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {processResult.error ? <X size={14} /> : <CheckCircle size={14} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: processResult.error ? 'var(--negative)' : 'var(--positive)' }}>
              {processResult.error ? processResult.error : `Last run created ${processResult.created ?? 0} transactions`}
            </div>
            {!processResult.error && (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 1 }}>
                {processResult.processed} rules processed{processResult.errors > 0 ? ` · ${processResult.errors} errors` : ' · 0 errors'}
              </div>
            )}
          </div>
          <button onClick={() => setResult(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 11 }}>Dismiss</button>
        </div>
      )}

      {/* ── Stat strip (desktop) ─────────────────────────────────────── */}
      <div className="hidden sm:grid sm:grid-cols-4" style={{ gap: 12 }}>
        {[
          { k: 'Monthly expense', v: formatMXN(monthlyExp),   c: 'var(--negative)', sub: `${expRules.length} expense rule${expRules.length !== 1 ? 's' : ''}` },
          { k: 'Monthly income',  v: formatMXN(monthlyInc),   c: 'var(--positive)', sub: `${incRules.length} income rule${incRules.length !== 1 ? 's' : ''}` },
          { k: 'Net recurring',   v: formatMXN(netRecurring),  c: netRecurring >= 0 ? 'var(--info)' : 'var(--negative)', sub: netRecurring >= 0 ? 'Reliable surplus' : 'Net deficit' },
          { k: 'Next due',        v: nextDueRule ? formatDate(nextDueRule.next_due_date) : '—', c: 'var(--text)', sub: nextDueRule?.description ?? 'No upcoming' },
        ].map((s, i) => (
          <div key={i} className="s-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.k}</div>
            <div className="font-mono" style={{ fontSize: 19, fontWeight: 600, color: s.c, marginTop: 4 }}>{s.v}</div>
            <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── vs Monthly Projected — desktop ───────────────────────────── */}
      <div className="hidden sm:block" style={{ padding: 20, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>vs Monthly Projected</div>
        <div style={{ display: 'flex', gap: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Monthly Income</div>
            <div className="font-mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--positive)', marginTop: 4 }}>{formatMXN(monthlyInc)}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>{incRules.length} rule{incRules.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)', margin: '0 20px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Monthly Projection</div>
            <div className="font-mono" style={{ fontSize: 24, fontWeight: 600, color: 'var(--negative)', marginTop: 4 }}>{formatMXN(projectedTotal)}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>projected costs</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)', margin: '0 20px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Net</div>
            <div className="font-mono" style={{ fontSize: 24, fontWeight: 600, color: projectedNet >= 0 ? 'var(--info)' : 'var(--negative)', marginTop: 4 }}>
              {projectedNet >= 0 ? '+' : ''}{formatMXN(projectedNet)}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-mute)', marginTop: 2 }}>{projectedNet >= 0 ? 'Surplus' : 'Deficit'}</div>
          </div>
        </div>
      </div>

      {/* ── vs Monthly Projected — mobile KPI grid ───────────────────── */}
      <div className="sm:hidden" style={{ padding: 14, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>vs Monthly Projected</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {[
            { k: 'Monthly Income',  v: formatMXN(monthlyInc),    c: 'var(--positive)' },
            { k: 'Net Recurring',   v: (netRecurring >= 0 ? '+' : '') + formatMXN(netRecurring), c: netRecurring >= 0 ? 'var(--info)' : 'var(--negative)' },
          ].map((s, i) => (
            <div key={i} style={{ padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.k}</div>
              <div className="font-mono" style={{ fontSize: 17, fontWeight: 600, color: s.c, marginTop: 4 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-alt)', borderRadius: 8 }}>
          {(['all', 'expense', 'income'] as const).map(v => (
            <button key={v} onClick={() => setTypeFilter(v)} style={{
              padding: '6px 18px', border: 'none', borderRadius: 5, cursor: 'pointer',
              background: typeFilter === v ? 'var(--surface)' : 'transparent',
              fontSize: 12, fontWeight: 600,
              color: typeFilter === v ? 'var(--text)' : 'var(--text-mute)',
              boxShadow: typeFilter === v ? 'var(--shadow)' : 'none',
            }}>{v === 'all' ? 'All' : v === 'expense' ? 'Expenses' : 'Income'}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><LoadingSpinner text="Loading rules..." /></div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <RefreshCw size={22} style={{ color: 'var(--text-mute)' }} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No recurring rules</h3>
          <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Create rules from the Expenses or Earnings pages</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: process button + card list ────────────────── */}
          <div className="mobile-list">
            {/* Mobile process button */}
            <button onClick={handleProcess} disabled={processing}
              style={{ width: '100%', padding: '12px 14px', background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={14} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>Process due rules</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>{rules.filter(r => r.is_active).length} active · next {nextDueRule ? formatDate(nextDueRule.next_due_date) : '—'}</div>
                </div>
              </div>
              <span style={{ fontSize: 16, color: 'var(--text-mute)' }}>›</span>
            </button>

            {/* Mobile rule cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(r => {
                const cat   = catMap[r.category_id ?? '']
                const cur   = curMap[r.currency_id]
                const isExp = r.type === 'expense'
                return (
                  <div key={r.id} style={{ padding: 14, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, opacity: r.is_active ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isExp ? 'var(--negative-soft)' : 'var(--positive-soft)', color: isExp ? 'var(--negative)' : 'var(--positive)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isExp ? <TrendingDown size={14} strokeWidth={2} /> : <TrendingUp size={14} strokeWidth={2} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.description ?? (isExp ? 'Expense rule' : 'Income rule')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
                          {schedule(r)} · next {formatDate(r.next_due_date)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: isExp ? 'var(--text)' : 'var(--positive)' }}>
                          {isExp ? '−' : '+'}{cur?.symbol ?? '$'}{Number(r.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>{cat?.name ?? 'Uncategorized'}</div>
                      </div>
                      <button
                        onClick={async () => { if (!confirm('Delete this rule?')) return; await deleteRule.mutateAsync(r.id) }}
                        style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: '0 2px' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Desktop table ──────────────────────────────────────── */}
          <div className="desktop-table">
            <Card padding={false}>
              <div ref={tableContainerRef} className="overflow-x-auto">
                <table className="w-full" style={{ fontSize: 12.5 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
                    <tr style={{ borderBottom: 'var(--card-border)' }}>
                      {['Type','Description','Category','Schedule','Next Due','Amount','Status',''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 16px', fontSize: 10.5, fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: i === 5 ? 'right' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rowVirtualizer.getVirtualItems()[0] && (
                      <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}><td /></tr>
                    )}
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                      const rule  = filtered[virtualRow.index]
                      const cat   = catMap[rule.category_id ?? '']
                      const cur   = curMap[rule.currency_id]
                      const isExp = rule.type === 'expense'
                      return (
                        <tr key={rule.id} style={{ borderBottom: 'var(--card-border)', transition: 'background 120ms ease', opacity: rule.is_active ? 1 : 0.5 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 4, background: isExp ? 'var(--negative-soft)' : 'var(--positive-soft)', color: isExp ? 'var(--negative)' : 'var(--positive)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {rule.type}
                            </span>
                          </td>
                          <td style={{ padding: '11px 16px', color: 'var(--text)', fontWeight: 500 }}>
                            {rule.description ?? <span style={{ color: 'var(--text-mute)' }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            {cat ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                                <span style={{ width: 8, height: 8, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                                <span style={{ color: 'var(--text-dim)' }}>{cat.name}</span>
                              </span>
                            ) : <span style={{ color: 'var(--text-mute)', fontSize: 11.5 }}>Uncategorized</span>}
                          </td>
                          <td style={{ padding: '11px 16px', color: 'var(--text-dim)', fontSize: 12 }}>{schedule(rule)}</td>
                          <td className="font-mono" style={{ padding: '11px 16px', color: 'var(--text-dim)', fontSize: 11.5 }}>{formatDate(rule.next_due_date)}</td>
                          <td className="font-mono" style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, color: isExp ? 'var(--text)' : 'var(--positive)' }}>
                            {isExp ? '' : '+'}{cur?.symbol ?? ''}{Number(rule.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 4, background: rule.is_active ? 'var(--positive-soft)' : 'var(--surface-alt)', color: rule.is_active ? 'var(--positive)' : 'var(--text-mute)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              <span style={{ width: 5, height: 5, borderRadius: 3, background: rule.is_active ? 'var(--positive)' : 'var(--text-mute)' }} />
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                            <button onClick={async () => { if (!confirm('Delete this rule?')) return; await deleteRule.mutateAsync(rule.id) }}
                              style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
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
                </table>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ── Danger zone ─────────────────────────────────────────────── */}
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--negative)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Danger Zone</p>
        <DangerZone label="Delete all recurring rules" description="Permanently deletes all rules — past transactions are preserved"
          onConfirm={async () => { const { deleteAllRules } = await import('../../api/goals'); await deleteAllRules() }} />
      </div>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={addType === 'expense' ? 'New recurring expense' : 'New recurring income'}
      >
        <RecurringRuleForm
          key={addType}
          defaultType={addType}
          onClose={() => setShowAdd(false)}
        />
      </Modal>
    </div>
  )
}