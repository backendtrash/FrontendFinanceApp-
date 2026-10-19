import type { ReactNode } from 'react'

interface StatCardProps {
  label:      string
  value:      string | number
  sub?:       string
  icon?:      ReactNode
  valueColor?: string
  className?: string
}

export default function StatCard({ label, value, sub, icon, valueColor, className = '' }: StatCardProps) {
  return (
    <div className={`s-card p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-mute)', marginBottom: 6 }}>
            {label}
          </p>
          <p
            className="font-mono"
            style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: valueColor ?? 'var(--text)', lineHeight: 1 }}
          >
            {value}
          </p>
          {sub && (
            <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 5 }}>{sub}</p>
          )}
        </div>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--surface-alt)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginLeft: 12,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}