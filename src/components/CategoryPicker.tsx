import { useMemo, useState } from 'react'
import type { DisplayCategory } from './listTabTypes'

const PRIMARY_COUNT = 6

interface CategoryPickerProps {
  categories: DisplayCategory[]
  selected: string
  onSelect: (id: string) => void
  className?: string
}

export function CategoryPicker({
  categories,
  selected,
  onSelect,
  className = '',
}: CategoryPickerProps) {
  const [expanded, setExpanded] = useState(false)

  const { visible, extraCount } = useMemo(() => {
    const primary = categories.slice(0, PRIMARY_COUNT)
    const selectedInPrimary = primary.some((category) => category.id === selected)

    if (expanded || categories.length <= PRIMARY_COUNT) {
      return { visible: categories, extraCount: 0 }
    }

    if (selectedInPrimary) {
      return {
        visible: primary,
        extraCount: categories.length - PRIMARY_COUNT,
      }
    }

    const selectedCategory = categories.find((category) => category.id === selected)
    const withoutSelected = categories
      .filter((category) => category.id !== selected)
      .slice(0, PRIMARY_COUNT - 1)

    return {
      visible: selectedCategory
        ? [...withoutSelected, selectedCategory]
        : primary,
      extraCount: categories.length - PRIMARY_COUNT,
    }
  }, [categories, expanded, selected])

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-1.5">
        {visible.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`press-scale flex items-center gap-1 rounded-xl px-2 py-2 text-meta font-medium transition-colors ${
              selected === category.id
                ? 'bg-sage/15 text-sage-dark dark:text-sage-light'
                : 'bg-cream-dark/60 text-warm-gray active:bg-cream-dark dark:bg-surface dark:text-warm-gray-light'
            }`}
          >
            <span>{category.emoji}</span>
            <span className="truncate">{category.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {categories.length > PRIMARY_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 w-full rounded-xl py-2 text-meta font-medium text-sage active:bg-sage/10 dark:active:bg-sage/20"
        >
          {expanded ? 'Show less' : `More (${extraCount})`}
        </button>
      )}
    </div>
  )
}
