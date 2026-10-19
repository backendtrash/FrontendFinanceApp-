import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { formatMXN } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 11 }}>
      <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono" style={{ fontWeight: 600 }}>{formatMXN(Number(entry.value))}</span>
        </div>
      ))}
    </div>
  )
}

export default function ProjectedChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
        No projection data available
      </div>
    )
  }

  const normalized = data.map(d => ({
    ...d,
    projected_amount: Number(d.projected_amount),
    real_amount:      Number(d.real_amount),
  }))

  const futureLabel = normalized.find(d => d.is_future)?.month_label ?? null

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={normalized} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-projected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563a0" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#2563a0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-real" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#a32d2d" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#a32d2d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece8de" />
        <XAxis dataKey="month_label" tick={{ fontSize: 10, fill: '#9b9586' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9b9586' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
        {futureLabel && (
          <ReferenceLine x={futureLabel} stroke="#9b9586" strokeDasharray="4 4"
            label={{ value: 'Today', position: 'top', fontSize: 10, fill: '#9b9586' }} />
        )}
        <Area type="monotone" dataKey="projected_amount" name="Projected"
          stroke="#2563a0" strokeWidth={1.5} fill="url(#grad-projected)"
          strokeDasharray="5 4" dot={false} />
        <Area type="monotone" dataKey="real_amount" name="Real"
          stroke="#a32d2d" strokeWidth={2} fill="url(#grad-real)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}