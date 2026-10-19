import { useEffect, useState } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useAuthStore }        from '../../store/authStore'
import LoadingSpinner           from '../../components/ui/LoadingSpinner'
import apiClient                from '../../api/client'

export default function CallbackPage() {
  const navigate        = useNavigate()
  const { setAuth }     = useAuthStore()
  const [error, setError] = useState('')

  useEffect(() => {
    /*
     * Supabase email confirmation redirects to:
     * https://your-app.vercel.app/auth/callback#access_token=...
     *
     * We extract the tokens from the URL hash and store them.
     * Then redirect to dashboard.
     */
    const hash   = window.location.hash
    const params = new URLSearchParams(hash.replace('#', '?'))

    const accessToken  = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      // Fetch user info with the new token
      apiClient.defaults.headers.common['Authorization'] =
        `Bearer ${accessToken}`

      apiClient.get('/api/v1/auth/me')
        .then(res => {
          setAuth(
            { id: res.data.id, email: res.data.email },
            accessToken,
            refreshToken,
          )
          navigate('/dashboard')
        })
        .catch(() => {
          setError('Failed to verify your account. Please try logging in.')
        })
    } else {
      setError('Invalid confirmation link. Please try registering again.')
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center
                      justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200
                        shadow-sm w-full max-w-sm p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <a href="/login" className="text-sm text-blue-600 hover:underline">
            {'Go to login'}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner text="Confirming your account..." />
    </div>
  )
}