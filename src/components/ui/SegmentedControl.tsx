interface Tab {
  id:    string
  label: string
  count?: number
}

interface SegmentedControlProps {
  tabs:     Tab[]
  active:   string
  onChange: (id: string) => void
  className?: string
}

export default function SegmentedControl({ tabs, active, onChange, className = '' }: SegmentedControlProps) {
  return (
    <div className={`s-tabs ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`s-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span style={{
              marginLeft: 5,
              fontSize: 10,
              fontWeight: 600,
              background: active === tab.id ? 'var(--accent-soft)' : 'var(--border)',
              color:      active === tab.id ? 'var(--accent-ink)'  : 'var(--text-mute)',
              borderRadius: 999,
              padding: '1px 5px',
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}