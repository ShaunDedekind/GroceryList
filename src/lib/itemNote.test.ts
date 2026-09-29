import { describe, expect, it } from 'vitest'
import { parseItemDisplay } from './itemNote'

describe('parseItemDisplay', () => {
  it('returns the full text when there is no dash separator', () => {
    expect(parseItemDisplay('half and half')).toEqual({
      title: 'half and half',
      note: null,
    })
  })

  it('splits on " - "', () => {
    expect(parseItemDisplay('ms balls - only if on sale')).toEqual({
      title: 'ms balls',
      note: 'only if on sale',
    })
  })

  it('splits on em dash', () => {
    expect(parseItemDisplay('milk — oat preferred')).toEqual({
      title: 'milk',
      note: 'oat preferred',
    })
  })

  it('splits on en dash', () => {
    expect(parseItemDisplay('bread – sourdough')).toEqual({
      title: 'bread',
      note: 'sourdough',
    })
  })

  it('ignores a lone trailing dash', () => {
    expect(parseItemDisplay('milk -')).toEqual({
      title: 'milk -',
      note: null,
    })
  })

  it('trims whitespace', () => {
    expect(parseItemDisplay('  eggs - free range  ')).toEqual({
      title: 'eggs',
      note: 'free range',
    })
  })
})
