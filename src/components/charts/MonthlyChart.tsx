import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { MonthlyDataPoint } from '../../types/index'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: 'var(--card-border)',
      borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--shadow)', fontSize: 11,
    }}>
      <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono" style={{ fontWeight: 500, color: 'var(--text)' }}>
            ${Number(entry.value).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyChart({ data }: { data: MonthlyDataPoint[] }) {
  if (!data.length) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-mute)' }}>
        No data available
      </div>
    )
  }

  const normalized = data.map(d => ({
    ...d,
    total_income:      Number(d.total_income),
    total_expenses:    Number(d.total_expenses),
    net_balance:       Number(d.net_balance),
    projected_monthly: Number(d.projected_monthly),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={normalized} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-income" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1f7a4d" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#1f7a4d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-expense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#a32d2d" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#a32d2d" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-projected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#a8651b" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#a8651b" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="2 3" stroke="#ece8de" />
        <XAxis
          dataKey="month_label"
          tick={{ fontSize: 11, fill: '#9b9586' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9b9586' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
        />

        <Area
          type="monotone"
          dataKey="total_income"
          name="Income"
          stroke="#1f7a4d"
          strokeWidth={2}
          fill="url(#grad-income)"
          dot={{ r: 2.5, fill: '#1f7a4d', strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="total_expenses"
          name="Expenses"
          stroke="#a32d2d"
          strokeWidth={2}
          fill="url(#grad-expense)"
          dot={{ r: 2.5, fill: '#a32d2d', strokeWidth: 0 }}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="projected_monthly"
          name="Projected"
          stroke="#a8651b"
          strokeWidth={1.5}
          fill="url(#grad-projected)"
          strokeDasharray="4 3"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}