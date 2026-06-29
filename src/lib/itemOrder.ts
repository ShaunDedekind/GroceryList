import type { CategoryId, GroceryItem } from '../types'

export interface ItemOrderUpdate {
  id: string
  category: CategoryId
  sort_order: number
}

function compareItems(a: GroceryItem, b: GroceryItem): number {
  if (a.checked !== b.checked) return a.checked ? 1 : -1
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
  return a.created_at.localeCompare(b.created_at)
}

export function sortItems(items: GroceryItem[]): GroceryItem[] {
  return [...items].sort(compareItems)
}

export function sortItemsInCategory(
  items: GroceryItem[],
  categoryId: CategoryId,
): GroceryItem[] {
  return sortItems(items.filter((item) => item.category === categoryId))
}

export function sortShopItems(
  items: GroceryItem[],
  categoryOrder: readonly CategoryId[],
): GroceryItem[] {
  const unchecked = items.filter((item) => !item.checked)
  const categoryRank = new Map(categoryOrder.map((id, index) => [id, index]))

  return [...unchecked].sort((a, b) => {
    const rankA = categoryRank.get(a.category as CategoryId) ?? categoryOrder.length
    const rankB = categoryRank.get(b.category as CategoryId) ?? categoryOrder.length
    if (rankA !== rankB) return rankA - rankB
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return a.created_at.localeCompare(b.created_at)
  })
}

export function nextSortOrder(items: GroceryItem[], categoryId: CategoryId): number {
  const inCategory = items.filter((item) => item.category === categoryId)
  if (inCategory.length === 0) return 0
  return Math.max(...inCategory.map((item) => item.sort_order)) + 1
}

export function applyOrderUpdates(
  items: GroceryItem[],
  updates: ItemOrderUpdate[],
): GroceryItem[] {
  const patchMap = new Map(updates.map((update) => [update.id, update]))
  return sortItems(
    items.map((item) => {
      const patch = patchMap.get(item.id)
      if (!patch) return item
      return {
        ...item,
        category: patch.category,
        sort_order: patch.sort_order,
      }
    }),
  )
}

export function computeReorderPatch(
  activeId: string,
  overId: string,
  items: GroceryItem[],
  categoryIds: readonly CategoryId[],
): ItemOrderUpdate[] | null {
  const activeItem = items.find((item) => item.id === activeId)
  if (!activeItem) return null
  if (activeId === overId) return null

  const sourceCategory = activeItem.category as CategoryId
  const overIsCategory = categoryIds.includes(overId as CategoryId)

  let targetCategory: CategoryId
  let insertIndex: number

  const targetWithoutActive = (categoryId: CategoryId) =>
    sortItemsInCategory(items, categoryId).filter((item) => item.id !== activeId)

  if (overIsCategory) {
    targetCategory = overId as CategoryId
    insertIndex = targetWithoutActive(targetCategory).length
  } else {
    const overItem = items.find((item) => item.id === overId)
    if (!overItem) return null
    targetCategory = overItem.category as CategoryId
    const siblings = targetWithoutActive(targetCategory)
    insertIndex = siblings.findIndex((item) => item.id === overId)
    if (insertIndex === -1) insertIndex = siblings.length
  }

  const newTargetList = [...targetWithoutActive(targetCategory)]
  newTargetList.splice(insertIndex, 0, {
    ...activeItem,
    category: targetCategory,
  })

  const updates: ItemOrderUpdate[] = newTargetList.map((item, index) => ({
    id: item.id,
    category: targetCategory,
    sort_order: index,
  }))

  if (sourceCategory !== targetCategory) {
    const sourceItems = targetWithoutActive(sourceCategory)
    for (const [index, item] of sourceItems.entries()) {
      updates.push({
        id: item.id,
        category: sourceCategory,
        sort_order: index,
      })
    }
  }

  const hasChange = updates.some((update) => {
    const item = items.find((entry) => entry.id === update.id)
    if (!item) return true
    return item.category !== update.category || item.sort_order !== update.sort_order
  })

  return hasChange ? updates : null
}
