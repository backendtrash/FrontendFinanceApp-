import { useState } from 'react'

/**
 * Manages inline delete confirmation state.
 * Instead of browser confirm(), shows a slide-in confirmation UI.
 *
 * Usage:
 *   const { confirmingId, ask, cancel } = useDeleteConfirm()
 *   onClick={() => ask(item.id)}
 *   {confirmingId === item.id && <ConfirmRow onConfirm={...} onCancel={cancel} />}
 */
export function useDeleteConfirm() {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const ask    = (id: string) => setConfirmingId(id)
  const cancel = ()           => setConfirmingId(null)
  const clear  = ()           => setConfirmingId(null)

  return { confirmingId, ask, cancel, clear }
}