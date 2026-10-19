import { useState }          from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register }          from '../../api/auth'
import { useAuthStore }      from '../../store/authStore'
import { BarChart2, Target, CalendarDays, FileText } from 'lucide-react'
import FloatingIconCanvas    from '../../components/ui/FloatingIconCanvas'
import type { FormEvent }    from 'react'

const BRAND = '#702963'

const FEATURES = [
  { icon: <BarChart2 size={18} color="#fff" />, label: 'Analytics dashboard', description: 'Charts, trends, year-over-year' },
  { icon: <Target size={18} color="#fff" />,    label: 'Goal tracking',        description: 'Fixed amount + monthly rate'  },
  { icon: <CalendarDays size={18} color="#fff" />, label: 'Weekly view',       description: 'Move and split expenses'      },
  { icon: <FileText size={18} color="#fff" />,  label: 'PDF reports',          description: 'Branded monthly summaries'    },
]

export default function RegisterPage() {
  const navigate    = useNavigate()
  const { setAuth } = useAuthStore()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== password2) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const data = await register(email, password)
      if ((data as any).requires_confirmation) { setConfirmed(true); return }
      setAuth(data.user, data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 10, fontSize: 14,
    background: 'var(--bg)', color: 'var(--text)',
    outline: 'none', marginBottom: 12,
    fontFamily: 'var(--font-body)',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
  }

  // ── Email confirmation screen ──────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="login-outer" style={{ display: 'flex' }}>
        <div className="login-right-panel" style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
          <div className="login-form-card" style={{
            background: 'rgba(255,255,255,0.97)',
            borderRadius: '20px', padding: '40px 32px',
            width: '100%', maxWidth: '380px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <p style={{ fontSize: '20px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px' }}>
              Check your email
            </p>
            <p style={{ fontSize: '13px', color: '#999', margin: '0 0 6px' }}>
              We sent a confirmation link to:
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a2e', margin: '0 0 20px' }}>
              {email}
            </p>
            <p style={{ fontSize: '12px', color: '#bbb', margin: '0 0 24px', lineHeight: 1.6 }}>
              Click the link in the email to activate your account then sign in.
            </p>
            <Link to="/login" style={{ color: BRAND, fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              Go to login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-outer" style={{ display: 'flex' }}>

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
        {/* Physics icon canvas */}
        <FloatingIconCanvas />

        {/* Content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '40px',
          background: 'linear-gradient(to top, rgba(80,20,70,0.97) 0%, transparent 60%)',
          zIndex: 10,
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '11px',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '20px',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-display)' }}>S</span>
          </div>
          <p style={{ color: '#fff', fontSize: '24px', fontWeight: 500, margin: '0 0 8px', lineHeight: 1.2 }}>
            Start tracking<br />your finances.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.6 }}>
            Free to use. No credit card required.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, margin: 0 }}>{f.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <div
        className="login-right-panel"
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="login-form-card">
          {/* Mobile logo */}
          <div className="mobile-logo" style={{
            display: 'none', alignItems: 'center',
            gap: '10px', marginBottom: '24px',
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

          <p className="form-title" style={{ fontSize: '22px', fontWeight: 500, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Create account
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            Start tracking your finances today
          </p>

          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Email</label>
            <input type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />

            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Password</label>
            <input type="password" value={password} required onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" style={inputStyle} />

            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Confirm password</label>
            <input type="password" value={password2} required onChange={e => setPassword2(e.target.value)} placeholder="Repeat password" style={{ ...inputStyle, marginBottom: '20px' }} />

            {error && <p style={{ fontSize: '13px', color: '#e53e3e', marginBottom: '14px', textAlign: 'center' }}>{error}</p>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
              fontSize: '14px', fontWeight: 600, color: '#fff',
              background: loading ? '#9a5a8a' : BRAND,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: BRAND, textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}