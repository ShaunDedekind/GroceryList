import {
  BUILTIN_CATEGORIES,
  BUILTIN_CATEGORY_MAP,
  DEFAULT_CATEGORY_ORDER,
  isBuiltinCategoryId,
  isCustomCategoryId,
  type Category,
} from '../constants/categories'
import type { CategoryConfig, CategoryId, CustomCategory } from '../types'

export interface ResolvedCategory extends Category {
  visible: boolean
  builtin: boolean
  keywords: string[]
}

function normalizeKeywords(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const keywords = raw
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  return keywords.length > 0 ? [...new Set(keywords)] : undefined
}

function parseCustomCategories(raw: unknown): CustomCategory[] | undefined {
  if (!Array.isArray(raw)) return undefined

  const custom: CustomCategory[] = []
  const seen = new Set<string>()

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
    const obj = entry as Record<string, unknown>
    if (!isCustomCategoryId(obj.id)) continue
    if (typeof obj.label !== 'string' || !obj.label.trim()) continue
    if (typeof obj.emoji !== 'string' || !obj.emoji.trim()) continue
    if (seen.has(obj.id)) continue
    seen.add(obj.id)

    const keywords = normalizeKeywords(obj.keywords)
    custom.push({
      id: obj.id,
      label: obj.label.trim(),
      emoji: obj.emoji.trim(),
      ...(keywords ? { keywords } : {}),
    })
  }

  return custom.length > 0 ? custom : undefined
}

export function parseCategoryConfig(raw: unknown): CategoryConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  const obj = raw as Record<string, unknown>
  const custom = parseCustomCategories(obj.custom)
  const customIds = new Set((custom ?? []).map((entry) => entry.id))

  const isKnownId = (value: unknown): value is CategoryId =>
    isBuiltinCategoryId(value) ||
    (isCustomCategoryId(value) && customIds.has(value))

  const order = Array.isArray(obj.order)
    ? obj.order.filter(isKnownId)
    : undefined
  const hidden = Array.isArray(obj.hidden)
    ? obj.hidden.filter(isKnownId)
    : undefined

  let labels: Partial<Record<string, string>> | undefined
  if (obj.labels && typeof obj.labels === 'object' && !Array.isArray(obj.labels)) {
    labels = {}
    for (const [key, value] of Object.entries(obj.labels)) {
      if (isKnownId(key) && typeof value === 'string' && value.trim()) {
        labels[key] = value.trim()
      }
    }
    if (Object.keys(labels).length === 0) labels = undefined
  }

  return {
    ...(order ? { order } : {}),
    ...(hidden ? { hidden } : {}),
    ...(labels ? { labels } : {}),
    ...(custom ? { custom } : {}),
  }
}

export function mergeCategoryOrder(
  order: CategoryId[] | undefined,
  customIds: readonly string[] = [],
): CategoryId[] {
  const seen = new Set<CategoryId>()
  const merged: CategoryId[] = []

  for (const id of order ?? []) {
    if (!seen.has(id) && (isBuiltinCategoryId(id) || customIds.includes(id))) {
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

  for (const id of customIds) {
    if (!seen.has(id)) {
      seen.add(id)
      merged.push(id)
    }
  }

  return merged
}

function customCategoryMap(
  custom: CustomCategory[] | undefined,
): Map<string, CustomCategory> {
  return new Map((custom ?? []).map((entry) => [entry.id, entry]))
}

export function resolveCategories(config: CategoryConfig): ResolvedCategory[] {
  const hidden = new Set(config.hidden ?? [])
  const customs = customCategoryMap(config.custom)
  const customIds = [...customs.keys()]
  const order = mergeCategoryOrder(config.order, customIds)
  const resolved: ResolvedCategory[] = []

  for (const id of order) {
    if (isBuiltinCategoryId(id)) {
      const base = BUILTIN_CATEGORY_MAP[id]
      resolved.push({
        ...base,
        label: config.labels?.[id] ?? base.label,
        visible: !hidden.has(id),
        builtin: true,
        keywords: [],
      })
      continue
    }

    const custom = customs.get(id)
    if (!custom) continue

    resolved.push({
      id: custom.id,
      label: config.labels?.[id] ?? custom.label,
      emoji: custom.emoji,
      visible: !hidden.has(id),
      builtin: false,
      keywords: custom.keywords ?? [],
    })
  }

  return resolved
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
    (isBuiltinCategoryId(id) ? BUILTIN_CATEGORY_MAP[id].label : 'Other')
  )
}

export function getCategoryEmojiFromResolved(
  resolved: ResolvedCategory[],
  id: CategoryId,
): string {
  return (
    resolved.find((category) => category.id === id)?.emoji ??
    (isBuiltinCategoryId(id) ? BUILTIN_CATEGORY_MAP[id].emoji : '📦')
  )
}

export function buildCategoryConfigFromResolved(
  resolved: ResolvedCategory[],
): CategoryConfig {
  const order = resolved.map((category) => category.id)
  const hidden = resolved
    .filter((category) => !category.visible)
    .map((category) => category.id)

  const labels: Partial<Record<string, string>> = {}
  const custom: CustomCategory[] = []

  for (const category of resolved) {
    if (category.builtin) {
      const defaultLabel = BUILTIN_CATEGORY_MAP[category.id as keyof typeof BUILTIN_CATEGORY_MAP]
        ?.label
      if (defaultLabel && category.label !== defaultLabel) {
        labels[category.id] = category.label
      }
    } else {
      custom.push({
        id: category.id,
        label: category.label,
        emoji: category.emoji,
        ...(category.keywords.length > 0 ? { keywords: category.keywords } : {}),
      })
    }
  }

  return {
    order,
    ...(hidden.length > 0 ? { hidden } : {}),
    ...(Object.keys(labels).length > 0 ? { labels } : {}),
    ...(custom.length > 0 ? { custom } : {}),
  }
}

export function resolveCategoryId(
  value: unknown,
  resolved: ResolvedCategory[],
): CategoryId {
  if (typeof value !== 'string') return 'other'
  if (resolved.some((category) => category.id === value)) return value
  if (isBuiltinCategoryId(value)) return value
  return 'other'
}

export function knownCategoryIds(resolved: ResolvedCategory[]): Set<string> {
  return new Set(resolved.map((category) => category.id))
}

export function defaultResolvedCategories(): ResolvedCategory[] {
  return BUILTIN_CATEGORIES.map((category) => ({
    ...category,
    visible: true,
    builtin: true,
    keywords: [],
  }))
}
