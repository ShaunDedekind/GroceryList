import type { GroceryItem } from '../types'

export interface BuyAgainChip {
  text: string
  category: GroceryItem['category']
}

/**
 * Build deduped "Buy again" chips from checked items, most recently updated first.
 */
export function getBuyAgainChips(
  items: GroceryItem[],
  limit = 12,
): BuyAgainChip[] {
  const checked = items
    .filter((item) => item.checked)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))

  const seen = new Set<string>()
  const chips: BuyAgainChip[] = []

  for (const item of checked) {
    const key = item.text.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    chips.push({ text: item.text.trim(), category: item.category })
    if (chips.length >= limit) break
  }

  return chips
}
