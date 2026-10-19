import type { RecurringRuleCreate, TransactionType } from '../../types/index'

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 0 },
  { label: 'Tue', value: 1 },
  { label: 'Wed', value: 2 },
  { label: 'Thu', value: 3 },
  { label: 'Fri', value: 4 },
  { label: 'Sat', value: 5 },
  { label: 'Sun', value: 6 },
]

interface RecurringToggleProps {
  type:        TransactionType
  currencies:  { id: string; code: string }[]
  categories?: { id: string; name: string }[]
  value:       Partial<RecurringRuleCreate> | null
  onChange:    (rule: Partial<RecurringRuleCreate> | null) => void
}

export default function RecurringToggle({
  type,
  currencies,
  value,
  onChange,
}: RecurringToggleProps) {
  const isEnabled  = value !== null
  const frequency  = value?.frequency ?? 'weekly'
  const dayOfWeek  = value?.day_of_week  ?? 0
  const dayOfMonth = value?.day_of_month ?? 1

  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''

  const toggle = () => {
    if (isEnabled) {
      onChange(null)
    } else {
      onChange({
        type,
        frequency:    'weekly',
        day_of_week:  0,
        currency_id:  mxnId,
      })
    }
  }

  const update = (patch: Partial<RecurringRuleCreate>) => {
    onChange({ ...value, ...patch })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      {/* Toggle header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700">
            Recurring
          </p>
          <p className="text-xs text-gray-400">
            Auto-create on a schedule
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          className={`
            relative w-10 h-5 rounded-full transition-colors
            ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}
          `}
        >
          <span className={`
            absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
            shadow transition-transform
            ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
          `} />
        </button>
      </div>

      {/* Expanded options */}
      {isEnabled && (
        <div className="mt-3 space-y-3 pt-3 border-t border-gray-100">

          {/* Frequency */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">
              Frequency
            </p>
            <div className="flex gap-2">
              {(['weekly', 'monthly'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    update({
                      frequency:    f,
                      day_of_week:  f === 'weekly'  ? 0         : undefined,
                      day_of_month: f === 'monthly' ? 1         : undefined,
                    })
                  }}
                  className={`
                    flex-1 py-1.5 text-xs rounded-lg border transition-colors
                    ${frequency === f
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  {f === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>

          {/* Weekly — day of week picker */}
          {frequency === 'weekly' && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Every
              </p>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => update({ day_of_week: d.value })}
                    className={`
                      flex-1 py-1.5 text-xs rounded-lg border
                      transition-colors font-medium
                      ${dayOfWeek === d.value
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }
                    `}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly — day of month picker */}
          {frequency === 'monthly' && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5">
                Day of month
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={dayOfMonth}
                  onChange={e => update({
                    day_of_month: parseInt(e.target.value) || 1
                  })}
                  className="w-20 px-3 py-1.5 text-sm border border-gray-300
                             rounded-lg outline-none focus:ring-2
                             focus:ring-blue-500 text-center"
                />
                <span className="text-xs text-gray-500">
                  of every month
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                If the month has fewer days, uses the last day
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Weekly commute, Monthly rent..."
              value={value?.description ?? ''}
              onChange={e => update({ description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300
                         rounded-lg outline-none focus:ring-2
                         focus:ring-blue-500"
            />
          </div>

          <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2">
            💡 A recurring rule will be created. Transactions are generated
            automatically on each scheduled date going forward.
          </p>
        </div>
      )}
    </div>
  )
}