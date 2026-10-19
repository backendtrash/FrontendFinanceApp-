import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }       from './hooks/useAuth'
import { usePreferencesStore } from './store/preferencesStore'
import { useEffect }           from 'react'
import { getPreferences }      from './api/preferences'
import AppLayout         from './components/layout/AppLayout'
import LoginPage         from './pages/auth/LoginPage'
import RegisterPage      from './pages/auth/RegisterPage'
import CallbackPage      from './pages/auth/CallbackPage'
import DashboardPage     from './pages/dashboard/DashboardPage'
import ExpensesPage      from './pages/expenses/ExpensesPage'
import EarningsPage      from './pages/earnings/EarningsPage'
import CategoriesPage    from './pages/categories/CategoriesPage'
import BudgetsPage       from './pages/budgets/BudgetsPage'
import RecurringPage     from './pages/recurring/RecurringPage'
import AnalyticsPage     from './pages/analytics/AnalyticsPage'
import GoalsPage         from './pages/goals/GoalsPage'
import WeekViewPage      from './pages/weekview/WeekViewPage'
import LoadingSpinner    from './components/ui/LoadingSpinner'
import ProjectedPage from './pages/projected/ProjectedPage'
import SettingsPage from './pages/settings/SettingsPage'
import FundsPage from './pages/funds/FundsPage'


// ── Protected Route ────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Restoring session..." />
      </div>
    )
  }

  return isAuthenticated
    ? <>{children}</>
    : <Navigate to="/login" replace />
}

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated }    = useAuth()
  const { setWeekStartDay }    = usePreferencesStore()

  useEffect(() => {
    if (isAuthenticated) {
      getPreferences()
        .then(p => setWeekStartDay(p.week_start_day))
        .catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"         element={<LoginPage />} />
      <Route path="/register"      element={<RegisterPage />} />
      <Route path="/auth/callback" element={<CallbackPage />} />

      {/* Protected routes — all wrapped in AppLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout><DashboardPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <AppLayout><ExpensesPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/earnings"
        element={
          <ProtectedRoute>
            <AppLayout><EarningsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <AppLayout><CategoriesPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <AppLayout><BudgetsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recurring"
        element={
          <ProtectedRoute>
            <AppLayout><RecurringPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projected"
        element={
          <ProtectedRoute>
            <AppLayout><ProjectedPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AppLayout><AnalyticsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <AppLayout><GoalsPage /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/weeks"
        element={
          <ProtectedRoute>
            <AppLayout><WeekViewPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/funds"
        element={
          <ProtectedRoute>
            <AppLayout><FundsPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout><SettingsPage /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="/"   element={<Navigate to="/dashboard" replace />} />
      <Route path="*"   element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}