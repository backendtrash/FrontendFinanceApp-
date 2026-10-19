# BackendFinance — Frontend

React single-page application for the BackendFinance personal finance app.
It talks to the API in
[`backendtrash/BackendFinanceApp`](https://github.com/backendtrash/BackendFinanceApp).

## Tech Stack

- **Framework:** React 19 + Vite 8
- **Language:** TypeScript 6 (strict mode)
- **Styling:** TailwindCSS 4, design tokens in `src/index.css`
  (design proposal A, *Refined Classic*, with its dark variant)
- **State:** Zustand (auth, theme, preferences)
- **Server state:** TanStack Query v5
- **HTTP:** Axios with JWT interceptor and refresh
- **Charts:** Recharts · **Icons:** Lucide React · **PDF:** jsPDF

## Running it

You need Node 20 or newer, and the backend running locally.

```bash
git clone https://github.com/backendtrash/FrontendFinanceApp.git
cd FrontendFinanceApp

# pnpm via corepack, which ships with Node — no global install needed
corepack pnpm install --frozen-lockfile

# Optional: only needed to point at an API other than localhost:8000
cp .env.example .env.local

corepack pnpm dev
# http://localhost:5173
```

Start the API first (see the backend README): `uvicorn app.main:app --port 8000`.
Without `VITE_API_BASE_URL`, the app sends requests to `http://localhost:8000`.

```bash
corepack pnpm build     # type check (tsc -b) + production build
corepack pnpm preview   # serve the build
corepack pnpm lint
```

## Screens

The eleven screens of the design, all behind authentication, all in the
sidebar:

| Route | Screen |
|---|---|
| `/dashboard` | Dashboard |
| `/expenses` | Expenses |
| `/earnings` | Earnings |
| `/weeks` | Week view |
| `/budgets` | Budgets |
| `/recurring` | Recurring |
| `/projected` | Plan (projected costs) |
| `/goals` | Goals |
| `/categories` | Categories |
| `/analytics` | Analytics |
| `/settings` | Settings |

Public: `/login`, `/register`, `/auth/callback` (email confirmation).
Anything else redirects to `/dashboard`.

## Authentication

Sign-in goes through the backend: `POST /api/v1/auth/login` authenticates
against Supabase Auth and returns Supabase's own access and refresh tokens.
The access token is kept in memory and sent as `Authorization: Bearer` on
every request; the refresh token is kept in `localStorage` and used to
restore the session on reload and to retry a request once after a 401.

`ProtectedRoute` in `src/App.tsx` redirects to `/login` until a session is
restored. The backend then runs every query with the user's own token, so
Supabase's row level security applies to it.

## Environment variables

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Set on the hosting platform for production |

See `.env.example`. No secrets live in the frontend.

## Out of scope: Sinking Funds

The design approved at H2 has no sinking funds module, and the backend does
not serve it on `main`. Here it is out of navigation and its query is off
(`SINKING_FUNDS_ENABLED` in `src/hooks/useQueries.ts`), so Week View shows no
funds section. The code is still in the tree, and the module as it was lives
on the `feat/sinking-funds` branch in both repositories.

## Project structure

```
src/
├── api/          Axios clients, one per backend module; client.ts holds the
│                 instance, the JWT interceptor and the refresh logic
├── components/
│   ├── charts/   Recharts components
│   ├── layout/   AppLayout, Sidebar, Header, NotificationsPanel
│   └── ui/       Reusable primitives and modals
├── config/       Add-menu definitions per screen
├── hooks/        useAuth, and every TanStack Query hook in useQueries.ts
├── pages/        One folder per screen, plus auth/
├── store/        Zustand stores
├── types/        Shared TypeScript interfaces
└── utils/        Formatters, API error messages, PDF report, week boundaries
```

## Deployment

`vercel.json` rewrites every non-API path to `index.html` for client-side
routing. Set `VITE_API_BASE_URL` in the Vercel project's environment
variables before the first build.
