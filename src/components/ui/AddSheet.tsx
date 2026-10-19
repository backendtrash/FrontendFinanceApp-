import { useLocation, useNavigate }          from 'react-router-dom'
import { ChevronRight }                      from 'lucide-react'
import { useAddSheetStore }                  from '../../store/addSheetStore'
import { MENUS, type MenuOption }            from '../../config/addMenus'
import { processRecurringRules }             from '../../api/recurring'

const COLOR_VARS: Record<string, string> = {
  accent:   'var(--accent)',
  positive: 'var(--positive)',
  negative: 'var(--negative)',
  info:     'var(--info)',
  warning:  'var(--warning)',
}

export default function AddSheet() {
  const { isOpen, close, showToast, setPendingAction } = useAddSheetStore()
  const { pathname }                                    = useLocation()
  const navigate                                        = useNavigate()

  const menu = MENUS[pathname]

  const handleSelect = async (opt: MenuOption) => {
    if (opt.action === 'coming_soon') {
      showToast('Coming soon')
      return
    }
    close()
    if (opt.action === 'navigate' && opt.target) {
      navigate(opt.target)
    }
    if (opt.action === 'pending' && opt.pendingId) {
      setPendingAction(opt.pendingId)
      if (opt.target) navigate(opt.target)
    }
    if (opt.action === 'run_rules') {
      try { await processRecurringRules() } catch { /* ignore */ }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position:      'fixed',
          inset:         0,
          background:    'rgba(0,0,0,0.45)',
          backdropFilter:'blur(2px)',
          zIndex:        60,
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition:    'opacity 0.22s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        background: 'var(--surface)',
        borderRadius: '22px 22px 0 0',
        border:     'var(--card-border)',
        boxShadow:  'var(--shadow-lg)',
        padding:    '10px 14px env(safe-area-inset-bottom, 22px)',
        paddingBottom: `max(22px, env(safe-area-inset-bottom, 22px))`,
        zIndex:     61,
        transform:  isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
      }}>
        {/* Grabber */}
        <div style={{
          width: 38, height: 4, borderRadius: 2,
          background: 'var(--border-strong)',
          margin: '0 auto 12px',
        }} />

        {menu ? (
          <>
            {/* Header */}
            <div style={{ padding: '0 6px 10px' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em',
                color: 'var(--text)',
              }}>
                {menu.title}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 1 }}>
                {menu.sub}
              </div>
            </div>

            {/* Option rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {menu.options.map(opt => {
                const col  = COLOR_VARS[opt.color] ?? 'var(--accent)'
                const Icon = opt.icon
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 13,
                      width: '100%', padding: '11px 8px',
                      background: 'transparent', border: 'none',
                      borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{
                      width: 40, height: 40, borderRadius: 11,
                      background: col + '22',
                      color: col,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={17} strokeWidth={1.9} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                        {opt.label}
                      </span>
                      <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-mute)', marginTop: 1 }}>
                        {opt.desc}
                      </span>
                    </span>
                    <ChevronRight size={15} style={{ color: 'var(--text-mute)', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ padding: '8px 6px 10px', fontSize: 13, color: 'var(--text-mute)', textAlign: 'center' }}>
            No actions available for this page
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={close}
          style={{
            width: '100%', marginTop: 10, padding: 13,
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 12, color: 'var(--text-dim)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'background 120ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
        >
          Cancel
        </button>
      </div>
    </>
  )
}