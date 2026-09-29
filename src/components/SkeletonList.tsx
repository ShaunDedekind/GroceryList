export function SkeletonList() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((section) => (
        <div key={section}>
          <div className="mx-gutter mb-1.5 h-3 w-24 animate-pulse rounded-md bg-cream dark:bg-surface-raised" />
          <div className="surface-card mx-gutter overflow-hidden">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="flex min-h-row items-center"
              >
                <div className="hit-touch">
                  <div className="h-[22px] w-[22px] animate-pulse rounded-full bg-cream-dark dark:bg-surface" />
                </div>
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
