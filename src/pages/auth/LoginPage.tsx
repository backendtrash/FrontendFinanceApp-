import { useState }                          from 'react'
import { Link, useNavigate }                 from 'react-router-dom'
import { login }                             from '../../api/auth'
import { useAuthStore }                      from '../../store/authStore'
import FloatingIconCanvas from '../../components/ui/FloatingIconCanvas'
import type { FormEvent }                    from 'react'

const BRAND  = '#702963'


export default function LoginPage() {
  const navigate        = useNavigate()
  const { setAuth }     = useAuthStore()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 10,
    fontSize: 14,
    background: 'var(--bg)',
    color: 'var(--text)',
    outline: 'none',
    marginBottom: 12,
    fontFamily: 'var(--font-body)',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
    }}
      className="login-outer"
    >

      {/* ── Left panel — desktop only ───────────────────────────────── */}
      <div
        className="hidden-mobile"
        style={{
          flex: '0 0 50%',
          background: BRAND,
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100dvh',
        }}
      >
        {/* Physics icon canvas — fills entire left panel */}
        <FloatingIconCanvas />

        {/* Content overlaid on top */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '40px',
          background: 'linear-gradient(to top, rgba(80,20,70,0.97) 0%, transparent 60%)',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '11px',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
            pointerEvents: 'auto',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-display)' }}>S</span>
          </div>
          <p style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Know your numbers.<br />Own your future.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
            Personal finance made clear.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────────────── */}
      {/* Desktop: white panel */}
      {/* Mobile: full purple with glass card */}
      <div
        className="login-right-panel"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 40px',
        }}
      >
        {/* Glass card — mobile only wrapper */}
        <div className="login-form-card">
          {/* Mobile logo — hidden on desktop */}
          <div className="mobile-logo" style={{
            display: 'none',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '11px',
              background: BRAND, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-display)' }}>S</span>
            </div>
            <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              BudgetTrash
            </span>
          </div>

          <p style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 6px', color: 'var(--text-primary)' }}
             className="form-title">
            Sign in
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            Welcome back to BudgetTrash
          </p>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
              Email
            </label>
            <input
              type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />

            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
              Password
            </label>
            <input
              type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />

            <div style={{ textAlign: 'right', marginBottom: '18px', marginTop: '-4px' }}>
              <span style={{ fontSize: '12px', color: BRAND, cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: '#e53e3e', marginBottom: '14px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px',
                borderRadius: '10px', border: 'none',
                fontSize: '14px', fontWeight: 600,
                color: '#fff',
                background: loading ? '#9a5a8a' : BRAND,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Testimonial */}
          <div style={{
            background: 'rgba(112,41,99,0.05)',
            borderLeft: `2px solid ${BRAND}`,
            borderRadius: '0 8px 8px 0',
            padding: '12px 14px',
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.6 }}>
              " My money vanished into a black hole—aka my daily iced latte. Now I track every sip, and my wallet stopped crying."
            </p>
            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
              — Cashidy Bin, Proud User
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            No account?{' '}
            <Link to="/register" style={{ color: BRAND, textDecoration: 'none', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}