import {
  CATEGORY_MAP,
  DEFAULT_CATEGORY_ORDER,
  isCategoryId,
  type Category,
} from '../constants/categories'
import type { CategoryConfig, CategoryId } from '../types'

export interface ResolvedCategory extends Category {
  visible: boolean
}

export function parseCategoryConfig(raw: unknown): CategoryConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const obj = raw as Record<string, unknown>
  const order = Array.isArray(obj.order)
    ? obj.order.filter(isCategoryId)
    : undefined
  const hidden = Array.isArray(obj.hidden)
    ? obj.hidden.filter(isCategoryId)
    : undefined

  let labels: Partial<Record<CategoryId, string>> | undefined
  if (obj.labels && typeof obj.labels === 'object' && !Array.isArray(obj.labels)) {
    labels = {}
    for (const [key, value] of Object.entries(obj.labels)) {
      if (isCategoryId(key) && typeof value === 'string' && value.trim()) {
        labels[key] = value.trim()
      }
    }
  }

  return { order, hidden, labels }
}

export function mergeCategoryOrder(order?: CategoryId[]): CategoryId[] {
  const seen = new Set<CategoryId>()
  const merged: CategoryId[] = []

  for (const id of order ?? []) {
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(id)
    }
  }

  for (const id of DEFAULT_CATEGORY_ORDER) {
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(id)
    }
  }

  return merged
}

export function resolveCategories(config: CategoryConfig): ResolvedCategory[] {
  const hidden = new Set(config.hidden ?? [])
  const order = mergeCategoryOrder(config.order)

  return order.map((id) => ({
    ...CATEGORY_MAP[id],
    label: config.labels?.[id] ?? CATEGORY_MAP[id].label,
    visible: !hidden.has(id),
  }))
}

export function getVisibleCategories(resolved: ResolvedCategory[]): ResolvedCategory[] {
  return resolved.filter((category) => category.visible)
}

export function getCategoryLabelFromResolved(
  resolved: ResolvedCategory[],
  id: CategoryId,
): string {
  return (
    resolved.find((category) => category.id === id)?.label ??
    CATEGORY_MAP[id]?.label ??
    'Other'
  )
}

export function buildCategoryConfigFromResolved(
  resolved: ResolvedCategory[],
): CategoryConfig {
  const order = resolved.map((category) => category.id)
  const hidden = resolved.filter((category) => !category.visible).map((category) => category.id)
  const labels: Partial<Record<CategoryId, string>> = {}

  for (const category of resolved) {
    const defaultLabel = CATEGORY_MAP[category.id].label
    if (category.label !== defaultLabel) {
      labels[category.id] = category.label
    }
  }

  return {
    order,
    hidden: hidden.length > 0 ? hidden : undefined,
    labels: Object.keys(labels).length > 0 ? labels : undefined,
  }
}
