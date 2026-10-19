import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { WeeklyDataPoint } from '../../types/index'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 11 }}>
      <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono" style={{ fontWeight: 600 }}>
            ${Number(entry.value).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function WeeklyChart({ data }: { data: WeeklyDataPoint[] }) {
  if (!data.length) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
        No weekly data available
      </div>
    )
  }

  const normalized = data.map(d => ({
    ...d,
    total_income:   Number(d.total_income),
    total_expenses: Number(d.total_expenses),
    net_balance:    Number(d.net_balance),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={normalized}
        margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
        barSize={18}
        barGap={3}
        barCategoryGap="14%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ece8de" />
        <XAxis
          dataKey="week_label"
          tick={{ fontSize: 10, fill: '#9b9586' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#9b9586' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
        <Bar dataKey="total_income"   name="Income"   fill="#1f7a4d" radius={[3,3,0,0]} />
        <Bar dataKey="total_expenses" name="Expenses" fill="#a32d2d" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}