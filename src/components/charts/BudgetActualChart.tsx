import { formatMXN } from '../../utils/formatters'

interface BudgetActualChartProps {
  data: {
    category_name: string
    limit_amount:  number
    spent_amount:  number
    color:         string
  }[]
}

export default function BudgetActualChart({ data }: BudgetActualChartProps) {
  if (!data.length) {
    return (
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
        No budget data available
      </div>
    )
  }

  // Normalize bars against the largest total (spent or limit, whichever is bigger)
  const maxVal = Math.max(...data.map(d => Math.max(d.limit_amount, d.spent_amount)), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map(d => {
        const over   = d.spent_amount > d.limit_amount
        const limitW = (d.limit_amount / maxVal) * 100
        const spentW = (d.spent_amount / maxVal) * 100

        return (
          <div key={d.category_name} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 180px', gap: 16, alignItems: 'center' }}>
            {/* Category name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: d.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.category_name}</span>
            </div>

            {/* Bar */}
            <div style={{ position: 'relative', height: 18, background: 'var(--surface-alt)', borderRadius: 4, overflow: 'hidden' }}>
              {/* Budget limit tick */}
              <div style={{ position: 'absolute', left: `${limitW}%`, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 2 }} />
              {/* Category color — spent amount up to limit */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${over ? limitW : spentW}%`,
                background: d.color, transition: 'width .3s',
              }} />
              {/* Red overspend extension beyond limit */}
              {over && (
                <div style={{
                  position: 'absolute', left: `${limitW}%`, top: 0, bottom: 0,
                  width: `${spentW - limitW}%`,
                  background: 'var(--negative)', transition: 'width .3s',
                }} />
              )}
            </div>

            {/* Amounts */}
            <div className="font-mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-dim)' }}>
              <span style={{ color: over ? 'var(--negative)' : 'var(--text)', fontWeight: 600 }}>{formatMXN(d.spent_amount)}</span>
              <span>/ {formatMXN(d.limit_amount)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}