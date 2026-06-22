import type { CategoryId } from '../types'
import { DEFAULT_CATEGORY } from '../constants/categories'
import { getOverride } from './categoryOverrides'
import { getRecentItems } from './recentItems'

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
    'beer', 'coffee', 'cola', 'coke', 'pepsi', 'sprite', 'fanta', 'drink',
    'juice', 'soda', 'tea', 'water', 'wine', 'kombucha', 'seltzer', 'sparkling',
    'coke zero', 'diet coke', 'coca cola', 'energy drink', 'ginger ale',
  ],
  household: [
    'bag', 'bags', 'bleach', 'cleaner', 'detergent', 'diapers', 'foil',
    'garbage', 'napkin', 'napkins', 'paper towel', 'soap', 'sponge', 'tissue',
    'toilet', 'toothpaste', 'towel', 'trash', 'laundry', 'dish soap',
    'cotton tips', 'cotton buds', 'q tips', 'q-tips', 'qtips', 'buds',
    'shampoo', 'conditioner', 'deodorant', 'razor', 'bandage', 'vitamin',
    'lotion', 'sanitizer',
  ],
  other: [],
}

function normalizeForMatch(text: string): string {
  return text.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ')
}

function matchKeywords(normalized: string): CategoryId | null {
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

export function guessCategory(text: string, listId?: string): CategoryId | null {
  const normalized = normalizeForMatch(text)
  if (!normalized) return null

  if (listId) {
    const override = getOverride(listId, text)
    if (override) return override

    const recent = getRecentItems(listId).find(
      (item) => normalizeForMatch(item.text) === normalized,
    )
    if (recent) return recent.category
  }

  return matchKeywords(normalized)
}

export function guessCategoryOrDefault(text: string, listId?: string): CategoryId {
  return guessCategory(text, listId) ?? DEFAULT_CATEGORY
}
