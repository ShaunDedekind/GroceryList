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

  it('prefers override over recent items', () => {
    saveRecentItem(LIST_ID, 'fancy brand thing', 'drinks')
    saveOverride(LIST_ID, 'fancy brand thing', 'pantry')
    expect(guessCategory('fancy brand thing', LIST_ID)).toBe('pantry')
  })
})
