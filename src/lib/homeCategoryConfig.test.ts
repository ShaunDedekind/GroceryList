import { describe, expect, it } from 'vitest'
import {
  buildHomeCategoryConfigFromResolved,
  mergeHomeCategoryOrder,
  parseHomeCategoryConfig,
  resolveHomeCategories,
} from './homeCategoryConfig'
import { guessHomeCategory } from './homeCategoryGuess'
import { shouldDeleteOnClearChecked } from './sectionItems'

describe('parseHomeCategoryConfig', () => {
  it('returns empty config for invalid input', () => {
    expect(parseHomeCategoryConfig(null)).toEqual({})
    expect(parseHomeCategoryConfig('bad')).toEqual({})
  })

  it('parses order, hidden, and labels', () => {
    expect(
      parseHomeCategoryConfig({
        order: ['maintenance', 'cleaning', 'invalid'],
        hidden: ['pets', 'bad'],
        labels: { maintenance: 'Fixes', bad: 'Nope' },
      }),
    ).toEqual({
      order: ['maintenance', 'cleaning'],
      hidden: ['pets'],
      labels: { maintenance: 'Fixes' },
    })
  })
})

describe('resolveHomeCategories', () => {
  it('merges custom order with defaults', () => {
    const resolved = resolveHomeCategories({ order: ['maintenance', 'cleaning'] })
    expect(resolved[0]?.id).toBe('maintenance')
    expect(resolved[1]?.id).toBe('cleaning')
    expect(resolved).toHaveLength(8)
  })

  it('applies hidden and custom labels', () => {
    const resolved = resolveHomeCategories({
      hidden: ['pets'],
      labels: { maintenance: 'Fixes' },
    })

    const maintenance = resolved.find((category) => category.id === 'maintenance')
    const pets = resolved.find((category) => category.id === 'pets')

    expect(maintenance?.label).toBe('Fixes')
    expect(pets?.visible).toBe(false)
  })
})

describe('mergeHomeCategoryOrder', () => {
  it('appends missing default categories', () => {
    const order = mergeHomeCategoryOrder(['garden', 'kids'])
    expect(order.slice(0, 2)).toEqual(['garden', 'kids'])
    expect(order).toContain('other')
    expect(order).toHaveLength(8)
  })
})

describe('buildHomeCategoryConfigFromResolved', () => {
  it('round-trips visible categories and labels', () => {
    const resolved = resolveHomeCategories({
      order: ['maintenance', 'cleaning'],
      hidden: ['pets'],
      labels: { maintenance: 'Fixes' },
    })

    const config = buildHomeCategoryConfigFromResolved(resolved)
    const again = resolveHomeCategories(config)

    expect(again.find((category) => category.id === 'maintenance')?.label).toBe(
      'Fixes',
    )
    expect(again.find((category) => category.id === 'pets')?.visible).toBe(false)
    expect(again[0]?.id).toBe('maintenance')
  })
})

describe('guessHomeCategory', () => {
  it('maps maintenance keywords', () => {
    expect(guessHomeCategory('fix leaking tap', 'list-1')).toBe('maintenance')
  })

  it('maps cleaning keywords', () => {
    expect(guessHomeCategory('vacuum living room', 'list-1')).toBe('cleaning')
  })

  it('returns null for unknown text', () => {
    expect(guessHomeCategory('xyz', 'list-1')).toBeNull()
  })
})

describe('shouldDeleteOnClearChecked', () => {
  it('deletes only for grocery section', () => {
    expect(shouldDeleteOnClearChecked('grocery')).toBe(true)
    expect(shouldDeleteOnClearChecked('home')).toBe(false)
  })
})
