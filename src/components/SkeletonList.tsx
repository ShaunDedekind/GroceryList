export function SkeletonList() {
  return (
    <div className="space-y-3 px-1 pt-2">
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-2.5">
          <div className="h-3.5 w-28 animate-pulse rounded-md bg-cream-dark dark:bg-surface-raised" />
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="surface-card flex items-center gap-3.5 px-[var(--spacing-row-x)] py-[var(--spacing-row-y)]"
            >
              <div className="h-6 w-6 animate-pulse rounded-[9px] bg-cream-dark dark:bg-surface" />
              <div
                className="h-3.5 flex-1 animate-pulse rounded-md bg-cream-dark dark:bg-surface"
                style={{ maxWidth: `${60 + row * 12}%` }}
              />
              <div className="h-5 w-5 animate-pulse rounded-full bg-cream-dark dark:bg-surface" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
