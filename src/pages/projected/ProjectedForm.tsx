import { useState }        from 'react'
import { useCreateProjectedCost, useCurrencies, useCategories } from '../../hooks/useQueries'
import Button  from '../../components/ui/Button'
import Input   from '../../components/ui/Input'
import type { ProjectedCostCreate, ProjectedFrequency, PlanGroup } from '../../types/index'

const FREQ_LABELS: Record<ProjectedFrequency, string> = {
  monthly: 'Monthly', weekly: 'Weekly', one_time: 'One-time',
}

const GROUP_OPTIONS: { key: PlanGroup; label: string; desc: string }[] = [
  { key: 'committed',  label: 'Committed',  desc: "Can't skip" },
  { key: 'living',     label: 'Living',     desc: 'Can flex' },
  { key: 'lifestyle',  label: 'Lifestyle',  desc: 'Optional' },
]

const MONTHS = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ProjectedForm({ onClose }: { onClose: () => void }) {
  const { data: currencies = [] } = useCurrencies()
  const { data: categories = [] } = useCategories('expense')
  const createCost                 = useCreateProjectedCost()
  const mxnId = currencies.find(c => c.code === 'MXN')?.id ?? ''
  const now   = new Date()

  const [name,       setName]       = useState('')
  const [amount,     setAmount]     = useState('')
  const [currency,   setCurrency]   = useState(mxnId)
  const [frequency,  setFrequency]  = useState<ProjectedFrequency>('monthly')
  const [planGroup,  setPlanGroup]  = useState<PlanGroup>('committed')
  const [month,      setMonth]      = useState(String(now.getMonth() + 1))
  const [year,       setYear]       = useState(String(now.getFullYear()))
  const [dayOfWeek,  setDayOfWeek]  = useState('0')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [categoryId, setCategoryId] = useState('')
  const [notes,      setNotes]      = useState('')
  const [error,      setError]      = useState('')

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Amount must be greater than zero'); return }

    const data: ProjectedCostCreate = {
      name: name.trim(), amount: parseFloat(amount),
      currency_id: currency || mxnId, frequency,
      plan_group: planGroup,
      category_id: categoryId || undefined,
      notes: notes.trim() || undefined,
    }
    if (frequency === 'one_time') { data.month = parseInt(month); data.year = parseInt(year) }
    if (frequency === 'weekly')   data.day_of_week  = parseInt(dayOfWeek)
    if (frequency === 'monthly')  data.day_of_month = parseInt(dayOfMonth)

    try { await createCost.mutateAsync(data); onClose() }
    catch (e: any) { setError(e?.response?.data?.detail || 'Failed to create projected cost') }
  }

  return (
    <div className="space-y-4">
      {/* Group */}
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

      {/* Frequency */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Frequency</label>
        <div className="flex gap-2">
          {(['monthly','weekly','one_time'] as ProjectedFrequency[]).map(f => (
            <button key={f} type="button" onClick={() => setFrequency(f)}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-colors ${frequency === f ? 'border-[#702963] bg-[#f3e8f0] text-[#702963]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {FREQ_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <Input label="Name" placeholder="e.g. Rent, Groceries, Netflix…" value={name} onChange={e => setName(e.target.value)} />

      <div className="flex gap-3">
        <div className="flex-1">
          <Input label="Amount" type="number" step="100" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="w-28">
          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" value={currency} onChange={e => setCurrency(e.target.value)}>
            {currencies.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
        </div>
      </div>

      {frequency === 'weekly' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Day of week</label>
          <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
            {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
      )}
      {frequency === 'monthly' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Day of month</label>
          <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
      {frequency === 'one_time' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" value={month} onChange={e => setMonth(e.target.value)}>
              {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="w-28">
            <Input label="Year" type="number" min="2024" max="2030" value={year} onChange={e => setYear(e.target.value)} />
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Category (optional)</label>
        <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          <option value="">No category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <Input label="Notes (optional)" placeholder="Why are you planning this cost?" value={notes} onChange={e => setNotes(e.target.value)} />

      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" loading={createCost.isPending} onClick={handleSubmit}>Add to plan</Button>
      </div>
    </div>
  )
}