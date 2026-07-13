import type { HomeCategoryId } from '../types'
import {
  HOME_CATEGORY_MAP,
  DEFAULT_HOME_CATEGORY_ORDER,
  isHomeCategoryId,
  type HomeCategory,
} from '../constants/homeCategories'
import type { HomeCategoryConfig } from '../types'

export interface ResolvedHomeCategory extends HomeCategory {
  visible: boolean
}

export function parseHomeCategoryConfig(raw: unknown): HomeCategoryConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const obj = raw as Record<string, unknown>
  const order = Array.isArray(obj.order)
    ? obj.order.filter(isHomeCategoryId)
    : undefined
  const hidden = Array.isArray(obj.hidden)
    ? obj.hidden.filter(isHomeCategoryId)
    : undefined

  let labels: Partial<Record<HomeCategoryId, string>> | undefined
  if (obj.labels && typeof obj.labels === 'object' && !Array.isArray(obj.labels)) {
    labels = {}
    for (const [key, value] of Object.entries(obj.labels)) {
      if (isHomeCategoryId(key) && typeof value === 'string' && value.trim()) {
        labels[key] = value.trim()
      }
    }
  }

  return { order, hidden, labels }
}

export function mergeHomeCategoryOrder(order?: HomeCategoryId[]): HomeCategoryId[] {
  const seen = new Set<HomeCategoryId>()
  const merged: HomeCategoryId[] = []

  for (const id of order ?? []) {
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(id)
    }
  }

  for (const id of DEFAULT_HOME_CATEGORY_ORDER) {
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(id)
    }
  }

  return merged
}

export function resolveHomeCategories(
  config: HomeCategoryConfig,
): ResolvedHomeCategory[] {
  const hidden = new Set(config.hidden ?? [])
  const order = mergeHomeCategoryOrder(config.order)

  return order.map((id) => ({
    ...HOME_CATEGORY_MAP[id],
    label: config.labels?.[id] ?? HOME_CATEGORY_MAP[id].label,
    visible: !hidden.has(id),
  }))
}

export function getVisibleHomeCategories(
  resolved: ResolvedHomeCategory[],
): ResolvedHomeCategory[] {
  return resolved.filter((category) => category.visible)
}

export function buildHomeCategoryConfigFromResolved(
  resolved: ResolvedHomeCategory[],
): HomeCategoryConfig {
  const order = resolved.map((category) => category.id)
  const hidden = resolved
    .filter((category) => !category.visible)
    .map((category) => category.id)
  const labels: Partial<Record<HomeCategoryId, string>> = {}

  for (const category of resolved) {
    const defaultLabel = HOME_CATEGORY_MAP[category.id].label
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
