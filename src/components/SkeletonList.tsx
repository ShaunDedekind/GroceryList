export function SkeletonList() {
  return (
    <div className="space-y-4 px-2 pt-4" aria-hidden="true">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-3">
          <div className="h-4 w-28 animate-pulse rounded-md bg-cream-dark dark:bg-[#1e2a3a]" />
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 py-1">
              <div className="h-7 w-7 animate-pulse rounded-full bg-cream-dark dark:bg-[#1e2a3a]" />
              <div
                className="h-4 flex-1 animate-pulse rounded-md bg-cream-dark dark:bg-[#1e2a3a]"
                style={{ maxWidth: `${60 + row * 12}%` }}
              />
              <div className="h-6 w-6 animate-pulse rounded-full bg-cream-dark dark:bg-[#1e2a3a]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
