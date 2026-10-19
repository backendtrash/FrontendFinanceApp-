import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from '../../hooks/useQueries'
import Card                from '../../components/ui/Card'
import Button              from '../../components/ui/Button'
import Input               from '../../components/ui/Input'
import Modal               from '../../components/ui/Modal'
import Badge               from '../../components/ui/Badge'
import LoadingSpinner      from '../../components/ui/LoadingSpinner'
import type { CategoryCreate, TransactionType } from '../../types/index'
import { useAddSheetStore }                        from '../../store/addSheetStore'

// ── Color Picker ──────────────────────────────────────────────────────────
// Style A canonical palette — earthy jewel tones matching design tokens
const PRESET_COLORS = [
  '#702963', '#4d1c43', '#7a5191', '#6b3a7d',
  '#1f7a4d', '#3a8a73', '#2d6e5e', '#4a9467',
  '#a8651b', '#bf6f2e', '#c4832a', '#8a4f14',
  '#2563a0', '#525a68',
]

// ── Category Form ─────────────────────────────────────────────────────────
function CategoryForm({
  onClose,
  defaultType,
}: {
  onClose:     () => void
  defaultType: TransactionType
}) {
  const createCategory = useCreateCategory()

  const [form, setForm] = useState<CategoryCreate>({
    name:  '',
    color: '#702963',
    icon:  'tag',
    type:  defaultType,
  })

  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Category name is required')
      return
    }

    try {
      await createCategory.mutateAsync(form)
      onClose()
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      if (typeof detail === 'string' && detail.includes('already exists')) {
        setError(`Category "${form.name}" already exists`)
      } else {
        setError(detail || 'Failed to create category')
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Type
        </label>
        <div className="flex gap-2">
          {(['expense', 'income'] as TransactionType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(p => ({ ...p, type: t }))}
              className={`
                flex-1 py-2 text-xs rounded-lg border transition-colors
                ${form.type === t
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              {t === 'expense' ? 'Expense' : 'Income'}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <Input
        label="Name"
        placeholder="e.g. Gym, Coffee, Side project..."
        value={form.name}
        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
      />

      {/* Color picker */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setForm(p => ({ ...p, color }))}
              className={`
                w-7 h-7 rounded-full transition-transform
                ${form.color === color
                  ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                  : 'hover:scale-110'
                }
              `}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="w-6 h-6 rounded-full border border-gray-200"
            style={{ backgroundColor: form.color }}
          />
          <input
            type="text"
            value={form.color}
            onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
            className="w-24 px-2 py-1 text-xs border border-gray-300
                       rounded outline-none focus:ring-1 focus:ring-blue-500
                       font-mono"
            placeholder="#6366F1"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          loading={createCategory.isPending}
          onClick={handleSubmit}
        >
          Create Category
        </Button>
      </div>
    </div>
  )
}

// ── Categories Page ────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [showAdd,    setShowAdd]    = useState(false)
  const [activeType, setActiveType] = useState<TransactionType>('expense')

  const { pendingAction, clearPendingAction } = useAddSheetStore()
  useEffect(() => {
    if (pendingAction === 'category:open-add-expense') {
      setActiveType('expense'); setShowAdd(true); clearPendingAction()
    } else if (pendingAction === 'category:open-add-income') {
      setActiveType('income'); setShowAdd(true); clearPendingAction()
    }
  }, [pendingAction])

  const { data: categories = [], isLoading } = useCategories()
  const deleteCategory                        = useDeleteCategory()

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories  = categories.filter(c => c.type === 'income')

  const displayed   = activeType === 'expense' ? expenseCategories : incomeCategories
  const customCount = displayed.filter(c => !c.is_system).length
  const totalCustom = categories.filter(c => !c.is_system).length
  const totalSystem = categories.filter(c =>  c.is_system).length

  const categoryList = (
    <Card padding={false}>
      {isLoading ? (
        <div className="py-12 flex justify-center"><LoadingSpinner text="Loading categories..." /></div>
      ) : displayed.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>No categories yet</p>
        </div>
      ) : (
        <div>
          {customCount > 0 && (
            <>
              <div style={{ padding: '14px 20px 6px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Custom</p>
              </div>
              {displayed.filter(c => !c.is_system).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: 'var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</p>
                  </div>
                  <button onClick={async () => { if (!confirm(`Delete "${c.name}"?`)) return; await deleteCategory.mutateAsync(c.id) }}
                    style={{ color: 'var(--text-mute)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--negative)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-mute)')}>✕</button>
                </div>
              ))}
            </>
          )}
          <div style={{ padding: '14px 20px 6px', borderTop: customCount > 0 ? 'var(--card-border)' : 'none', marginTop: customCount > 0 ? 4 : 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>System defaults</p>
          </div>
          {displayed.filter(c => c.is_system).map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: 'var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.name}</p>
              </div>
              <Badge variant="muted">System</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 920, margin: '0 auto', width: '100%' }}>
        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>Categories</h1>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{totalCustom} custom · {totalSystem} system defaults</p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus size={13} /> New Category</Button>
        </div>

        {/* ── Tabs centered ───────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--surface-alt)', borderRadius: 8 }}>
            {(['expense', 'income'] as TransactionType[]).map(t => (
              <button key={t} onClick={() => setActiveType(t)} style={{
                padding: '6px 22px', border: 'none', borderRadius: 5, cursor: 'pointer',
                background: activeType === t ? 'var(--surface)' : 'transparent',
                fontSize: 12, fontWeight: 600,
                color: activeType === t ? 'var(--text)' : 'var(--text-mute)',
                boxShadow: activeType === t ? 'var(--shadow)' : 'none',
              }}>{t === 'expense' ? 'Expense' : 'Income'}</button>
            ))}
          </div>
        </div>

        {/* ── Desktop 2-col: list + tips ──────────────────────────── */}
        <div className="hidden sm:grid" style={{ gridTemplateColumns: '1fr 280px', gap: 14 }}>
          {categoryList}

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Palette preview */}
            <Card><div style={{ marginBottom: 10 }}><div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Palette</div><div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 2 }}>Colors available for new categories</div></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {PRESET_COLORS.map(color => (
                  <span key={color} style={{ width: 28, height: 28, borderRadius: 999, background: color, display: 'inline-block' }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: 'var(--card-border)' }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: '#702963' }} />
                <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>#702963</span>
              </div>
            </Card>

            {/* Tips */}
            <Card><div style={{ marginBottom: 4, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Tips</div>
              <ul style={{ margin: '8px 0 0', padding: '0 0 0 16px', fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.7 }}>
                <li>System categories can't be deleted</li>
                <li>Color is used in charts and badges</li>
                <li>Up to 30 custom categories total</li>
              </ul>
            </Card>
          </div>
        </div>

        {/* ── Mobile list (full width) ─────────────────────────────── */}
        <div className="sm:hidden">
          {categoryList}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Category">
        <CategoryForm onClose={() => setShowAdd(false)} defaultType={activeType} />
      </Modal>
    </>
  )
}