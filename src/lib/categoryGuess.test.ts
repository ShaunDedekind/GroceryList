import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guessCategory } from './categoryGuess'
import { saveOverride } from './categoryOverrides'
import { saveRecentItem } from './recentItems'

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

describe('guessCategory', () => {
  it('classifies coke zero as drinks', () => {
    expect(guessCategory('coke zero')).toBe('drinks')
  })

  it('classifies cotton tips as personal care', () => {
    expect(guessCategory('cotton tips')).toBe('personal_care')
  })

  it('classifies q-tips as personal care via hyphen normalization', () => {
    expect(guessCategory('q-tips')).toBe('personal_care')
  })

  it('classifies chips as snacks', () => {
    expect(guessCategory('chips')).toBe('snacks')
  })

  it('classifies chocolate as sweet tooth', () => {
    expect(guessCategory('chocolate')).toBe('sweet_tooth')
  })

  it('classifies lollies as sweet tooth', () => {
    expect(guessCategory('lollies')).toBe('sweet_tooth')
  })

  it('classifies cookies as sweet tooth', () => {
    expect(guessCategory('cookies')).toBe('sweet_tooth')
  })

  it('classifies rigatoni as pantry', () => {
    expect(guessCategory('rigatoni')).toBe('pantry')
  })

  it('classifies penne as pantry', () => {
    expect(guessCategory('penne')).toBe('pantry')
  })

  it('classifies spaghetti as pantry', () => {
    expect(guessCategory('spaghetti')).toBe('pantry')
  })

  it('uses custom aisle keywords when provided', () => {
    expect(
      guessCategory('briquettes', {
        extraKeywords: { custom_bbq_zz99: ['briquettes', 'charcoal'] },
        knownIds: new Set(['custom_bbq_zz99', 'other']),
      }),
    ).toBe('custom_bbq_zz99')
  })

  it('ignores stale overrides outside known ids', () => {
    saveOverride(LIST_ID, 'mystery item', 'custom_gone_0000')
    expect(
      guessCategory('mystery item', {
        listId: LIST_ID,
        knownIds: new Set(['other', 'pantry']),
      }),
    ).toBeNull()
  })

  it('classifies hummus as deli', () => {
    expect(guessCategory('hummus')).toBe('deli')
  })

  it('prefers override over keywords', () => {
    saveOverride(LIST_ID, 'coke zero', 'pantry')
    expect(guessCategory('coke zero', LIST_ID)).toBe('pantry')
  })

  it('uses recent items when keywords miss', () => {
    saveRecentItem(LIST_ID, 'fancy brand thing', 'drinks')
    expect(guessCategory('fancy brand thing', LIST_ID)).toBe('drinks')
  })

  it('classifies chutney as pantry', () => {
    expect(guessCategory('chutney')).toBe('pantry')
  })

  it('classifies mango chutney as pantry', () => {
    expect(guessCategory('mango chutney')).toBe('pantry')
  })

  it('prefers peanut butter over dairy butter', () => {
    expect(guessCategory('peanut butter')).toBe('pantry')
  })

  it('classifies tomato paste as pantry not fruit veg', () => {
    expect(guessCategory('tomato paste')).toBe('pantry')
  })

  it('classifies pickles as pantry', () => {
    expect(guessCategory('pickles')).toBe('pantry')
  })

  it('classifies mayo as pantry', () => {
    expect(guessCategory('mayo')).toBe('pantry')
  })

  it('classifies sourdough as bakery', () => {
    expect(guessCategory('sourdough')).toBe('bakery')
  })

  it('classifies toilet paper as household', () => {
    expect(guessCategory('toilet paper')).toBe('household')
  })
})
