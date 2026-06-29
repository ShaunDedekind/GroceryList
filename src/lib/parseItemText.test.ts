import { describe, expect, it } from 'vitest'
import { normalizeIngredientName, parseItemText } from './parseItemText'

describe('normalizeIngredientName', () => {
  it('strips abbreviated units', () => {
    expect(normalizeIngredientName('2 tbsp olive oil')).toBe('olive oil')
    expect(normalizeIngredientName('2 cups flour')).toBe('flour')
  })

  it('strips full-word units and fractions', () => {
    expect(normalizeIngredientName('1/2 cup sugar')).toBe('sugar')
    expect(normalizeIngredientName('2 tablespoons butter')).toBe('butter')
  })

  it('strips bare counts', () => {
    expect(normalizeIngredientName('2 eggs')).toBe('eggs')
    expect(normalizeIngredientName('3 large eggs')).toBe('eggs')
  })

  it('strips prep tails', () => {
    expect(normalizeIngredientName('1 onion, diced')).toBe('onion')
    expect(normalizeIngredientName('garlic - minced')).toBe('garlic')
    expect(normalizeIngredientName('salt to taste')).toBe('salt')
  })

  it('preserves product names with percentages', () => {
    expect(normalizeIngredientName('2% milk')).toBe('2% milk')
  })

  it('strips bullets and numbered prefixes', () => {
    expect(normalizeIngredientName('- 1 onion, diced')).toBe('onion')
    expect(normalizeIngredientName('1. cumin')).toBe('cumin')
  })

  it('strips weight parentheticals', () => {
    expect(normalizeIngredientName('tomatoes (14 oz can)')).toBe('tomatoes')
  })

  it('strips instructional parentheticals', () => {
    expect(normalizeIngredientName('fine salt (for pasta water — go light)')).toBe(
      'fine salt',
    )
  })
})

describe('parseItemText', () => {
  it('returns normalized text', () => {
    expect(parseItemText('1 tsp cumin').text).toBe('cumin')
  })

  it('returns empty for blank input', () => {
    expect(parseItemText('   ').text).toBe('')
  })
})
