import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { login, getMe } from '../api/auth'
import { getCurrencies } from '../api/currencies'
import { getCategories } from '../api/categories'
import { getExpenses, createExpense } from '../api/expenses'
import { getDashboard } from '../api/analytics'
import { getAccessToken } from '../api/client'

// ── Result Block ──────────────────────────────────────────────────────────
const Result = ({
  label,
  data,
  error,
}: {
  label:  string
  data?:  any
  error?: string
}) => (
  <div className="mb-4 p-4 border rounded-lg">
    <div className="font-bold text-sm mb-2">{label}</div>
    {error && (
      <pre className="text-red-500 text-xs whitespace-pre-wrap">{error}</pre>
    )}
    {data && (
      <pre className="text-green-600 text-xs whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    )}
  </div>
)

// ── Test Page ─────────────────────────────────────────────────────────────
export default function TestPage() {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore()

  const [email,    setEmail]    = useState('wowow53200@ryzid.com')
  const [password, setPassword] = useState('Test123!')
  const [results,  setResults]  = useState<Record<string, any>>({})
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [loading,  setLoading]  = useState<Record<string, boolean>>({})

  // ── Helper ──────────────────────────────────────────────────────────────
  const run = async (key: string, fn: () => Promise<any>) => {
    setLoading(p => ({ ...p, [key]: true }))
    setErrors(p => ({ ...p, [key]: '' }))
    try {
      const result = await fn()
      setResults(p => ({ ...p, [key]: result }))
    } catch (e: any) {
      const msg = e?.response?.data?.detail
        ? JSON.stringify(e.response.data.detail)
        : e.message
      setErrors(p => ({ ...p, [key]: msg }))
    } finally {
      setLoading(p => ({ ...p, [key]: false }))
    }
  }

  // ── Test: Login ──────────────────────────────────────────────────────────
  const testLogin = async () => {
    await run('login', async () => {
      const data = await login(email, password)
      setAuth(data.user, data.access_token, data.refresh_token)
      return {
        user:          data.user,
        access_token:  data.access_token.slice(0, 30) + '...',
        refresh_token: data.refresh_token,
      }
    })
  }

  // ── Test: Get Me ─────────────────────────────────────────────────────────
  const testMe = () => run('me', getMe)

  // ── Test: Currencies ─────────────────────────────────────────────────────
  const testCurrencies = () => run('currencies', getCurrencies)

  // ── Test: Categories ─────────────────────────────────────────────────────
  const testCategories = () => run('categories', () => getCategories())

  // ── Test: List Expenses ───────────────────────────────────────────────────
  const testExpenses = () => run('expenses', () => getExpenses())

  // ── Test: Create Expense ──────────────────────────────────────────────────
  const testCreateExpense = async () => {
    await run('createExpense', async () => {
      // Get MXN currency id first
      const currencies = await getCurrencies()
      const mxn = currencies.find(c => c.code === 'MXN')
      if (!mxn) throw new Error('MXN currency not found')

      return createExpense({
        amount:       99.50,
        currency_id:  mxn.id,
        date:         new Date().toISOString().split('T')[0],
        notes:        'Test expense from frontend',
        is_recurring: false,
      })
    })
  }

  // ── Test: Dashboard Analytics ─────────────────────────────────────────────
  const testDashboard = () => run('dashboard', () => getDashboard())

  // ── Test: Token in Memory ─────────────────────────────────────────────────
  const testToken = () => {
    const token = getAccessToken()
    setResults(p => ({
      ...p,
      token: token
        ? `Token present: ${token.slice(0, 40)}...`
        : 'No token in memory',
    }))
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">
        🧪 API Debug Test Page
      </h1>

      {/* Auth status */}
      <div className={`mb-6 p-3 rounded-lg text-sm font-medium ${
        isAuthenticated
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {isAuthenticated
          ? `✅ Authenticated as ${user?.email}`
          : '❌ Not authenticated'}
      </div>

      {/* Login form */}
      <div className="mb-6 p-4 border rounded-lg">
        <div className="font-bold text-sm mb-3">1. Login First</div>
        <input
          className="border rounded px-3 py-2 text-sm w-full mb-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="border rounded px-3 py-2 text-sm w-full mb-3"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button
          onClick={testLogin}
          disabled={loading.login}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm
                     hover:bg-blue-700 disabled:opacity-50 w-full"
        >
          {loading.login ? 'Logging in...' : 'Login'}
        </button>
        {results.login && (
          <Result label="Login Response" data={results.login} />
        )}
        {errors.login && (
          <Result label="Login Error" error={errors.login} />
        )}
      </div>

      {/* API Tests */}
      <div className="font-bold text-sm mb-3">
        2. Test API Calls (login first)
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { key: 'token',         label: '🔑 Check Token',       fn: testToken },
          { key: 'me',            label: '👤 GET /me',           fn: testMe },
          { key: 'currencies',    label: '💱 GET currencies',    fn: testCurrencies },
          { key: 'categories',    label: '🏷️ GET categories',    fn: testCategories },
          { key: 'expenses',      label: '💸 GET expenses',      fn: testExpenses },
          { key: 'createExpense', label: '➕ POST expense',      fn: testCreateExpense },
          { key: 'dashboard',     label: '📊 GET dashboard',     fn: testDashboard },
        ].map(({ key, label, fn }) => (
          <button
            key={key}
            onClick={fn}
            disabled={loading[key]}
            className="border rounded px-3 py-2 text-sm text-left
                       hover:bg-gray-50 disabled:opacity-50"
          >
            {loading[key] ? '⏳ Loading...' : label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="font-bold text-sm mb-3">3. Results</div>
      {Object.entries(results).map(([key, data]) => (
        <Result key={key} label={key} data={data} />
      ))}
      {Object.entries(errors)
        .filter(([, v]) => v)
        .map(([key, error]) => (
          <Result key={key} label={`${key} ERROR`} error={error} />
        ))}

      {/* Logout */}
      {isAuthenticated && (
        <button
          onClick={clearAuth}
          className="mt-4 text-sm text-red-500 underline"
        >
          Clear auth (logout)
        </button>
      )}
    </div>
  )
}