type BadgeVariant = 'positive' | 'negative' | 'warning' | 'info' | 'accent' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  positive: { bg: 'var(--positive-soft)',  color: 'var(--positive)'  },
  negative: { bg: 'var(--negative-soft)',  color: 'var(--negative)'  },
  warning:  { bg: 'var(--warning-soft)',   color: 'var(--warning)'   },
  info:     { bg: 'var(--info-soft)',      color: 'var(--info)'      },
  accent:   { bg: 'var(--accent-soft)',    color: 'var(--accent-ink)' },
  muted:    { bg: 'var(--surface-alt)',    color: 'var(--text-dim)'  },
}

export default function Badge({ children, variant = 'muted', className = '' }: BadgeProps) {
  const s = variantStyles[variant]
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${className}`}
      style={{
        background:  s.bg,
        color:       s.color,
        fontSize:    11,
        fontWeight:  600,
        padding:     '2px 8px',
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </span>
  )
}