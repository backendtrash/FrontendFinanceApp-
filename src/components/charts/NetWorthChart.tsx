import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatMXN } from '../../utils/formatters'

interface NetWorthPoint {
  month_label:   string
  net_worth:     number
  monthly_delta: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const worth = Number(payload[0]?.value ?? 0)
  const delta = Number(payload[0]?.payload?.monthly_delta ?? 0)
  return (
    <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 11 }}>
      <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
        <span style={{ color: 'var(--text-dim)' }}>Net Worth</span>
        <span className="font-mono" style={{ fontWeight: 700, color: worth >= 0 ? 'var(--accent)' : 'var(--negative)' }}>{formatMXN(worth)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ color: 'var(--text-dim)' }}>This month</span>
        <span className="font-mono" style={{ fontWeight: 600, color: delta >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
          {delta >= 0 ? '+' : ''}{formatMXN(delta)}
        </span>
      </div>
    </div>
  )
}

export default function NetWorthChart({ data }: { data: NetWorthPoint[] }) {
  if (!data.length) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
        No data available
      </div>
    )
  }

  const normalized = data.map(d => ({
    ...d,
    net_worth:     Number(d.net_worth),
    monthly_delta: Number(d.monthly_delta),
  }))

  const hasNegative = normalized.some(d => d.net_worth < 0)
  const strokeColor = hasNegative ? 'var(--negative)' : '#702963'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={normalized} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={hasNegative ? '#a32d2d' : '#702963'} stopOpacity={0.18} />
            <stop offset="95%" stopColor={hasNegative ? '#a32d2d' : '#702963'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece8de" />
        <XAxis dataKey="month_label" tick={{ fontSize: 10, fill: '#9b9586' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9b9586' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#ece8de" strokeDasharray="4 4" />
        <Area type="monotone" dataKey="net_worth" stroke={strokeColor} strokeWidth={2}
          fill="url(#netWorthGrad)" dot={false} activeDot={{ r: 4, fill: strokeColor }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}