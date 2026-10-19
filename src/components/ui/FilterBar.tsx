import { useState } from 'react'
import type { Category, Currency } from '../../types/index'

interface FilterBarProps {
  categories:  Category[]
  currencies:  Currency[]
  onFilter:    (filters: FilterValues) => void
}

export interface FilterValues {
  search:      string
  category_id: string
  currency_id: string
  date_from:   string
  date_to:     string
}

export default function FilterBar({
  categories,
  currencies,
  onFilter,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [values,   setValues]   = useState<FilterValues>({
    search:      '',
    category_id: '',
    currency_id: '',
    date_from:   '',
    date_to:     '',
  })

  const update = (patch: Partial<FilterValues>) => {
    const next = { ...values, ...patch }
    setValues(next)
    onFilter(next)
  }

  const hasActiveFilters =
    values.search      ||
    values.category_id ||
    values.currency_id ||
    values.date_from   ||
    values.date_to

  const reset = () => {
    const empty: FilterValues = {
      search: '', category_id: '', currency_id: '',
      date_from: '', date_to: '',
    }
    setValues(empty)
    onFilter(empty)
  }

  return (
    <div className="space-y-3">
      {/* Search + toggle row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2
                           text-gray-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by notes..."
            value={values.search}
            onChange={e => update({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300
                       rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setExpanded(p => !p)}
          className={`
            px-3 py-2 text-xs rounded-lg border transition-colors
            flex items-center gap-1.5
            ${expanded || hasActiveFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          ⚙ Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="px-3 py-2 text-xs text-red-500
                       hover:bg-red-50 rounded-lg border border-red-200
                       transition-colors"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3
                        p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Category
            </label>
            <select
              className="w-full px-2 py-1.5 text-xs border border-gray-300
                         rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={values.category_id}
              onChange={e => update({ category_id: e.target.value })}
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Currency
            </label>
            <select
              className="w-full px-2 py-1.5 text-xs border border-gray-300
                         rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={values.currency_id}
              onChange={e => update({ currency_id: e.target.value })}
            >
              <option value="">All currencies</option>
              {currencies.map(c => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              From
            </label>
            <input
              type="date"
              value={values.date_from}
              onChange={e => update({ date_from: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300
                         rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              To
            </label>
            <input
              type="date"
              value={values.date_to}
              onChange={e => update({ date_to: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-300
                         rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}