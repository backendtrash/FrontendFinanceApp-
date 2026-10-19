import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMXN } from '../../utils/formatters'

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_SHORT = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface MonthSummary {
  month_key: string
  year:      number
  month:     number
  total_mxn: string
  count:     number
}

interface MonthPickerProps {
  months:      MonthSummary[]
  selectedKey: string
  onSelect:    (key: string) => void
  type:        'expense' | 'income'
}

export default function MonthPicker({
  months,
  selectedKey,
  onSelect,
  type,
}: MonthPickerProps) {
  if (!months.length) return null

  const currentIndex = months.findIndex(m => m.month_key === selectedKey)
  const current      = months[currentIndex]
  const hasPrev      = currentIndex < months.length - 1
  const hasNext      = currentIndex > 0

  const amountColor = type === 'expense' ? 'text-red-500' : 'text-green-500'
  const dotColor    = type === 'expense' ? 'bg-red-400'   : 'bg-green-400'

  return (
    <div className="flex items-center gap-2">

      {/* Prev arrow */}
      <button
        onClick={() => hasPrev && onSelect(months[currentIndex + 1].month_key)}
        disabled={!hasPrev}
        className="
          w-8 h-8 flex items-center justify-center
          rounded-full border border-gray-200 bg-white
          text-gray-400 hover:text-gray-700 hover:border-gray-300
          hover:bg-gray-50 disabled:opacity-25
          disabled:cursor-not-allowed transition-all shadow-sm
        "
      >
        <ChevronLeft size={15} />
      </button>

      {/* Pill */}
      <div className="
        flex items-center gap-3 px-4 py-2.5
        bg-white border border-gray-200 rounded-2xl shadow-sm
        min-w-[180px] max-w-[260px] flex-1
      ">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />

        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {current
              ? `${MONTH_NAMES[current.month]} ${current.year}`
              : 'No data'
            }
          </p>
          {current && (
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">
              {current.count} transaction{current.count !== 1 ? 's' : ''}
              {' · '}
              <span className={`font-semibold ${amountColor}`}>
                {formatMXN(Number(current.total_mxn))}
              </span>
            </p>
          )}
        </div>

        {/* Quick jump dropdown */}
        <select
          value={selectedKey}
          onChange={e => onSelect(e.target.value)}
          className="
            text-xs text-gray-400 bg-transparent border-none
            outline-none cursor-pointer hover:text-gray-600
            transition-colors appearance-none pr-1
          "
          title="Jump to month"
        >
          {months.map(m => (
            <option key={m.month_key} value={m.month_key}>
              {MONTH_SHORT[m.month]} {m.year}
            </option>
          ))}
        </select>
      </div>

      {/* Next arrow */}
      <button
        onClick={() => hasNext && onSelect(months[currentIndex - 1].month_key)}
        disabled={!hasNext}
        className="
          w-8 h-8 flex items-center justify-center
          rounded-full border border-gray-200 bg-white
          text-gray-400 hover:text-gray-700 hover:border-gray-300
          hover:bg-gray-50 disabled:opacity-25
          disabled:cursor-not-allowed transition-all shadow-sm
        "
      >
        <ChevronRight size={15} />
      </button>

    </div>
  )
}