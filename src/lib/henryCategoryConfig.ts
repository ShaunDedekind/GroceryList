import type { HenryCategoryConfig, HenryCategoryId } from '../types'
import {
  DEFAULT_HENRY_CATEGORY_ORDER,
  HENRY_CATEGORY_MAP,
  isHenryCategoryId,
  type HenryCategory,
} from '../constants/henryCategories'

export interface ResolvedHenryCategory extends HenryCategory {
  visible: boolean
}

export function parseHenryCategoryConfig(raw: unknown): HenryCategoryConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const obj = raw as Record<string, unknown>
  const order = Array.isArray(obj.order)
    ? obj.order.filter(isHenryCategoryId)
    : undefined
  const hidden = Array.isArray(obj.hidden)
    ? obj.hidden.filter(isHenryCategoryId)
    : undefined

  let labels: Partial<Record<HenryCategoryId, string>> | undefined
  if (obj.labels && typeof obj.labels === 'object' && !Array.isArray(obj.labels)) {
    labels = {}
    for (const [key, value] of Object.entries(obj.labels)) {
      if (isHenryCategoryId(key) && typeof value === 'string' && value.trim()) {
        labels[key] = value.trim()
      }
    }
  }

  return { order, hidden, labels }
}

export function mergeHenryCategoryOrder(order?: HenryCategoryId[]): HenryCategoryId[] {
  const seen = new Set<HenryCategoryId>()
  const merged: HenryCategoryId[] = []

  for (const id of order ?? []) {
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(id)
    }
  }

  for (const id of DEFAULT_HENRY_CATEGORY_ORDER) {
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(id)
    }
  }

  return merged
}

export function resolveHenryCategories(
  config: HenryCategoryConfig,
): ResolvedHenryCategory[] {
  const hidden = new Set(config.hidden ?? [])
  const order = mergeHenryCategoryOrder(config.order)

  return order.map((id) => ({
    ...HENRY_CATEGORY_MAP[id],
    label: config.labels?.[id] ?? HENRY_CATEGORY_MAP[id].label,
    visible: !hidden.has(id),
  }))
}

export function getVisibleHenryCategories(
  resolved: ResolvedHenryCategory[],
): ResolvedHenryCategory[] {
  return resolved.filter((category) => category.visible)
}

export function buildHenryCategoryConfigFromResolved(
  resolved: ResolvedHenryCategory[],
): HenryCategoryConfig {
  const order = resolved.map((category) => category.id)
  const hidden = resolved
    .filter((category) => !category.visible)
    .map((category) => category.id)
  const labels: Partial<Record<HenryCategoryId, string>> = {}

  for (const category of resolved) {
    const defaultLabel = HENRY_CATEGORY_MAP[category.id].label
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
