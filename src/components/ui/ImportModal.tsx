import { useState, useRef, useCallback } from 'react'
import Modal   from './Modal'
import Button  from './Button'
import Badge   from './Badge'
import type { Category, Currency, TransactionType } from '../../types/index'

// ── Types ─────────────────────────────────────────────────────────────────
interface ParsedRow {
  amount:      number
  date:        string
  category_id: string | undefined
  notes:       string | undefined
  currency_id: string
  valid:       boolean
  errors:      string[]
  raw:         Record<string, string>
}

interface ImportModalProps {
  open:        boolean
  onClose:     () => void
  type:        TransactionType
  categories:  Category[]
  currencies:  Currency[]
  onImport:    (rows: any[]) => Promise<{ created: number; errors: any[]; total: number }>
}

// ── CSV Parser ─────────────────────────────────────────────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines  = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    // Handle quoted CSV values containing commas
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    return Object.fromEntries(
      headers.map((h, i) => [h, values[i] ?? ''])
    )
  })
}

// ── Row Validator ──────────────────────────────────────────────────────────
function validateRow(
  raw: Record<string, string>,
  categories: Category[],
  currencies: Currency[],
  type: TransactionType,
): ParsedRow {
  const errors: string[] = []

  // Amount
  const amount = parseFloat(raw.amount)
  if (isNaN(amount) || amount <= 0) {
    errors.push('Invalid amount')
  }

  // Date
  const dateVal = raw.date?.trim()
  if (!dateVal || !/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    errors.push('Date must be YYYY-MM-DD')
  }

  // Currency — match by code (case insensitive)
  const currCode = raw.currency?.trim().toUpperCase()
  const currency = currencies.find(c => c.code === currCode)
  if (!currency) {
    errors.push(`Unknown currency: ${raw.currency}`)
  }

  // Category — match by name (case insensitive, type-filtered)
  const catName = raw.category?.trim().toLowerCase()
  const category = catName
    ? categories.find(
        c => c.name.toLowerCase() === catName && c.type === type
      )
    : undefined

  // Category not found is a warning not an error — row still valid
  if (catName && !category) {
    errors.push(`Category not found: "${raw.category}" (will be uncategorized)`)
  }

  return {
    amount:      isNaN(amount) ? 0 : amount,
    date:        dateVal ?? '',
    category_id: category?.id,
    notes:       raw.notes?.trim() || undefined,
    currency_id: currency?.id ?? '',
    valid:       errors.filter(e => !e.startsWith('Category not found')).length === 0,
    errors,
    raw,
  }
}

// ── Import Modal ───────────────────────────────────────────────────────────
export default function ImportModal({
  open,
  onClose,
  type,
  categories,
  currencies,
  onImport,
}: ImportModalProps) {
  const [inputTab,  setInputTab]  = useState<'paste' | 'upload'>('paste')
  const [formatTab, setFormatTab] = useState<'csv' | 'json'>('csv')
  const [text,      setText]      = useState('')
  const [rows,      setRows]      = useState<ParsedRow[]>([])
  const [parsed,    setParsed]    = useState(false)
  const [importing, setImporting] = useState(false)
  const [report,    setReport]    = useState<{
    created: number; errors: any[]; total: number
  } | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Reset state ──────────────────────────────────────────────────────────
  const reset = () => {
    setText('')
    setRows([])
    setParsed(false)
    setReport(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // ── File upload handler ───────────────────────────────────────────────────
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = ev => {
      const content = ev.target?.result as string
      setText(content)
    }
    reader.readAsText(file)
  }, [])

  // ── Parse handler ─────────────────────────────────────────────────────────
  const handleParse = () => {
    let rawRows: Record<string, string>[] = []

    try {
      if (formatTab === 'json') {
        // Parse JSON array
        const parsed = JSON.parse(text)
        if (!Array.isArray(parsed)) {
          alert('JSON must be an array of objects')
          return
        }
        // Normalize keys to lowercase strings
        rawRows = parsed.map((item: any) =>
          Object.fromEntries(
            Object.entries(item).map(([k, v]) => [
              k.toLowerCase(),
              String(v ?? ''),
            ])
          )
        )
      } else {
        // Parse CSV
        rawRows = parseCSV(text)
      }
    } catch (e) {
      alert('Failed to parse input. Check format and try again.')
      return
    }

    if (!rawRows.length) {
      alert('No rows found in input')
      return
    }

    // Validate each row
    const validated = rawRows.map(raw =>
      validateRow(raw, categories, currencies, type)
    )

    setRows(validated)
    setParsed(true)
  }

  // ── Import handler ────────────────────────────────────────────────────────
  const handleImport = async () => {
    const validRows = rows.filter(r => r.valid)
    if (!validRows.length) {
      alert('No valid rows to import')
      return
    }

    setImporting(true)
    try {
      const result = await onImport(
        validRows.map(r => ({
          amount:       r.amount,
          currency_id:  r.currency_id,
          category_id:  r.category_id,
          date:         r.date,
          notes:        r.notes,
          is_recurring: false,
        }))
      )
      setReport(result)
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const validCount   = rows.filter(r => r.valid).length
  const invalidCount = rows.filter(r => !r.valid).length

  // ── Example templates ─────────────────────────────────────────────────────
  const csvExample = `amount,date,category,notes,currency
850,2025-05-01,Food & Dining,Lunch,MXN
320,2025-05-02,Transport,Uber,MXN
8500,2025-05-01,Housing,Rent,MXN`

  const jsonExample = JSON.stringify([
    { amount: 850,  date: '2025-05-01', category: 'Food & Dining', notes: 'Lunch', currency: 'MXN' },
    { amount: 320,  date: '2025-05-02', category: 'Transport',     notes: 'Uber',  currency: 'MXN' },
    { amount: 8500, date: '2025-05-01', category: 'Housing',       notes: 'Rent',  currency: 'MXN' },
  ], null, 2)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Import ${type === 'expense' ? 'Expenses' : 'Earnings'}`}
      size="lg"
    >
      {/* ── Report view ───────────────────────────────────────────────── */}
      {report ? (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl mb-3">
              {report.errors.length === 0 ? '✅' : '⚠️'}
            </div>
            <p className="font-semibold text-gray-900">Import Complete</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {report.created}
              </p>
              <p className="text-xs text-green-700">Imported</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {report.errors.length}
              </p>
              <p className="text-xs text-red-700">Failed</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">
                {report.total}
              </p>
              <p className="text-xs text-gray-700">Total</p>
            </div>
          </div>

          {report.errors.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {report.errors.map((e: any, i: number) => (
                <p key={i} className="text-xs text-red-500">
                  Row {e.row}: {e.error}
                </p>
              ))}
            </div>
          )}

          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>

      ) : !parsed ? (
        /* ── Input view ─────────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Format tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(['csv', 'json'] as const).map(f => (
              <button
                key={f}
                onClick={() => { setFormatTab(f); reset() }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md
                  transition-colors ${formatTab === f
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Input tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            {(['paste', 'upload'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setInputTab(t); setText('') }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md
                  transition-colors ${inputTab === t
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {t === 'paste' ? '📋 Paste' : '📁 Upload File'}
              </button>
            ))}
          </div>

          {/* Input area */}
          {inputTab === 'paste' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">
                  Paste your {formatTab.toUpperCase()} content
                </label>
                <button
                  onClick={() => setText(
                    formatTab === 'csv' ? csvExample : jsonExample
                  )}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Load example
                </button>
              </div>
              <textarea
                className="w-full h-48 px-3 py-2 text-xs font-mono
                           border border-gray-300 rounded-lg outline-none
                           focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={
                  formatTab === 'csv'
                    ? 'amount,date,category,notes,currency\n850,2025-05-01,Food & Dining,Lunch,MXN'
                    : '[{"amount": 850, "date": "2025-05-01", ...}]'
                }
                value={text}
                onChange={e => setText(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept={formatTab === 'csv' ? '.csv' : '.json'}
                onChange={handleFile}
                className="hidden"
              />
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg
                           p-8 text-center cursor-pointer hover:border-blue-400
                           hover:bg-blue-50 transition-colors"
              >
                <p className="text-2xl mb-2">📁</p>
                <p className="text-sm text-gray-600">
                  Click to upload .{formatTab} file
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {text ? '✅ File loaded' : 'No file selected'}
                </p>
              </div>
              {text && (
                <p className="text-xs text-green-600 mt-2 text-center">
                  File content loaded — click Parse to preview
                </p>
              )}
            </div>
          )}

          {/* Expected format hint */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">
              Expected fields:
            </p>
            <p className="text-xs text-gray-500 font-mono">
              amount, date (YYYY-MM-DD), category (name),
              notes, currency (MXN/USD/EUR/CAD)
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleParse}
            disabled={!text.trim()}
          >
            Parse & Preview →
          </Button>
        </div>

      ) : (
        /* ── Preview view ───────────────────────────────────────────── */
        <div className="space-y-4">
          {/* Summary badges */}
          <div className="flex items-center gap-3">
            <Badge variant="positive">{validCount} valid</Badge>
            {invalidCount > 0 && (
              <Badge variant="negative">{invalidCount} invalid (will skip)</Badge>
            )}
            <button
              onClick={() => setParsed(false)}
              className="text-xs text-gray-400 hover:text-gray-600 ml-auto"
            >
              ← Back
            </button>
          </div>

          {/* Preview table */}
          <div className="border rounded-lg overflow-hidden max-h-72
                          overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500">
                    Amount
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">
                    Notes
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">
                    Currency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={row.valid ? 'bg-white' : 'bg-red-50'}
                  >
                    <td className="px-3 py-2">
                      {row.valid ? (
                        <span className="text-green-500">✓</span>
                      ) : (
                        <span
                          className="text-red-500 cursor-help"
                          title={row.errors.join(', ')}
                        >
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{row.date}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {row.amount}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.raw.category || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-500 max-w-24 truncate">
                      {row.notes || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.raw.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Error details for invalid rows */}
          {invalidCount > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-600">
                Issues found (hover ✗ for details):
              </p>
              {rows
                .filter(r => !r.valid)
                .slice(0, 5)
                .map((r, i) => (
                  <p key={i} className="text-xs text-red-500">
                    Row {rows.indexOf(r) + 1}: {r.errors.join(', ')}
                  </p>
                ))
              }
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setParsed(false)}
            >
              ← Back
            </Button>
            <Button
              className="flex-1"
              loading={importing}
              disabled={validCount === 0}
              onClick={handleImport}
            >
              Import {validCount} row{validCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}