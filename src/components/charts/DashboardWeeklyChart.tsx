import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { formatMXN } from '../../utils/formatters'

interface WeekPoint {
  week_label:       string
  total_income:     number
  total_expenses:   number
  projected_weekly: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3
                    shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name}
             className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-medium">
            {formatMXN(Number(entry.value))}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardWeeklyChart({
  data,
}: {
  data: WeekPoint[]
}) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center
                      text-sm text-gray-400">
        No data available
      </div>
    )
  }

  const normalized = data.map(d => ({
    ...d,
    total_income:     Number(d.total_income),
    total_expenses:   Number(d.total_expenses),
    projected_weekly: Number(d.projected_weekly),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
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
        <Legend
          iconType="circle"
          iconSize={7}
          wrapperStyle={{ fontSize: '11px' }}
        />
        <Bar
          dataKey="total_income"
          name="Income"
          fill="#1f7a4d"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="total_expenses"
          name="Expenses"
          fill="#a32d2d"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="projected_weekly"
          name="Projected"
          fill="#a8651b"
          radius={[3, 3, 0, 0]}
          opacity={0.7}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}