# Budget Tracker — Frontend

React single-page application for the Budget Tracker personal finance app.

## Tech Stack

- **Framework:** React 19 + Vite 8
- **Language:** TypeScript 6 (strict mode)
- **Styling:** TailwindCSS 4
- **State:** Zustand (auth + theme)
- **Server State:** TanStack Query v5
- **HTTP:** Axios with JWT interceptor + refresh logic
- **Charts:** Recharts
- **Icons:** Lucide React
- **PDF:** jsPDF + jspdf-autotable
- **Deploy:** Vercel

## Project Structure
src/
├── api/                 # Axios API clients per module
│   ├── client.ts        # Base Axios instance + JWT interceptor
│   ├── auth.ts
│   ├── expenses.ts
│   ├── earnings.ts
│   ├── categories.ts
│   ├── currencies.ts
│   ├── budgets.ts
│   ├── recurring.ts
│   ├── analytics.ts
│   ├── goals.ts
│   └── projected.ts
│
├── components/
│   ├── charts/          # Recharts chart components
│   │   ├── MonthlyChart.tsx      # 3-bar: income/expenses/projected
│   │   ├── CategoryChart.tsx     # Pie chart
│   │   ├── WeeklyChart.tsx       # Weekly cash flow bars
│   │   ├── ProjectedChart.tsx    # Projected vs real line chart
│   │   ├── BudgetActualChart.tsx # Budget vs actual bars
│   │   └── NetWorthChart.tsx     # Cumulative net worth area chart
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx         # Sidebar + header wrapper
│   │   ├── Sidebar.tsx           # Nav + dark mode + logout
│   │   ├── Header.tsx            # Page title + notifications
│   │   └── NotificationsPanel.tsx
│   │
│   └── ui/              # Reusable UI primitives
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       ├── MonthPicker.tsx       # Pill-style month navigator
│       ├── Skeleton.tsx          # Loading skeletons
│       ├── FilterBar.tsx
│       ├── DangerZone.tsx        # Destructive action with confirm
│       ├── ImportModal.tsx       # CSV/JSON import with preview
│       ├── RecurringToggle.tsx   # Toggle for recurring rules
│       ├── EditExpenseModal.tsx
│       └── EditEarningModal.tsx
│
├── hooks/
│   └── useQueries.ts    # All TanStack Query hooks + QUERY_KEYS
│
├── pages/
│   ├── auth/            # Login, Register, Callback (email confirm)
│   ├── dashboard/       # Summary cards + charts + budget + goals
│   ├── expenses/        # Month picker + transactions + rules tabs
│   ├── earnings/        # Month picker + transactions + rules tabs
│   ├── budgets/         # Budget CRUD + alerts
│   ├── goals/           # Financial goals + progress bars
│   ├── recurring/       # Recurring rules management
│   ├── categories/      # Expense + income categories
│   ├── analytics/       # Full analytics suite
│   ├── weekview/        # Week navigation + move/split expenses
│   └── projected/       # Projected cost forecasting
│
├── store/
│   ├── authStore.ts     # Zustand: user + tokens
│   └── themeStore.ts    # Zustand: dark mode
│
├── types/
│   └── index.ts         # All TypeScript interfaces
│
└── utils/
├── formatters.ts    # formatMXN, formatDate, formatPct, etc.
└── pdfReport.ts     # Monthly PDF report generator

## Environment Variables

```env
VITE_API_BASE_URL=https://exposbackend-production.up.railway.app
VITE_APP_NAME=Budget Tracker
```

## Local Development

```bash
# Clone the repo
git clone https://github.com/backendtrash/ExpOsFrontend.git
cd ExpOsFrontend

# Install dependencies
pnpm install

# Create .env.local with variables above
# For local backend use:
# VITE_API_BASE_URL=http://localhost:8000

# Run dev server
pnpm dev
# Opens at http://localhost:5173
```

## Build

```bash
# Type check + build
pnpm run build

# Preview production build
pnpm preview
```

## Key Features

| Feature              | Description                                        |
|----------------------|----------------------------------------------------|
| Auth                 | Email/password + confirmation email + JWT refresh  |
| Expenses/Earnings    | CRUD, month picker, import CSV/JSON, edit, search  |
| Budgets              | Weekly/monthly limits + alerts + progress bars     |
| Goals                | Fixed amount + monthly rate + auto savings category|
| Recurring Rules      | Weekly/monthly rules + APScheduler auto-process    |
| Week View            | Navigate by week, move + split expenses            |
| Analytics            | 6 chart types + trends + YoY + net worth           |
| Projections          | Forecast costs separate from recurring rules       |
| PDF Report           | Full monthly report with charts + tables           |
| Dark Mode            | System-aware + manual toggle                       |
| Mobile Responsive    | Safari iOS safe area + touch-friendly layout       |

## Architecture Notes

- **Month picker default:** current month, navigates via arrows or dropdown
- **staleTime:** 5 min default, 1hr currencies, 30min categories
- **Prefetch on hover:** sidebar links prefetch data before click
- **Goal contributions = expenses** — reduces balance + tracks progress
- **Projected costs ≠ recurring rules** — projected is forecast-only

## Deployment (Vercel)

```bash
# Push to GitHub → Vercel auto-deploys
git push origin main

# SPA routing handled by vercel.json rewrites
# All paths redirect to index.html
```

## Live URLs

- **Frontend:** https://exp-os-frontend.vercel.app
- **Backend:**  https://exposbackend-production.up.railway.app