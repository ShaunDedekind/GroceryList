import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import type { GroceryItem } from '../types'
import type { NowBucketId } from '../lib/nowBuckets'
import { formatDueLabel } from '../lib/nowBuckets'
import { ItemRow } from './ItemRow'

const BUCKET_INDEX: Record<NowBucketId, string> = {
  overdue: '01',
  today: '02',
  this_week: '03',
  coming_up: '04',
  someday: '05',
}

interface NowSectionProps {
  id: NowBucketId
  label: string
  items: GroceryItem[]
  defaultCollapsed?: boolean
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
  typeChipFor?: (item: GroceryItem) => { emoji: string; label: string } | null
}

export function NowSection({
  id,
  label,
  items,
  defaultCollapsed = false,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
  typeChipFor,
}: NowSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const count = items.filter((item) => !item.checked).length || items.length

  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="mb-1.5 flex min-h-11 w-full items-baseline gap-2 px-gutter text-left text-warm-gray dark:text-warm-gray-light"
        aria-expanded={!collapsed}
      >
        <span className="font-mono text-meta font-medium text-attention">
          {BUCKET_INDEX[id]}
        </span>
        <span className="text-title text-ink dark:text-ink-dark">{label}</span>
        <span className="font-mono text-caption text-warm-gray dark:text-warm-gray-light">
          {String(count).padStart(2, '0')}
        </span>
        <span className="ml-auto font-mono text-caption font-medium">
          {collapsed ? 'Show' : 'Hide'}
        </span>
      </button>
      {!collapsed && (
        <div className="mx-gutter overflow-hidden rounded-[var(--radius-md)] bg-cream dark:bg-surface-raised">
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <ItemRow
                key={item.id}
                item={item}
                currentUserName={currentUserName}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                showSeparator={index < items.length - 1}
                dueLabel={formatDueLabel(item.due_at, new Date(), {
                  omitSomeday: id === 'someday',
                })}
                typeChip={typeChipFor?.(item) ?? null}
                bucketId={id}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}
