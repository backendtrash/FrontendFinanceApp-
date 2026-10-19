import { useLocation }    from 'react-router-dom'
import { Menu, Search }   from 'lucide-react'
import NotificationsPanel from './NotificationsPanel'
import { useAuthStore }   from '../../store/authStore'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/expenses':   'Expenses',
  '/earnings':   'Earnings',
  '/budgets':    'Budgets',
  '/goals':      'Goals',
  '/weeks':      'Week View',
  '/recurring':  'Recurring',
  '/categories': 'Categories',
  '/analytics':  'Analytics',
  '/projected':  'Plan',
  '/settings':   'Settings',
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { pathname } = useLocation()
  const { user }     = useAuthStore()
  const title        = PAGE_TITLES[pathname] || 'BudgetTrash'
  const initials     = user?.email ? user.email.slice(0, 2).toUpperCase() : 'S'

  return (
    <header style={{
      height: 56,
      background: 'var(--surface)',
      borderBottom: 'var(--card-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 28px',
      gap: 16,
    }}>
      {/* Mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            padding: 6, borderRadius: 8, border: 'none',
            background: 'transparent', color: 'var(--text-dim)',
            cursor: 'pointer', display: 'flex',
          }}
        >
          <Menu size={18} />
        </button>
        {/* Breadcrumb — desktop */}
        <div className="hidden lg:flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          <span>Workspace</span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>{title}</span>
        </div>
        {/* Title — mobile */}
        <h1 className="lg:hidden" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
      </div>

      <div style={{ flex: 1 }} />

      {/* Search — desktop only */}
      <div
        className="hidden lg:flex items-center gap-2"
        style={{
          padding: '6px 10px',
          background: 'var(--bg)',
          border: 'var(--card-border)',
          borderRadius: 8,
          minWidth: 220,
        }}
      >
        <Search size={13} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-mute)', flex: 1 }}>
          Search transactions, categories…
        </span>
        <span style={{
          fontSize: 10, color: 'var(--text-mute)',
          padding: '2px 5px',
          border: 'var(--card-border)',
          borderRadius: 4,
        }}>
          ⌘K
        </span>
      </div>

      {/* Notifications */}
      <NotificationsPanel />

      {/* Avatar — desktop */}
      <div
        className="hidden lg:flex items-center justify-center"
        style={{
          width: 32, height: 32,
          borderRadius: 8,
          background: 'var(--accent-soft)',
          color: 'var(--accent-ink)',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          cursor: 'pointer',
        }}
      >
        {initials}
      </div>
    </header>
  )
}