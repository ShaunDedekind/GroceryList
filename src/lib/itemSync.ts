import type { GroceryItem } from '../types'

function timestamp(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function isAtLeastAsNew(localUpdatedAt: string, incomingUpdatedAt: string): boolean {
  return timestamp(localUpdatedAt) >= timestamp(incomingUpdatedAt)
}

export function mergeItemFromServer(
  local: GroceryItem | undefined,
  incoming: GroceryItem,
  pendingChecked: boolean | undefined,
): GroceryItem {
  if (pendingChecked !== undefined && incoming.checked !== pendingChecked) {
    const base =
      local && isAtLeastAsNew(local.updated_at, incoming.updated_at)
        ? local
        : incoming
    return { ...base, checked: pendingChecked }
  }

  if (local && isAtLeastAsNew(local.updated_at, incoming.updated_at)) {
    return local
  }

  return incoming
}

export function mergeServerItems(
  local: GroceryItem[],
  incoming: GroceryItem[],
  pendingChecks: ReadonlyMap<string, boolean>,
): GroceryItem[] {
  const localById = new Map(local.map((item) => [item.id, item]))
  return incoming.map((item) =>
    mergeItemFromServer(localById.get(item.id), item, pendingChecks.get(item.id)),
  )
}

export function mergeServerItem(
  local: GroceryItem[],
  incoming: GroceryItem,
  pendingChecks: ReadonlyMap<string, boolean>,
): GroceryItem[] {
  const index = local.findIndex((item) => item.id === incoming.id)
  const merged = mergeItemFromServer(
    index === -1 ? undefined : local[index],
    incoming,
    pendingChecks.get(incoming.id),
  )
  if (index === -1) return [...local, merged]
  return local.map((item, itemIndex) => (itemIndex === index ? merged : item))
}
