import { useState }        from 'react'
import { Bell, CheckCircle, AlertTriangle } from 'lucide-react'
import { useBudgetAlerts } from '../../hooks/useQueries'
import { formatMXN, formatPct } from '../../utils/formatters'

export default function NotificationsPanel() {
  const [open, setOpen]       = useState(false)
  const { data: alerts = [] } = useBudgetAlerts(10)
  const unread                = alerts.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: 32, height: 32,
          borderRadius: 8,
          background: 'var(--bg)',
          border: 'var(--card-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-dim)', cursor: 'pointer',
          position: 'relative',
          transition: 'background 120ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
      >
        <Bell size={14} />
        {unread > 0 && (
          <div style={{
            position: 'absolute', top: 6, right: 7,
            width: 6, height: 6, borderRadius: 3,
            background: 'var(--negative)',
          }} />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: 40,
            width: 300,
            background: 'var(--surface)',
            border: 'var(--card-border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 30,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: 'var(--card-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Budget Alerts</p>
              {unread > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  background: 'var(--negative-soft)',
                  color: 'var(--negative)',
                  padding: '2px 8px', borderRadius: 999,
                }}>
                  {unread} new
                </span>
              )}
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {alerts.length === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center' }}>
                  <CheckCircle size={24} style={{ color: 'var(--positive)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>All budgets on track</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div
                    key={alert.id}
                    style={{
                      padding: '10px 16px',
                      borderBottom: 'var(--card-border)',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <AlertTriangle size={13} style={{ color: 'var(--warning)', marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)' }}>
                            Budget at {formatPct(Number(alert.pct_spent))}
                          </p>
                          <p style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
                            {formatMXN(Number(alert.amount_spent))} of {formatMXN(Number(alert.limit_amount))} limit
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: 10.5, color: 'var(--text-mute)', whiteSpace: 'nowrap' }}>
                        {alert.triggered_date}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '10px 16px', borderTop: 'var(--card-border)' }}>
              <a
                href="/budgets"
                style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
                onClick={() => setOpen(false)}
              >
                View all budgets →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  )
}