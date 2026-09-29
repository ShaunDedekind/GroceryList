import { describe, expect, it } from 'vitest'
import { normalizeItemSection, shouldDeleteOnClearChecked } from './sectionItems'

describe('normalizeItemSection', () => {
  it('keeps grocery, home, and henry', () => {
    expect(normalizeItemSection('grocery')).toBe('grocery')
    expect(normalizeItemSection('home')).toBe('home')
    expect(normalizeItemSection('henry')).toBe('henry')
  })

  it('falls back to grocery for unknown values', () => {
    expect(normalizeItemSection('nope')).toBe('grocery')
    expect(normalizeItemSection(null)).toBe('grocery')
  })
})

describe('shouldDeleteOnClearChecked', () => {
  it('only deletes checked grocery items', () => {
    expect(shouldDeleteOnClearChecked('grocery')).toBe(true)
    expect(shouldDeleteOnClearChecked('home')).toBe(false)
    expect(shouldDeleteOnClearChecked('henry')).toBe(false)
  })
})
