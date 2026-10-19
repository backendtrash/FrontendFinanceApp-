import { useState, useEffect } from 'react'
import {
  useCreateRecurringRule, useCategories, useCurrencies,
} from '../../hooks/useQueries'
import Button from '../../components/ui/Button'
import Input  from '../../components/ui/Input'
import type { RecurringRuleCreate, TransactionType } from '../../types/index'

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

interface Props {
  defaultType: 'expense' | 'income'
  onClose:     () => void
}

export default function RecurringRuleForm({ defaultType, onClose }: Props) {
  const { data: currencies = [] } = useCurrencies()
  const createRule                = useCreateRecurringRule()

  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''

  const [type,       setType]       = useState<TransactionType>(defaultType)
  const [amount,     setAmount]     = useState('')
  const [currencyId, setCurrencyId] = useState(mxnId)
  const [categoryId, setCategoryId] = useState('')
  const [description,setDescription]= useState('')
  const [frequency,  setFrequency]  = useState<'monthly' | 'weekly'>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [dayOfWeek,  setDayOfWeek]  = useState(0)
  const [error,      setError]      = useState('')

  const { data: categories = [] } = useCategories(type)

  useEffect(() => { setCategoryId('') }, [type])
  useEffect(() => { if (mxnId && !currencyId) setCurrencyId(mxnId) }, [mxnId])

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Amount must be greater than zero'); return }
    const payload: RecurringRuleCreate = {
      type,
      amount:      amt,
      currency_id: currencyId || mxnId,
      category_id: categoryId || undefined,
      description: description.trim() || undefined,
      frequency,
      day_of_week:  frequency === 'weekly'  ? dayOfWeek  : undefined,
      day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
    }
    try {
      await createRule.mutateAsync(payload)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create rule')
    }
  }

  return (
    <div className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 text-xs rounded-lg border transition-colors font-medium ${
                type === t
                  ? t === 'expense'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
      </div>

      {/* Amount + Currency */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <select
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={currencyId || mxnId}
            onChange={e => setCurrencyId(e.target.value)}
          >
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <Input
        label="Description (optional)"
        placeholder="e.g. Monthly rent, Salary…"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
        <select
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
        >
          <option value="">No category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Frequency</label>
        <div className="flex gap-2">
          {(['monthly', 'weekly'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`flex-1 py-2 text-xs rounded-lg border transition-colors font-medium ${
                frequency === f
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'monthly' ? 'Monthly' : 'Weekly'}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly — day of month */}
      {frequency === 'monthly' && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Day of month</label>
          <input
            type="number"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={e => setDayOfMonth(parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center"
          />
          <span className="text-xs text-gray-400">of every month</span>
        </div>
      )}

      {/* Weekly — day of week */}
      {frequency === 'weekly' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Every</label>
          <div className="flex gap-1">
            {DAY_NAMES.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setDayOfWeek(i)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors font-medium ${
                  dayOfWeek === i
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={createRule.isPending} onClick={handleSubmit}>
          Create Rule
        </Button>
      </div>
    </div>
  )
}