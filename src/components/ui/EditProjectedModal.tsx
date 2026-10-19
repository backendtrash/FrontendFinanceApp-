import { useState, useEffect }   from 'react'
import Modal                      from './Modal'
import Button                     from './Button'
import Input                      from './Input'
import { useUpdateProjectedCost } from '../../hooks/useQueries'
import { useCurrencies }          from '../../hooks/useQueries'
import type { ProjectedCost, ProjectedFrequency, PlanGroup } from '../../types/index'

const GROUP_OPTIONS: { key: PlanGroup; label: string; desc: string }[] = [
  { key: 'committed',  label: 'Committed',  desc: "Can't skip" },
  { key: 'living',     label: 'Living',     desc: 'Can flex' },
  { key: 'lifestyle',  label: 'Lifestyle',  desc: 'Optional' },
]

const MONTHS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const FREQ_LABELS: Record<ProjectedFrequency, string> = {
  monthly:  'Monthly',
  weekly:   'Weekly',
  one_time: 'One-time',
}

interface EditProjectedModalProps {
  cost:    ProjectedCost | null
  open:    boolean
  onClose: () => void
}

export default function EditProjectedModal({
  cost,
  open,
  onClose,
}: EditProjectedModalProps) {
  const updateCost                 = useUpdateProjectedCost()
  const { data: currencies = [] }  = useCurrencies()

  const [name,        setName]        = useState('')
  const [amount,      setAmount]      = useState('')
  const [currencyId,  setCurrencyId]  = useState('')
  const [frequency,   setFrequency]   = useState<ProjectedFrequency>('monthly')
  const [planGroup,   setPlanGroup]   = useState<PlanGroup>('committed')
  const [dayOfWeek,   setDayOfWeek]   = useState('0')
  const [dayOfMonth,  setDayOfMonth]  = useState('1')
  const [month,       setMonth]       = useState('1')
  const [year,        setYear]        = useState(String(new Date().getFullYear()))
  const [notes,       setNotes]       = useState('')
  const [isActive,    setIsActive]    = useState(true)
  const [error,       setError]       = useState('')

  // Populate form when cost changes
  useEffect(() => {
    if (cost) {
      setName(cost.name)
      setAmount(String(Number(cost.amount)))
      setCurrencyId(cost.currency_id ?? '')
      setFrequency(cost.frequency as ProjectedFrequency)
      setPlanGroup(cost.plan_group ?? 'committed')
      setDayOfWeek(String(cost.day_of_week ?? 0))
      setDayOfMonth(String(cost.day_of_month ?? 1))
      setMonth(String(cost.month ?? 1))
      setYear(String(cost.year ?? new Date().getFullYear()))
      setNotes(cost.notes ?? '')
      setIsActive(cost.is_active)
      setError('')
    }
  }, [cost])

  const handleSubmit = async () => {
    if (!cost) return
    if (!name.trim()) { setError('Name is required'); return }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero')
      return
    }

    const payload: any = {
      name:        name.trim(),
      amount:      parseFloat(amount),
      currency_id: currencyId || undefined,
      frequency,
      notes:       notes.trim() || undefined,
      is_active:   isActive,
    }

    payload.plan_group = planGroup
    if (frequency === 'weekly')   payload.day_of_week  = parseInt(dayOfWeek)
    if (frequency === 'monthly')  payload.day_of_month = parseInt(dayOfMonth)
    if (frequency === 'one_time') {
      payload.month = parseInt(month)
      payload.year  = parseInt(year)
    }

    try {
      await updateCost.mutateAsync({ id: cost.id, data: payload })
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update projection')
    }
  }

  if (!cost) return null

  return (
    <Modal open={open} onClose={onClose} title="Edit Projection">
      <div className="space-y-4">

        {/* Group selector */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Group</label>
          <div className="flex gap-2">
            {GROUP_OPTIONS.map(g => (
              <button key={g.key} type="button" onClick={() => setPlanGroup(g.key)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${planGroup === g.key ? 'border-[#702963] bg-[#f3e8f0] text-[#702963]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <div>{g.label}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Frequency selector */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Frequency
          </label>
          <div className="flex gap-2">
            {(['monthly', 'weekly', 'one_time'] as ProjectedFrequency[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFrequency(f)}
                className={`
                  flex-1 py-2 px-3 text-xs font-medium rounded-lg border
                  transition-colors
                  ${frequency === f
                    ? 'border-[#702963] bg-[#f3e8f0] text-[#702963]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                {FREQ_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        {/* Amount + Currency */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Amount"
              type="number"
              step="100"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300
                         rounded-lg outline-none"
              value={currencyId}
              onChange={e => setCurrencyId(e.target.value)}
            >
              {currencies.map(c => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Day of week */}
        {frequency === 'weekly' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Day of week
            </label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300
                         rounded-lg outline-none"
              value={dayOfWeek}
              onChange={e => setDayOfWeek(e.target.value)}
            >
              {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                .map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))
              }
            </select>
          </div>
        )}

        {/* Day of month */}
        {frequency === 'monthly' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Day of month
            </label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300
                         rounded-lg outline-none"
              value={dayOfMonth}
              onChange={e => setDayOfMonth(e.target.value)}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Month/Year for one-time */}
        {frequency === 'one_time' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300
                           rounded-lg outline-none"
                value={month}
                onChange={e => setMonth(e.target.value)}
              >
                {MONTHS.slice(1).map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <Input
                label="Year"
                type="number"
                min="2024"
                max="2030"
                value={year}
                onChange={e => setYear(e.target.value)}
              />
            </div>
          </div>
        )}

        <Input
          label="Notes (optional)"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        {/* Active toggle */}
        <div className="flex items-center justify-between p-3
                        bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs font-medium text-gray-700">Active</p>
            <p className="text-xs text-gray-400">
              Inactive projections are excluded from totals
            </p>
          </div>
          <button
            onClick={() => setIsActive(p => !p)}
            className={`
              w-10 h-5 rounded-full transition-colors relative
              ${isActive ? 'bg-[#702963]' : 'bg-gray-200'}
            `}
          >
            <span className={`
              absolute top-0.5 w-4 h-4 rounded-full bg-white
              shadow transition-transform
              ${isActive ? 'translate-x-5' : 'translate-x-0.5'}
            `} />
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={updateCost.isPending}
            onClick={handleSubmit}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}