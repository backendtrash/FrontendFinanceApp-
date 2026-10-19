// ── Skeleton primitives ───────────────────────────────────────────────────
// Renders animated placeholder shapes while data loads
// Prevents layout shift and gives instant visual feedback

function SkeletonBox({
  className = '',
}: {
  className?: string
}) {
  return (
    <div className={`
      animate-pulse bg-gray-200 rounded-lg ${className}
    `} />
  )
}

// ── Dashboard skeleton ────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-5 w-32" />
        <div className="flex gap-2">
          <SkeletonBox className="h-8 w-28" />
          <SkeletonBox className="h-8 w-20" />
          <SkeletonBox className="h-8 w-24" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200
                                  shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <SkeletonBox className="h-3 w-20" />
                <SkeletonBox className="h-6 w-32" />
                <SkeletonBox className="h-3 w-24" />
              </div>
              <SkeletonBox className="h-10 w-10 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border
                        border-gray-200 shadow-sm p-5">
          <SkeletonBox className="h-4 w-40 mb-1" />
          <SkeletonBox className="h-3 w-24 mb-4" />
          <SkeletonBox className="h-52 w-full" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200
                        shadow-sm p-5">
          <SkeletonBox className="h-4 w-36 mb-1" />
          <SkeletonBox className="h-3 w-20 mb-4" />
          <SkeletonBox className="h-52 w-full rounded-full mx-auto
                                  max-w-[200px]" />
        </div>
      </div>

      {/* Budget progress */}
      <div className="bg-white rounded-xl border border-gray-200
                      shadow-sm p-5">
        <SkeletonBox className="h-4 w-36 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <SkeletonBox className="h-3 w-24" />
                <SkeletonBox className="h-3 w-10" />
              </div>
              <SkeletonBox className="h-1.5 w-full" />
              <div className="flex justify-between">
                <SkeletonBox className="h-2.5 w-16" />
                <SkeletonBox className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Table skeleton ────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm
                    overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-gray-100">
        {[60, 100, 120, 80, 80].map((w, i) => (
          <SkeletonBox key={i} className={`h-3 w-${w}`} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 px-4 py-3.5 border-b border-gray-50
                     last:border-0"
        >
          <SkeletonBox className="h-3 w-16" />
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-3 w-32" />
          <SkeletonBox className="h-3 w-20 ml-auto" />
          <SkeletonBox className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200
                    shadow-sm p-5 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={`h-3 ${i === 0 ? 'w-1/2' : i === lines - 1 ? 'w-1/3' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export default SkeletonBox