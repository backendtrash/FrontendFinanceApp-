import { format, parseISO } from 'date-fns'

// ── Currency Formatter ────────────────────────────────────────────────────
export const formatMXN = (amount: number | string): string => {
  return new Intl.NumberFormat('es-MX', {
    style:    'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

export const formatCurrency = (
  amount: number | string,
  symbol: string = '$'
): string => {
  return `${symbol}${new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))}`
}
// ── Date Formatters ───────────────────────────────────────────────────────
export const formatDate = (dateStr: string): string => {
  return format(parseISO(dateStr), 'MMM dd, yyyy')
}

export const formatDateShort = (dateStr: string): string => {
  return format(parseISO(dateStr), 'MMM dd')
}

export const formatMonth = (dateStr: string): string => {
  return format(parseISO(dateStr), 'MMMM yyyy')
}

export const todayISO = (): string => {
  return format(new Date(), 'yyyy-MM-dd')
}

// ── Percentage Formatter ──────────────────────────────────────────────────
export const formatPct = (value: number | string): string => {
  return `${Number(value).toFixed(1)}%`
}

// ── Budget Progress Color ─────────────────────────────────────────────────
// Returns a Tailwind color class based on percentage spent
export const getBudgetColor = (pct: number | string): string => {
  pct = Number(pct)
  if (pct >= 100) return 'text-red-600'
  if (pct >= 80)  return 'text-amber-500'
  if (pct >= 60)  return 'text-yellow-500'
  return 'text-green-500'
}

export const getBudgetBarColor = (pct: number | string): string => {
  pct = Number(pct)
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80)  return 'bg-amber-500'
  if (pct >= 60)  return 'bg-yellow-500'
  return 'bg-green-500'
}