import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { CategoryDataPoint } from '../../types/index'

const CHART_HUES = ['#702963','#1f7a4d','#a8651b','#2563a0','#7a5191','#3a8a73','#bf6f2e','#525a68']

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--surface)', border: 'var(--card-border)',
      borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)',
      fontSize: 11,
    }}>
      <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{d.category_name}</p>
      <p style={{ color: 'var(--text-dim)' }}>
        ${d.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </p>
      <p style={{ color: 'var(--text-mute)' }}>{d.pct_of_total.toFixed(1)}%</p>
    </div>
  )
}

export default function CategoryChart({ data }: { data: CategoryDataPoint[] }) {
  if (!data.length) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
        No expenses this month
      </div>
    )
  }

  const top = data.slice(0, 6).map((d, i) => ({
    ...d,
    total_amount: Number(d.total_amount),
    pct_of_total: Number(d.pct_of_total),
    fill: d.color || CHART_HUES[i % CHART_HUES.length],
  }))

  const grandTotal = top.reduce((s, d) => s + d.total_amount, 0)
  const fmtCenter  = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}m`
    : n >= 1_000   ? `$${(n / 1_000).toFixed(1)}k`
    : `$${n.toFixed(0)}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
      {/* Donut */}
      <div style={{ width: 140, height: 140, flexShrink: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={top}
              dataKey="total_amount"
              nameKey="category_name"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={64}
              paddingAngle={2}
              strokeWidth={0}
            >
              {top.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-mute)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total</div>
          <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginTop: 1 }}>{fmtCenter(grandTotal)}</div>
        </div>
      </div>

      {/* Category list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        {top.slice(0, 5).map(c => (
          <div key={c.category_name} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: c.fill, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.category_name}
            </span>
            <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: 11, flexShrink: 0 }}>
              {c.pct_of_total.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}