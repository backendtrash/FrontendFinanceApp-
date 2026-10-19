import { NavLink, useNavigate }  from 'react-router-dom'
import {
  LayoutDashboard, TrendingDown, TrendingUp,
  Target, Trophy, CalendarDays, RefreshCw,
  Tag, BarChart2, LineChart, Settings,
  Moon, Sun, LogOut, ChevronDown,
} from 'lucide-react'
import { useAuthStore }    from '../../store/authStore'
import { useThemeStore }   from '../../store/themeStore'
import { logout }          from '../../api/auth'
import { useQueryClient }  from '@tanstack/react-query'
import { QUERY_KEYS }      from '../../hooks/useQueries'
import * as analyticsApi   from '../../api/analytics'
import * as budgetsApi     from '../../api/budgets'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'   },
      { to: '/analytics',  icon: BarChart2,        label: 'Analytics'   },
      { to: '/weeks',      icon: CalendarDays,     label: 'Week View'   },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/expenses',   icon: TrendingDown, label: 'Expenses'    },
      { to: '/earnings',   icon: TrendingUp,   label: 'Earnings'    },
      { to: '/budgets',    icon: Target,       label: 'Budgets'     },
      { to: '/recurring',  icon: RefreshCw,    label: 'Recurring'   },
      { to: '/projected',  icon: LineChart,    label: 'Plan' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/goals',      icon: Trophy,    label: 'Goals'         },
      { to: '/categories', icon: Tag,       label: 'Categories'    },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, clearAuth }    = useAuthStore()
  const { isDark, toggleDark } = useThemeStore()
  const navigate               = useNavigate()
  const qc                     = useQueryClient()

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'S'

  return (
    <aside
      className="h-[calc(100dvh-64px)] lg:h-dvh"
      style={{
        width: 232,
        background: 'var(--surface)',
        borderRight: 'var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Workspace pill ─────────────────────────────────────────── */}
      <div style={{ padding: '0 12px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px',
          background: 'var(--bg)',
          border: 'var(--card-border)',
          borderRadius: 10,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
              {user?.email?.split('@')[0] ?? 'Personal'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>Personal</div>
          </div>
          <ChevronDown size={12} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
        </div>
      </div>

      {/* ── Nav groups — scrollable ────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div style={{
              padding: '0 10px 5px',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-mute)',
            }}>
              {group.label}
            </div>
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                onMouseEnter={() => {
                  if (to === '/dashboard') {
                    const today = new Date()
                    qc.prefetchQuery({
                      queryKey:  [...QUERY_KEYS.dashboard, today.getFullYear(), today.getMonth() + 1],
                      queryFn:   () => analyticsApi.getDashboard(),
                      staleTime: 1000 * 60 * 5,
                    })
                  }
                  if (to === '/budgets') {
                    qc.prefetchQuery({
                      queryKey:  [...QUERY_KEYS.budgets, true],
                      queryFn:   () => budgetsApi.getBudgets(true),
                      staleTime: 1000 * 60 * 5,
                    })
                  }
                }}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 10px',
                  margin: '1px 0',
                  borderRadius: 8,
                  textDecoration: 'none',
                  position: 'relative',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-ink)' : 'var(--text)',
                  background: isActive ? 'var(--accent-soft)' : 'transparent',
                  transition: 'background 120ms ease, color 120ms ease',
                })}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div style={{
                        position: 'absolute',
                        left: 0, top: 8, bottom: 8,
                        width: 2.5,
                        borderRadius: 2,
                        background: 'var(--accent)',
                      }} />
                    )}
                    <Icon
                      size={15}
                      strokeWidth={1.75}
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)', flexShrink: 0 }}
                    />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '12px',
        borderTop: 'var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        {/* User email */}
        <div style={{ padding: '6px 10px 8px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </p>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '7px 10px',
            borderRadius: 8, border: 'none', background: 'transparent',
            fontSize: 12.5, fontWeight: 500, color: 'var(--text-dim)',
            cursor: 'pointer', textAlign: 'left',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '7px 10px',
            borderRadius: 8, border: 'none', background: 'transparent',
            fontSize: 12.5, fontWeight: 500, color: 'var(--negative)',
            cursor: 'pointer', textAlign: 'left',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--negative-soft)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}