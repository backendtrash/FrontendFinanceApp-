import { useEffect, useRef } from 'react'

interface ConfirmRowProps {
  label?:     string
  onConfirm:  () => void
  onCancel:   () => void
  loading?:   boolean
}

/**
 * Slides in below a table row to confirm a destructive action.
 * Automatically focuses the Cancel button for keyboard safety
 * (user must explicitly click Delete — pressing Enter cancels).
 */
export default function ConfirmRow({
  label    = 'Delete this item?',
  onConfirm,
  onCancel,
  loading  = false,
}: ConfirmRowProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Auto-focus cancel — safer default for destructive actions
  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '8px 14px',
        background:     '#fef2f2',
        border:         '0.5px solid #fecaca',
        borderRadius:   '8px',
        marginTop:      '2px',
        animation:      'slideDown 0.15s ease-out',
      }}
    >
      <span style={{ fontSize: '12px', color: '#991b1b' }}>{label}</span>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            fontSize:     '11px',
            padding:      '3px 10px',
            borderRadius: '6px',
            border:       'none',
            background:   loading ? '#fca5a5' : '#dc2626',
            color:        '#fff',
            cursor:       loading ? 'not-allowed' : 'pointer',
            fontWeight:   500,
          }}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
        <button
          ref={cancelRef}
          onClick={onCancel}
          style={{
            fontSize:     '11px',
            padding:      '3px 10px',
            borderRadius: '6px',
            border:       '0.5px solid #e5e7eb',
            background:   '#fff',
            color:        '#6b7280',
            cursor:       'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}