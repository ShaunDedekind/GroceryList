import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseBulkText, normalizeParsedItems } from './parseBulkText'

const LIST_ID = 'test-list-id'

const storage = new Map<string, string>()

beforeEach(() => {
  storage.clear()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value)
    },
    removeItem: (key: string) => {
      storage.delete(key)
    },
    clear: () => storage.clear(),
    key: () => null,
    length: 0,
  })
})

describe('parseBulkText', () => {
  it('parses shopping lists with comma splitting', () => {
    const items = parseBulkText('eggs, bread, milk', LIST_ID)
    expect(items.map((item) => item.text)).toEqual(['eggs', 'bread', 'milk'])
  })

  it('parses recipe lines without comma splitting', () => {
    const recipe = [
      'Ingredients:',
      '2 tbsp olive oil, extra virgin',
      '1/2 cup sugar',
      '2 eggs',
      'salt and pepper to taste',
    ].join('\n')

    const items = parseBulkText(recipe, LIST_ID)
    const names = items.map((item) => item.text)

    expect(names).toContain('olive oil, extra virgin')
    expect(names).toContain('sugar')
    expect(names).toContain('eggs')
    expect(names).toContain('salt')
    expect(names).toContain('pepper')
  })

  it('skips instruction lines in recipe mode', () => {
    const recipe = [
      'Ingredients',
      '2 cups flour',
      'Preheat oven to 350°F',
      'Bake for 25 minutes',
    ].join('\n')

    const items = parseBulkText(recipe, LIST_ID)
    expect(items.map((item) => item.text)).toEqual(['flour'])
  })

  it('dedupes case-insensitive matches', () => {
    const items = parseBulkText('Eggs\neggs', LIST_ID)
    expect(items).toHaveLength(1)
    expect(items[0].text).toBe('eggs')
  })
})

describe('normalizeParsedItems', () => {
  it('normalizes and dedupes AI items', () => {
    const items = normalizeParsedItems([
      { text: '2 tsp cumin', category: 'pantry' },
      { text: '1 tsp cumin', category: 'pantry' },
    ])

    expect(items).toHaveLength(1)
    expect(items[0].text).toBe('cumin')
  })
})
