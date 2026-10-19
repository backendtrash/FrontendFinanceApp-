import { useState }  from 'react'
import Button         from './Button'
import { AlertTriangle } from 'lucide-react'

interface DangerZoneProps {
  label:       string
  description: string
  onConfirm:   () => Promise<void>
}

export default function DangerZone({
  label,
  description,
  onConfirm,
}: DangerZoneProps) {
  const [confirming, setConfirming] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      setDone(true)
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="p-3 bg-green-50 border border-green-200
                      rounded-lg text-xs text-green-700">
        ✅ Done — all records deleted
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle size={13} className="text-red-600" />
          <p className="text-xs font-medium text-red-700">
            This cannot be undone. Are you sure?
          </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            onClick={handleConfirm}
          >
            Yes, delete all
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3
                    border border-red-200 rounded-lg">
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <Button
        variant="danger"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        Delete All
      </Button>
    </div>
  )
}