import type { CategoryId } from '../types'
import { DEFAULT_CATEGORY } from '../constants/categories'
import { getOverride } from './categoryOverrides'

const KEYWORD_MAP: Record<CategoryId, string[]> = {
  fruit_veg: [
    'apple', 'apples', 'avocado', 'banana', 'bananas', 'berry', 'broccoli',
    'carrot', 'carrots', 'cucumber', 'fruit', 'garlic', 'ginger', 'grape',
    'grapes', 'kale', 'lemon', 'lettuce', 'lime', 'mango', 'melon', 'mushroom',
    'onion', 'orange', 'oranges', 'peach', 'pear', 'pepper', 'potato',
    'potatoes', 'salad', 'spinach', 'strawberry', 'tomato', 'tomatoes', 'veg',
    'vegetable', 'zucchini', 'cilantro', 'parsley', 'basil', 'herbs',
  ],
  meat: [
    'bacon', 'beef', 'chicken', 'cod', 'fish', 'ham', 'lamb', 'mince',
    'pork', 'prawn', 'prawns', 'salmon', 'sausage', 'seafood', 'shrimp',
    'steak', 'tuna', 'turkey', 'thighs', 'breast', 'ground beef',
  ],
  dairy: [
    'butter', 'cheese', 'cream', 'egg', 'eggs', 'milk', 'mozzarella',
    'parmesan', 'yogurt', 'yoghurt', 'halloumi', 'feta', 'cheddar',
    'sour cream', 'cottage cheese',
  ],
  bakery: [
    'bagel', 'bagels', 'baguette', 'bread', 'bun', 'buns', 'cake', 'croissant',
    'muffin', 'pastry', 'roll', 'rolls', 'toast', 'tortilla', 'tortillas',
    'pita', 'wrap', 'wraps',
  ],
  pantry: [
    'beans', 'cereal', 'chips', 'crisps', 'flour', 'honey', 'jam', 'noodle',
    'noodles', 'nut', 'nuts', 'oil', 'pasta', 'peanut', 'peanut butter',
    'rice', 'salt', 'sauce', 'snack', 'soup', 'spice', 'sugar', 'tinned',
    'tuna can', 'coconut milk', 'broth', 'stock', 'vinegar', 'olive oil',
    'canned', 'lentils', 'chickpeas',
  ],
  frozen: [
    'frozen', 'ice cream', 'icecream', 'pizza', 'popsicle',
  ],
  drinks: [
    'beer', 'coffee', 'cola', 'drink', 'juice', 'soda', 'tea', 'water', 'wine',
  ],
  household: [
    'bag', 'bags', 'bleach', 'cleaner', 'detergent', 'diapers', 'foil',
    'garbage', 'napkin', 'napkins', 'paper towel', 'soap', 'sponge', 'tissue',
    'toilet', 'toothpaste', 'towel', 'trash', 'wrap', 'laundry', 'dish soap',
  ],
  other: [],
}

export function guessCategory(text: string, listId?: string): CategoryId | null {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return null

  if (listId) {
    const override = getOverride(listId, text)
    if (override) return override
  }

  for (const [categoryId, keywords] of Object.entries(KEYWORD_MAP) as [
    CategoryId,
    string[],
  ][]) {
    if (categoryId === 'other') continue
    for (const keyword of keywords) {
      if (
        normalized === keyword ||
        normalized.startsWith(`${keyword} `) ||
        normalized.endsWith(` ${keyword}`) ||
        normalized.includes(` ${keyword} `)
      ) {
        return categoryId
      }
    }
  }

  // Single-word partial match for short inputs (e.g. "mil" won't match, "milk" will)
  const words = normalized.split(/\s+/)
  for (const word of words) {
    for (const [categoryId, keywords] of Object.entries(KEYWORD_MAP) as [
      CategoryId,
      string[],
    ][]) {
      if (categoryId === 'other') continue
      if (keywords.includes(word)) return categoryId
    }
  }

  return null
}

export function guessCategoryOrDefault(text: string, listId?: string): CategoryId {
  return guessCategory(text, listId) ?? DEFAULT_CATEGORY
}
