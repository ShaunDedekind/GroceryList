import { describe, expect, it } from 'vitest'
import {
  buildCategoryConfigFromResolved,
  mergeCategoryOrder,
  parseCategoryConfig,
  resolveCategories,
  resolveCategoryId,
} from './categoryConfig'

describe('parseCategoryConfig', () => {
  it('returns empty config for invalid input', () => {
    expect(parseCategoryConfig(null)).toEqual({})
    expect(parseCategoryConfig('bad')).toEqual({})
  })

  it('parses order, hidden, labels, and custom aisles', () => {
    expect(
      parseCategoryConfig({
        order: ['meat', 'fruit_veg', 'custom_pets_ab12', 'invalid'],
        hidden: ['frozen', 'bad', 'custom_pets_ab12'],
        labels: { meat: 'Proteins', bad: 'Nope', custom_pets_ab12: 'Pet food' },
        custom: [
          {
            id: 'custom_pets_ab12',
            label: 'Pets',
            emoji: '🐶',
            keywords: ['dog food', 'cat litter'],
          },
          { id: 'not_custom', label: 'Nope', emoji: 'x' },
          { id: 'custom_pets_ab12', label: 'Dup', emoji: 'x' },
        ],
      }),
    ).toEqual({
      order: ['meat', 'fruit_veg', 'custom_pets_ab12'],
      hidden: ['frozen', 'custom_pets_ab12'],
      labels: { meat: 'Proteins', custom_pets_ab12: 'Pet food' },
      custom: [
        {
          id: 'custom_pets_ab12',
          label: 'Pets',
          emoji: '🐶',
          keywords: ['dog food', 'cat litter'],
        },
      ],
    })
  })
})

describe('resolveCategories', () => {
  it('merges custom order with defaults including sweet tooth', () => {
    const resolved = resolveCategories({ order: ['meat', 'fruit_veg'] })
    expect(resolved[0]?.id).toBe('meat')
    expect(resolved[1]?.id).toBe('fruit_veg')
    expect(resolved.some((category) => category.id === 'sweet_tooth')).toBe(true)
    expect(resolved).toHaveLength(13)
  })

  it('applies hidden, custom labels, and custom aisles', () => {
    const resolved = resolveCategories({
      hidden: ['frozen'],
      labels: { meat: 'Proteins' },
      custom: [
        {
          id: 'custom_bbq_zz99',
          label: 'BBQ',
          emoji: '🔥',
          keywords: ['briquettes'],
        },
      ],
    })

    const meat = resolved.find((category) => category.id === 'meat')
    const frozen = resolved.find((category) => category.id === 'frozen')
    const bbq = resolved.find((category) => category.id === 'custom_bbq_zz99')

    expect(meat?.label).toBe('Proteins')
    expect(meat?.builtin).toBe(true)
    expect(frozen?.visible).toBe(false)
    expect(bbq).toMatchObject({
      label: 'BBQ',
      emoji: '🔥',
      builtin: false,
      keywords: ['briquettes'],
      visible: true,
    })
  })
})

describe('mergeCategoryOrder', () => {
  it('appends missing default and custom categories', () => {
    const order = mergeCategoryOrder(['drinks', 'snacks'], ['custom_bbq_zz99'])
    expect(order.slice(0, 2)).toEqual(['drinks', 'snacks'])
    expect(order).toContain('other')
    expect(order).toContain('sweet_tooth')
    expect(order).toContain('custom_bbq_zz99')
    expect(order).toHaveLength(14)
  })
})

describe('buildCategoryConfigFromResolved', () => {
  it('round-trips visible categories, labels, and customs', () => {
    const resolved = resolveCategories({
      order: ['meat', 'fruit_veg', 'custom_bbq_zz99'],
      hidden: ['frozen'],
      labels: { meat: 'Proteins' },
      custom: [
        {
          id: 'custom_bbq_zz99',
          label: 'BBQ',
          emoji: '🔥',
          keywords: ['briquettes'],
        },
      ],
    })

    const config = buildCategoryConfigFromResolved(resolved)
    const again = resolveCategories(config)

    expect(again.find((category) => category.id === 'meat')?.label).toBe('Proteins')
    expect(again.find((category) => category.id === 'frozen')?.visible).toBe(false)
    expect(again.find((category) => category.id === 'custom_bbq_zz99')).toMatchObject({
      label: 'BBQ',
      emoji: '🔥',
      keywords: ['briquettes'],
    })
    expect(again[0]?.id).toBe('meat')
  })
})

describe('resolveCategoryId', () => {
  it('falls back to other for unknown ids', () => {
    const resolved = resolveCategories({})
    expect(resolveCategoryId('pantry', resolved)).toBe('pantry')
    expect(resolveCategoryId('custom_missing_0000', resolved)).toBe('other')
  })
})
