import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

// ── React Query Client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes
      // Eliminates redundant refetches when navigating between pages
      staleTime: 1000 * 60 * 5,

      // Only retry once on failure
      retry: 1,

      // Never refetch on window focus — too aggressive for finance app
      refetchOnWindowFocus: false,

      // Keep previous data while fetching new data
      // Prevents blank screens on navigation
      placeholderData: (prev: any) => prev,
    },
  },
})
// Apply saved theme on load
// Apply saved theme on load
const savedTheme = localStorage.getItem('theme') ?? 'light'
document.documentElement.setAttribute('data-theme', savedTheme)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* React Query Devtools — only visible in development */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)