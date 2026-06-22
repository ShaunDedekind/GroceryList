import type { CategoryId } from '../types'
import { DEFAULT_CATEGORY } from '../constants/categories'

const KEYWORD_MAP: Record<CategoryId, string[]> = {
  fruit_veg: [
    'apple', 'apples', 'avocado', 'banana', 'bananas', 'berry', 'broccoli',
    'carrot', 'carrots', 'cucumber', 'fruit', 'grape', 'grapes', 'kale',
    'lemon', 'lettuce', 'lime', 'mango', 'melon', 'mushroom', 'onion',
    'orange', 'oranges', 'peach', 'pear', 'pepper', 'potato', 'potatoes',
    'salad', 'spinach', 'strawberry', 'tomato', 'tomatoes', 'veg', 'vegetable',
    'zucchini',
  ],
  meat: [
    'bacon', 'beef', 'chicken', 'cod', 'fish', 'ham', 'lamb', 'mince',
    'pork', 'prawn', 'prawns', 'salmon', 'sausage', 'seafood', 'shrimp',
    'steak', 'tuna', 'turkey',
  ],
  dairy: [
    'butter', 'cheese', 'cream', 'egg', 'eggs', 'milk', 'mozzarella',
    'parmesan', 'yogurt', 'yoghurt',
  ],
  bakery: [
    'bagel', 'bagels', 'baguette', 'bread', 'bun', 'buns', 'cake', 'croissant',
    'muffin', 'pastry', 'roll', 'rolls', 'toast',
  ],
  pantry: [
    'beans', 'cereal', 'chips', 'crisps', 'flour', 'honey', 'jam', 'noodle',
    'noodles', 'nut', 'nuts', 'oil', 'pasta', 'peanut', 'peanut butter',
    'rice', 'salt', 'sauce', 'snack', 'soup', 'spice', 'sugar', 'tinned',
    'tuna can',
  ],
  frozen: [
    'frozen', 'ice cream', 'icecream', 'pizza', 'popsicle',
  ],
  drinks: [
    'beer', 'coffee', 'cola', 'drink', 'juice', 'soda', 'tea', 'water', 'wine',
  ],
  household: [
    'bag', 'bags', 'bleach', 'cleaner', 'detergent', 'foil', 'garbage',
    'napkin', 'napkins', 'paper towel', 'soap', 'sponge', 'tissue', 'toilet',
    'toothpaste', 'towel', 'trash', 'wrap',
  ],
  other: [],
}

export function guessCategory(text: string): CategoryId | null {
  const normalized = text.trim().toLowerCase()
  if (!normalized) return null

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

export function guessCategoryOrDefault(text: string): CategoryId {
  return guessCategory(text) ?? DEFAULT_CATEGORY
}
