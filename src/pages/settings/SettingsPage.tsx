import { useEffect, useState }        from 'react'
import { Download, User, Sliders, Globe, Bell, Lock, CreditCard, Trash2, ChevronRight } from 'lucide-react'
import { usePreferences, useUpdatePreferences, useCurrencies, useDashboard, useCreateEarning, useCreateExpense } from '../../hooks/useQueries'
import { usePreferencesStore }   from '../../store/preferencesStore'
import { useAuthStore }          from '../../store/authStore'
import { useThemeStore }         from '../../store/themeStore'
import Card                      from '../../components/ui/Card'
import LoadingSpinner             from '../../components/ui/LoadingSpinner'
import Badge                     from '../../components/ui/Badge'
import Modal                     from '../../components/ui/Modal'
import Input                     from '../../components/ui/Input'
import Button                    from '../../components/ui/Button'
import { formatMXN }             from '../../utils/formatters'

const BRAND = '#702963'

// ── Pref row ─────────────────────────────────────────────────────────────
function PrefRow({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: 'var(--card-border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{hint}</div>}
      </div>
      {control}
    </div>
  )
}

// ── Danger row ───────────────────────────────────────────────────────────
function DangerRow({ label, description, btnLabel, neutral, onConfirm }: {
  label: string; description: string; btnLabel: string; neutral?: boolean; onConfirm: () => Promise<void>
}) {
  const [loading,  setLoading]  = useState(false)
  const [pending,  setPending]  = useState(false)

  const handleClick = () => {
    if (!pending) { setPending(true); return }
    setLoading(true)
    onConfirm().finally(() => { setLoading(false); setPending(false) })
  }

  return (
    <div style={{ border: `1px solid ${neutral ? 'var(--border)' : 'var(--negative-soft)'}`, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>{description}</div>
        {pending && !neutral && (
          <p style={{ fontSize: 11.5, color: 'var(--negative)', marginTop: 6, fontWeight: 600 }}>Click again to confirm — this cannot be undone.</p>
        )}
      </div>
      <button onClick={handleClick} disabled={loading} style={{
        padding: '7px 14px', flexShrink: 0,
        border: `1px solid ${neutral ? 'var(--border)' : pending ? 'var(--negative)' : 'var(--negative-soft)'}`,
        background: pending && !neutral ? 'var(--negative)' : 'transparent',
        color: neutral ? 'var(--text)' : pending ? '#fff' : 'var(--negative)',
        borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 150ms ease', opacity: loading ? 0.5 : 1,
      }}>
        {loading ? '…' : pending && !neutral ? `Confirm ${btnLabel}` : btnLabel}
      </button>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'profile',      label: 'Profile',       icon: User },
  { id: 'preferences',  label: 'Preferences',   icon: Sliders },
  { id: 'currencies',   label: 'Currencies',    icon: Globe },
  { id: 'danger',       label: 'Danger zone',   icon: Trash2, danger: true },
]

// ── Settings Page ──────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { data: prefs, isLoading }      = usePreferences()
  const updatePrefs                      = useUpdatePreferences()
  const { weekStartDay, setWeekStartDay } = usePreferencesStore()
  const { user, clearAuth }             = useAuthStore()
  const { isDark, toggleDark }          = useThemeStore()
  const { data: currencies = [] }       = useCurrencies()
  const [activeSection, setActiveSection] = useState('profile')
  const [primaryCode, setPrimaryCode]   = useState(() => localStorage.getItem('primaryCurrency') ?? 'MXN')

  const setAsPrimary = (code: string) => {
    setPrimaryCode(code)
    localStorage.setItem('primaryCurrency', code)
  }

  const { data: dashboard }    = useDashboard()
  const createEarning          = useCreateEarning()
  const createExpense          = useCreateExpense()
  const currentNet             = Number(dashboard?.net_balance ?? 0)
  const mxnId                  = currencies.find(c => c.code === 'MXN')?.id ?? ''
  const [balanceOpen, setBalanceOpen] = useState(false)
  const [target,      setTarget]      = useState('')
  const [balanceErr,  setBalanceErr]  = useState('')
  const balanceBusy = createEarning.isPending || createExpense.isPending

  const handleSetBalance = async () => {
    const t = parseFloat(target)
    if (isNaN(t)) { setBalanceErr('Enter a target amount'); return }
    if (!mxnId)   { setBalanceErr('MXN currency not found'); return }
    const delta = t - currentNet
    const today = new Date().toISOString().slice(0, 10)
    try {
      if (delta > 0.005)       await createEarning.mutateAsync({ amount: delta,  currency_id: mxnId, date: today, notes: 'Balance adjustment', is_recurring: false })
      else if (delta < -0.005) await createExpense.mutateAsync({ amount: -delta, currency_id: mxnId, date: today, notes: 'Balance adjustment', is_recurring: false })
      setBalanceOpen(false); setTarget(''); setBalanceErr('')
    } catch (e: any) {
      setBalanceErr(e?.response?.data?.detail || 'Failed to set balance')
    }
  }

  useEffect(() => { if (prefs) setWeekStartDay(prefs.week_start_day) }, [prefs])

  const handleWeekStartChange = async (day: number) => {
    setWeekStartDay(day)
    try { await updatePrefs.mutateAsync({ week_start_day: day }) }
    catch { setWeekStartDay(prefs?.week_start_day ?? 1) }
  }

  const handleExport = async () => {
    const { exportAllData } = await import('../../api/goals')
    const blob = await exportAllData()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `budgettrash-export-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const initials   = user?.email ? user.email.slice(0, 2).toUpperCase() : 'BT'
  const username   = user?.email?.split('@')[0] ?? 'User'
  const memberSince = null

  if (isLoading) return <div className="py-16 flex justify-center"><LoadingSpinner text="Loading settings…" /></div>

  // ── Content sections ───────────────────────────────────────────────────
  const profileSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>Profile</h1>
      {/* Avatar block */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 84, height: 84, borderRadius: 999, background: `linear-gradient(135deg, ${BRAND}, #4d1c43)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{username}</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
              {user?.email}{memberSince ? ` · Member since ${memberSince}` : ''}
            </div>
          </div>
        </div>
      </Card>

      {/* Account info */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Account</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Username', value: username },
            { label: 'Email address', value: user?.email ?? '—' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{f.label}</label>
              <div style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', border: 'var(--card-border)', borderRadius: 8 }}>{f.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const prefsSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>Preferences</h1>
      <Card>
        <div style={{ marginTop: 4 }}>
          <PrefRow label="Week starts on" hint="Affects Week View day grouping"
            control={
              <select value={weekStartDay} onChange={e => handleWeekStartChange(Number(e.target.value))}
                style={{ padding: '6px 10px', fontSize: 12, border: 'var(--card-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', outline: 'none', minWidth: 140, cursor: 'pointer' }}>
                {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            }
          />
          <PrefRow label="Net balance" hint="Adjust this month's net to a target"
            control={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="font-mono" style={{ fontSize: 12.5, fontWeight: 600, color: currentNet >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{formatMXN(currentNet)}</span>
                <button onClick={() => { setTarget(String(currentNet)); setBalanceErr(''); setBalanceOpen(true) }}
                  style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'var(--card-border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}>
                  Set
                </button>
              </div>
            }
          />
          <PrefRow label="Theme" hint="Light or dark appearance"
            control={
              <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-alt)', borderRadius: 8 }}>
                {['Light', 'Dark'].map((d) => (
                  <button key={d} onClick={() => { if ((d === 'Dark') !== isDark) toggleDark() }} style={{
                    padding: '4px 12px', border: 'none', borderRadius: 5, cursor: 'pointer',
                    background: (d === 'Dark') === isDark ? 'var(--surface)' : 'transparent',
                    fontSize: 11.5, fontWeight: 600,
                    color: (d === 'Dark') === isDark ? 'var(--text)' : 'var(--text-mute)',
                    boxShadow: (d === 'Dark') === isDark ? 'var(--shadow)' : 'none',
                  }}>{d}</button>
                ))}
              </div>
            }
          />
          {updatePrefs.isPending && <p style={{ fontSize: 11.5, color: 'var(--text-mute)', marginTop: 10 }}>Saving…</p>}
          {updatePrefs.isSuccess  && <p style={{ fontSize: 11.5, color: BRAND, marginTop: 10, fontWeight: 600 }}>Saved ✓</p>}
        </div>
      </Card>
      <Modal open={balanceOpen} onClose={() => setBalanceOpen(false)} title="Set net balance">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Current net this month</span>
            <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: currentNet >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{formatMXN(currentNet)}</span>
          </div>
          <Input label="Target net balance" type="number" step="0.01" placeholder="0.00" value={target} onChange={e => setTarget(e.target.value)} hint="Creates a one-off income or expense for the difference, dated today" />
          {balanceErr && <p style={{ fontSize: 12, color: 'var(--negative)' }}>{balanceErr}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" className="flex-1" onClick={() => setBalanceOpen(false)}>Cancel</Button>
            <Button className="flex-1" loading={balanceBusy} onClick={handleSetBalance}>Set balance</Button>
          </div>
        </div>
      </Modal>
    </div>
  )

  const currenciesSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>Currencies</h1>
      {currencies.length > 0 && (
        <Card>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginBottom: 12 }}>Tracked currencies and their exchange rates · tap to set primary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {currencies.map(c => {
              const isPrimary = c.code === primaryCode
              return (
                <div key={c.id} onClick={() => setAsPrimary(c.code)}
                  style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr auto', alignItems: 'center', gap: 14, padding: '10px 14px', background: isPrimary ? 'var(--accent-soft)' : 'var(--bg)', border: isPrimary ? '1.5px solid var(--accent)' : 'var(--card-border)', borderRadius: 10, cursor: 'pointer', transition: 'all 150ms ease' }}>
                  <span className="font-mono" style={{ fontWeight: 700, fontSize: 13, color: isPrimary ? 'var(--accent-ink)' : 'var(--text)' }}>{c.code}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{c.name}</span>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {c.code !== 'MXN'
                      ? `1 ${c.code} = ${Number(c.exchange_rate ?? 1).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
                      : `Base · 1.00 MXN`}
                  </span>
                  {isPrimary
                    ? <Badge variant="accent">Primary</Badge>
                    : <span style={{ fontSize: 11, color: 'var(--text-mute)', fontWeight: 500 }}>Set</span>}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )

  const dangerSection = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--negative)', margin: 0 }}>Danger zone</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ border: 'var(--card-border)', background: 'var(--surface)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Export all data</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>Download every record as a JSON archive</div>
          </div>
          <button onClick={handleExport} style={{ padding: '7px 14px', flexShrink: 0, border: 'var(--card-border)', background: 'transparent', color: 'var(--text)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={13} /> Export
          </button>
        </div>
        <DangerRow label="Reset workspace" description="Delete all transactions but keep your account and categories" btnLabel="Reset"
          onConfirm={async () => { const { resetWorkspace } = await import('../../api/goals'); await resetWorkspace() }} />
        <DangerRow label="Delete account" description="Permanently delete your account and all associated data" btnLabel="Delete account"
          onConfirm={async () => { const { deleteAccount } = await import('../../api/auth'); await deleteAccount(); clearAuth(); window.location.href = '/login' }} />
      </div>
    </div>
  )

  const sectionContent = activeSection === 'profile' ? profileSection
    : activeSection === 'preferences' ? prefsSection
    : activeSection === 'currencies' ? currenciesSection
    : dangerSection

  return (
    <>
      {/* ══ DESKTOP: sidebar + content ══════════════════════════════ */}
      <div className="hidden sm:grid" style={{ gridTemplateColumns: '220px 1fr', gap: 24, maxWidth: 1100 }}>
        {/* Sidebar nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px 8px' }}>Settings</div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = activeSection === item.id
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left', position: 'relative',
                color: item.danger ? 'var(--negative)' : active ? 'var(--accent-ink)' : 'var(--text)',
                background: active ? 'var(--accent-soft)' : 'transparent',
                fontWeight: active ? 600 : 500,
                transition: 'background 120ms ease',
              }}>
                {active && <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 2.5, borderRadius: 2, background: 'var(--accent)' }} />}
                <Icon size={15} strokeWidth={1.75} style={{ color: item.danger ? 'var(--negative)' : active ? 'var(--accent)' : 'var(--text-dim)', flexShrink: 0 }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div>{sectionContent}</div>
      </div>

      {/* ══ MOBILE: profile card + grouped sections ══════════════════ */}
      <div className="flex sm:hidden flex-col gap-4">
        {/* Profile card */}
        <div style={{ padding: 16, background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: `linear-gradient(135deg, ${BRAND}, #4d1c43)`, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{username}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{user?.email}</div>
            <span style={{ display: 'inline-block', marginTop: 6, fontSize: 9.5, padding: '2px 7px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>BudgetTrash</span>
          </div>
          <ChevronRight size={14} style={{ color: 'var(--text-mute)' }} />
        </div>

        {/* Preferences section */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 4px 8px' }}>Preferences</div>
          <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { ic: Globe,   label: 'Primary currency', value: primaryCode },
              { ic: Sliders, label: 'Week starts on', value: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekStartDay] },
              { ic: Bell,    label: 'Theme',          value: isDark ? 'Dark' : 'Light' },
            ].map((item, _i) => {
              const Icon = item.ic
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: _i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg)', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.label}</div>
                  {item.value && <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{item.value}</div>}
                  <ChevronRight size={13} style={{ color: 'var(--text-mute)' }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Account section */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 4px 8px' }}>Account</div>
          <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
            {[
              { ic: User,       label: 'Profile',   value: username },
              { ic: Lock,       label: 'Password',  value: '' },
              { ic: CreditCard, label: 'Billing',   value: 'Free plan' },
            ].map((item, _i) => {
              const Icon = item.ic
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: _i === 0 ? 'none' : '1px solid var(--border)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg)', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{item.label}</div>
                  {item.value && <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{item.value}</div>}
                  <ChevronRight size={13} style={{ color: 'var(--text-mute)' }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Data section */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-mute)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 4px 8px' }}>Data</div>
          <div style={{ background: 'var(--surface)', border: 'var(--card-border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg)', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download size={14} strokeWidth={1.75} />
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Export all data</div>
              <ChevronRight size={13} style={{ color: 'var(--text-mute)' }} />
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--negative)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 4px 8px' }}>Danger zone</div>
          <button onClick={() => {
            if (!confirm('Delete your account? This cannot be undone.')) return
            import('../../api/auth').then(({ deleteAccount }) => deleteAccount().then(() => { clearAuth(); window.location.href = '/login' }))
          }} style={{ width: '100%', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--negative-soft)', borderRadius: 12, color: 'var(--negative)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
            Delete account
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)' }}>
          BudgetTrash · made in MX
        </div>
      </div>
    </>
  )
}