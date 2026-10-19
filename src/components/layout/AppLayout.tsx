import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingDown,
  BarChart2, Settings, Plus,
} from 'lucide-react'
import Sidebar          from './Sidebar'
import Header           from './Header'
import AddSheet         from '../ui/AddSheet'
import { useAddSheetStore } from '../../store/addSheetStore'

const TAB_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home'     },
  { to: '/expenses',  icon: TrendingDown,    label: 'Spend'    },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/settings',  icon: Settings,        label: 'More'     },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { pathname }                  = useLocation()
  const navigate                      = useNavigate()
  const { open, toast, clearToast }   = useAddSheetStore()

  // Auto-dismiss toast after 2.5 s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clearToast, 2500)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — slide-in on mobile, fixed on desktop */}
      <div className={`
        fixed top-0 left-0 h-full z-30 transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Topbar */}
      <div className="fixed top-0 right-0 left-0 lg:left-[232px] z-10">
        <Header onMenuClick={() => setSidebarOpen(p => !p)} />
      </div>

      {/* Main content */}
      <main
        className="lg:ml-[232px] pt-14 min-h-screen pb-20 lg:pb-0"
        style={{ background: 'var(--bg)' }}
      >
        <div style={{ maxWidth: 1280, padding: '28px 28px 40px', margin: '0 auto' }}
             className="px-4 lg:px-7">
          {children}
        </div>
      </main>

      {/* ── Mobile bottom tab bar ──────────────────────────────────── */}
      <nav className="mobile-tabbar lg:hidden">
        {TAB_ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <button
            key={to}
            className={`mobile-tabbar-btn ${pathname === to ? 'active' : ''}`}
            onClick={() => navigate(to)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}

        {/* FAB */}
        <button
          className="mobile-tabbar-fab"
          onClick={open}
          aria-label="Add transaction"
        >
          <Plus size={22} />
        </button>

        {TAB_ITEMS.slice(2).map(({ to, icon: Icon, label }) => (
          <button
            key={to}
            className={`mobile-tabbar-btn ${pathname === to ? 'active' : ''}`}
            onClick={() => navigate(to)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Add sheet (mobile) ─────────────────────────────────────── */}
      <AddSheet />

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface)', border: 'var(--card-border)',
          borderRadius: 10, padding: '9px 16px',
          fontSize: 13, fontWeight: 600, color: 'var(--text-dim)',
          boxShadow: 'var(--shadow-lg)', zIndex: 70,
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}