export function SkeletonList() {
  return (
    <div className="space-y-3 px-1 pt-2">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-2">
          <div className="h-3.5 w-28 animate-pulse rounded-md bg-cream-dark dark:bg-surface-raised" />
          {[1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-2 px-2 py-1.5">
              <div className="h-6 w-6 animate-pulse rounded-full bg-cream-dark dark:bg-surface-raised" />
              <div
                className="h-3.5 flex-1 animate-pulse rounded-md bg-cream-dark dark:bg-surface-raised"
                style={{ maxWidth: `${60 + row * 12}%` }}
              />
              <div className="h-5 w-5 animate-pulse rounded-full bg-cream-dark dark:bg-surface-raised" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
