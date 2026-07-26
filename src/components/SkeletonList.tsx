export function SkeletonList() {
  return (
    <div className="space-y-2 px-0.5 pt-1">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-1">
          <div className="h-3 w-24 animate-pulse rounded-md bg-cream-dark dark:bg-surface-raised" />
          <div className="surface-card overflow-hidden">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className={`flex items-center gap-2.5 px-[var(--spacing-row-x)] py-[var(--spacing-row-y)] ${
                  row < 3 ? 'border-b border-separator' : ''
                }`}
              >
                <div className="h-[22px] w-[22px] animate-pulse rounded-[8px] bg-cream-dark dark:bg-surface" />
                <div
                  className="h-3 flex-1 animate-pulse rounded-md bg-cream-dark dark:bg-surface"
                  style={{ maxWidth: `${60 + row * 12}%` }}
                />
                <div className="h-5 w-5 animate-pulse rounded-full bg-cream-dark dark:bg-surface" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
