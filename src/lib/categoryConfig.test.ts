import { describe, expect, it } from 'vitest'
import {
  buildCategoryConfigFromResolved,
  mergeCategoryOrder,
  parseCategoryConfig,
  resolveCategories,
} from './categoryConfig'

describe('parseCategoryConfig', () => {
  it('returns empty config for invalid input', () => {
    expect(parseCategoryConfig(null)).toEqual({})
    expect(parseCategoryConfig('bad')).toEqual({})
  })

  it('parses order, hidden, and labels', () => {
    expect(
      parseCategoryConfig({
        order: ['meat', 'fruit_veg', 'invalid'],
        hidden: ['frozen', 'bad'],
        labels: { meat: 'Proteins', bad: 'Nope' },
      }),
    ).toEqual({
      order: ['meat', 'fruit_veg'],
      hidden: ['frozen'],
      labels: { meat: 'Proteins' },
    })
  })
})

describe('resolveCategories', () => {
  it('merges custom order with defaults', () => {
    const resolved = resolveCategories({ order: ['meat', 'fruit_veg'] })
    expect(resolved[0]?.id).toBe('meat')
    expect(resolved[1]?.id).toBe('fruit_veg')
    expect(resolved).toHaveLength(12)
  })

  it('applies hidden and custom labels', () => {
    const resolved = resolveCategories({
      hidden: ['frozen'],
      labels: { meat: 'Proteins' },
    })

    const meat = resolved.find((category) => category.id === 'meat')
    const frozen = resolved.find((category) => category.id === 'frozen')

    expect(meat?.label).toBe('Proteins')
    expect(frozen?.visible).toBe(false)
  })
})

describe('mergeCategoryOrder', () => {
  it('appends missing default categories', () => {
    const order = mergeCategoryOrder(['drinks', 'snacks'])
    expect(order.slice(0, 2)).toEqual(['drinks', 'snacks'])
    expect(order).toContain('other')
    expect(order).toHaveLength(12)
  })
})

describe('buildCategoryConfigFromResolved', () => {
  it('round-trips visible categories and labels', () => {
    const resolved = resolveCategories({
      order: ['meat', 'fruit_veg'],
      hidden: ['frozen'],
      labels: { meat: 'Proteins' },
    })

    const config = buildCategoryConfigFromResolved(resolved)
    const again = resolveCategories(config)

    expect(again.find((category) => category.id === 'meat')?.label).toBe('Proteins')
    expect(again.find((category) => category.id === 'frozen')?.visible).toBe(false)
    expect(again[0]?.id).toBe('meat')
  })
})
