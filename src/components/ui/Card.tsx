import type { ReactNode, CSSProperties } from 'react'

interface CardProps {
  children:   ReactNode
  className?: string
  padding?:   boolean
  style?:     CSSProperties
}

export default function Card({ children, className = '', padding = true, style }: CardProps) {
  return (
    <div
      className={`s-card ${padding ? 'p-5' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title:     string
  subtitle?: string
  action?:   ReactNode
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text)' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}