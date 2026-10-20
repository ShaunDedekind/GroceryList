import { AnimatePresence } from 'motion/react'
import type { CategoryId, GroceryItem } from '../types'
import { resolveCategoryId, type ResolvedCategory } from '../lib/categoryConfig'
import { ShopItemTile } from './ShopItemTile'

interface ShopFlatListProps {
  items: GroceryItem[]
  categories: ResolvedCategory[]
  currentUserName: string
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: GroceryItem) => void
}

export function ShopFlatList({
  items,
  categories,
  currentUserName,
  onToggle,
  onDelete,
  onEdit,
}: ShopFlatListProps) {
  const visibleCategories = categories.filter((category) => category.visible)
  const sections = visibleCategories
    .map((category) => ({
      category,
      items: items.filter(
        (item) => resolveCategoryId(item.category, categories) === category.id,
      ),
    }))
    .filter((section) => section.items.length > 0)

  // Stale/unknown items that somehow missed Other
  const known = new Set(visibleCategories.map((category) => category.id))
  const orphans = items.filter((item) => {
    const id = resolveCategoryId(item.category, categories)
    return !known.has(id)
  })

  if (orphans.length > 0) {
    const other =
      sections.find((section) => section.category.id === 'other') ??
      (() => {
        const fallback: {
          category: ResolvedCategory
          items: GroceryItem[]
        } = {
          category: {
            id: 'other' as CategoryId,
            label: 'Other',
            emoji: '📦',
            visible: true,
            builtin: true,
            keywords: [],
          },
          items: [],
        }
        sections.push(fallback)
        return fallback
      })()
    other.items.push(...orphans)
  }

  return (
    <div className="space-y-6">
      {sections.map(({ category, items: sectionItems }) => (
        <section key={category.id}>
          <h2 className="mb-1.5 flex items-baseline gap-1.5 px-gutter text-meta font-semibold text-warm-gray dark:text-warm-gray-light">
            <span aria-hidden="true">{category.emoji}</span>
            <span>{category.label}</span>
            <span>{sectionItems.filter((item) => !item.checked).length || sectionItems.length}</span>
          </h2>
          <div className="grid grid-cols-2 gap-2 px-gutter">
            <AnimatePresence initial={false}>
              {sectionItems.map((item) => (
                <ShopItemTile
                  key={item.id}
                  item={item}
                  currentUserName={currentUserName}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      ))}
    </div>
  )
}
