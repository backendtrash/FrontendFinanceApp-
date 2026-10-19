/**
 * Turns any thrown API error into a string safe to render.
 *
 * FastAPI returns `detail` in four different shapes:
 *   400/401/404/409  -> "detail": "Fund is short by 1000"        (string)
 *   422 validation   -> "detail": [{ loc, msg, type }, ...]       (array)
 *   409 with data    -> "detail": { message, references }        (object)
 *   unexpected       -> no detail at all, or a bare object
 *
 * The object form is what the backend returns when it refuses to delete a
 * category that still has movements: the reason in `message`, and how many
 * rows in each table are holding it in `references`.
 *
 * Assigning the array form straight into React state and rendering it throws
 * "Objects are not valid as a React child", which blanks the whole page and
 * hides the actual error. TypeScript does not catch it because `detail` comes
 * off an `any`, so every call site has to be disciplined — hence this helper.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as any)?.response?.data?.detail

  if (typeof detail === 'string' && detail.trim()) return detail

  // Pydantic validation errors: surface the field and reason, not [object Object]
  if (Array.isArray(detail)) {
    const parts = detail
      .map((d: any) => {
        const msg = typeof d?.msg === 'string' ? d.msg : null
        if (!msg) return null
        // loc is like ["body", "amount"] or ["path", "fund_id"]
        const field = Array.isArray(d?.loc) ? d.loc.filter((s: unknown) => typeof s === 'string').slice(-1)[0] : null
        return field ? `${field}: ${msg}` : msg
      })
      .filter(Boolean)
    if (parts.length) return parts.join(' · ')
  }

  // Structured detail: the reason in `message`, optionally with counts.
  // Without this branch the 409 fell through to axios's own text,
  // "Request failed with status code 409", and the reason was lost.
  if (detail && typeof detail === 'object' && typeof detail.message === 'string' && detail.message.trim()) {
    const refs = detail.references
    if (refs && typeof refs === 'object') {
      const counts = Object.entries(refs)
        .filter(([, n]) => typeof n === 'number' && n > 0)
        .map(([table, n]) => `${n} ${String(table).replace(/_/g, ' ')}`)
      if (counts.length) return `${detail.message} (${counts.join(', ')})`
    }
    return detail.message
  }

  // Some proxies return a plain string body, or axios surfaces a network error
  const raw = (error as any)?.response?.data
  if (typeof raw === 'string' && raw.trim()) return raw

  const axiosMessage = (error as any)?.message
  if (typeof axiosMessage === 'string' && axiosMessage.trim()) return axiosMessage

  return fallback
}

/** Status code of a failed request, when there was a response at all. */
export function getApiErrorStatus(error: unknown): number | null {
  const status = (error as any)?.response?.status
  return typeof status === 'number' ? status : null
}
