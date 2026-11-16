import { describe, expect, it } from 'vitest'
import {
  filterSuggestionsNotLive,
  isLiveSuggestionText,
  normalizeSuggestionText,
  rankSuggestionHints,
  uncheckedTextKeys,
} from './suggestionFilter'

describe('normalizeSuggestionText', () => {
  it('trims and lowercases', () => {
    expect(normalizeSuggestionText('  Milk  ')).toBe('milk')
  })
})

describe('uncheckedTextKeys', () => {
  it('returns empty for empty list', () => {
    expect(uncheckedTextKeys([])).toEqual(new Set())
  })

  it('includes only unchecked texts', () => {
    expect(
      uncheckedTextKeys([
        { text: 'Milk', checked: false },
        { text: 'bread', checked: true },
        { text: ' Eggs ', checked: false },
      ]),
    ).toEqual(new Set(['milk', 'eggs']))
  })
})

describe('filterSuggestionsNotLive', () => {
  it('hides live milk from recents', () => {
    const live = uncheckedTextKeys([{ text: 'milk', checked: false }])
    expect(
      filterSuggestionsNotLive(
        [
          { text: 'Milk', category: 'dairy' },
          { text: 'bread', category: 'bakery' },
        ],
        live,
      ),
    ).toEqual([{ text: 'bread', category: 'bakery' }])
  })

  it('keeps milk when only a checked copy exists', () => {
    const live = uncheckedTextKeys([{ text: 'milk', checked: true }])
    expect(
      filterSuggestionsNotLive([{ text: 'milk', category: 'dairy' }], live),
    ).toEqual([{ text: 'milk', category: 'dairy' }])
  })
})

describe('rankSuggestionHints', () => {
  const recents = [
    { text: 'almond milk', category: 'dairy' },
    { text: 'milk', category: 'dairy' },
    { text: 'coconut milk', category: 'pantry' },
    { text: 'oat milk', category: 'dairy' },
  ]

  it('prefers prefix matches then contains, excluding live', () => {
    const live = uncheckedTextKeys([{ text: 'milk', checked: false }])
    expect(rankSuggestionHints(recents, 'mil', live, 5)).toEqual([
      { text: 'almond milk', category: 'dairy' },
      { text: 'coconut milk', category: 'pantry' },
      { text: 'oat milk', category: 'dairy' },
    ])
  })

  it('returns empty for short queries', () => {
    expect(rankSuggestionHints(recents, 'm', new Set())).toEqual([])
  })
})

describe('isLiveSuggestionText', () => {
  it('detects exact live match', () => {
    const live = new Set(['milk'])
    expect(isLiveSuggestionText('Milk', live)).toBe(true)
    expect(isLiveSuggestionText('almond milk', live)).toBe(false)
  })
})
