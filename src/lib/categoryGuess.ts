import type { CategoryId } from '../types'
import { DEFAULT_CATEGORY } from '../constants/categories'
import { getOverride } from './categoryOverrides'
import { getRecentItems } from './recentItems'

const KEYWORD_MAP: Record<CategoryId, string[]> = {
  fruit_veg: [
    'apple', 'apples', 'avocado', 'avocados', 'banana', 'bananas', 'berry',
    'berries', 'blueberry', 'blueberries', 'broccoli', 'cabbage', 'capsicum',
    'carrot', 'carrots', 'celery', 'coriander', 'corn', 'cucumber', 'eggplant',
    'fruit', 'garlic', 'ginger', 'grape', 'grapes', 'herbs', 'kale', 'kiwi',
    'lemon', 'lemons', 'lettuce', 'lime', 'limes', 'mango', 'mangoes', 'melon',
    'mushroom', 'mushrooms', 'onion', 'onions', 'orange', 'oranges', 'peach',
    'peaches', 'pear', 'pears', 'pepper', 'peppers', 'pineapple', 'potato',
    'potatoes', 'pumpkin', 'radish', 'rocket', 'salad', 'shallot', 'shallots',
    'spinach', 'spring onion', 'strawberry', 'strawberries', 'sweet potato',
    'tomato', 'tomatoes', 'veg', 'vegetable', 'vegetables', 'zucchini',
    'basil', 'parsley', 'cilantro', 'mint', 'thyme', 'rosemary', 'chilli',
    'chillies', 'chili', 'asparagus', 'beansprouts', 'bean sprouts',
  ],
  snacks: [
    'chips', 'crisps', 'popcorn', 'pretzel', 'pretzels', 'cracker', 'crackers',
    'cookie', 'cookies', 'biscuit', 'biscuits', 'candy', 'chocolate',
    'granola bar', 'snack', 'snacks', 'trail mix', 'jerky', 'nuts mix',
    'muesli bar', 'rice crackers', 'corn chips', 'tortilla chips',
  ],
  meat: [
    'bacon', 'beef', 'chicken', 'cod', 'fish', 'ham', 'lamb', 'mince',
    'pork', 'prawn', 'prawns', 'salmon', 'sausage', 'sausages', 'seafood',
    'shrimp', 'steak', 'tuna', 'turkey', 'thighs', 'breast', 'ground beef',
    'meatballs', 'schnitzel', 'ribs', 'roast', 'fillet',
  ],
  dairy: [
    'butter', 'cheese', 'cream', 'egg', 'eggs', 'milk', 'mozzarella',
    'parmesan', 'yogurt', 'yoghurt', 'halloumi', 'feta', 'cheddar',
    'sour cream', 'cottage cheese', 'cream cheese', 'ricotta', 'brie',
    'camembert', 'margarine', 'oat milk', 'almond milk', 'soy milk',
    'custard', 'creme fraiche', 'crème fraîche',
  ],
  deli: [
    'deli', 'hummus', 'rotisserie', 'prepared', 'coleslaw', 'mac and cheese',
    'potato salad', 'sushi', 'sandwich platter', 'antipasto', 'olives',
    'dip', 'guacamole', 'salsa', 'pesto', 'pate', 'pâté', 'salami',
    'prosciutto', 'quiche', 'falafel', 'tzatziki',
  ],
  bakery: [
    'bagel', 'bagels', 'baguette', 'bread', 'bun', 'buns', 'cake', 'croissant',
    'muffin', 'pastry', 'roll', 'rolls', 'toast', 'tortilla', 'tortillas',
    'pita', 'wrap', 'wraps', 'sourdough', 'ciabatta', 'focaccia', 'naan',
    'english muffin', 'donut', 'doughnut', 'brioche',
  ],
  pantry: [
    'beans', 'cereal', 'flour', 'honey', 'jam', 'jelly', 'marmalade',
    'noodle', 'noodles', 'nut', 'nuts', 'oil', 'pasta', 'peanut',
    'peanut butter', 'almond butter', 'rice', 'salt', 'sauce', 'soup',
    'spice', 'spices', 'sugar', 'tinned', 'tuna can', 'coconut milk',
    'broth', 'stock', 'vinegar', 'olive oil', 'canned', 'lentils',
    'chickpeas', 'chutney', 'chutneys', 'pickle', 'pickles', 'relish',
    'ketchup', 'tomato sauce', 'mustard', 'mayo', 'mayonnaise', 'aioli',
    'soy sauce', 'fish sauce', 'oyster sauce', 'worcestershire', 'hot sauce',
    'sriracha', 'bbq sauce', 'barbecue sauce', 'gravy', 'stock cube',
    'stock cubes', 'bouillon', 'baking powder', 'baking soda', 'bicarb',
    'yeast', 'vanilla', 'cocoa', 'oats', 'oatmeal', 'muesli', 'granola',
    'couscous', 'quinoa', 'polenta', 'cornflour', 'cornstarch', 'breadcrumbs',
    'panko', 'tahini', 'miso', 'curry paste', 'curry powder', 'paprika',
    'cumin', 'turmeric', 'cinnamon', 'nutella', 'spreads', 'spread',
    'preserve', 'preserves', 'condiment', 'condiments', 'syrup', 'maple syrup',
    'coconut cream', 'tomato paste', 'passata', 'passatta', 'baked beans',
    'tuna tin', 'anchovy', 'anchovies', 'capers', 'gherkin', 'gherkins',
  ],
  frozen: [
    'frozen', 'ice cream', 'icecream', 'pizza', 'popsicle', 'ice block',
    'iceblocks', 'frozen peas', 'frozen berries', 'hash browns', 'nuggets',
  ],
  drinks: [
    'beer', 'coffee', 'cola', 'coke', 'pepsi', 'sprite', 'fanta', 'drink',
    'juice', 'soda', 'tea', 'water', 'wine', 'kombucha', 'seltzer', 'sparkling',
    'coke zero', 'diet coke', 'coca cola', 'energy drink', 'ginger ale',
    'lemonade', 'cordial', 'smoothie', 'kefir', 'ipa', 'lager',
  ],
  personal_care: [
    'cotton tips', 'cotton buds', 'q tips', 'q-tips', 'qtips', 'buds',
    'shampoo', 'conditioner', 'deodorant', 'razor', 'bandage', 'vitamin',
    'vitamins', 'lotion', 'sanitizer', 'toothpaste', 'toothbrush', 'sunscreen',
    'soap bar', 'body wash', 'moisturizer', 'moisturiser', 'tampon', 'tampons',
    'pads', 'floss', 'mouthwash', 'face wash', 'lip balm', 'paracetamol',
    'ibuprofen', 'panadol', 'nurofen',
  ],
  household: [
    'bag', 'bags', 'bleach', 'cleaner', 'detergent', 'diapers', 'nappies',
    'foil', 'cling wrap', 'glad wrap', 'garbage', 'napkin', 'napkins',
    'paper towel', 'paper towels', 'sponge', 'tissue', 'tissues', 'toilet',
    'toilet paper', 'towel', 'trash', 'laundry', 'dish soap', 'dishwashing',
    'bin bags', 'ziplock', 'baking paper', 'parchment',
  ],
  other: [],
}

function normalizeForMatch(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/'/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
}

function keywordMatches(normalized: string, keyword: string): boolean {
  if (normalized === keyword) return true
  if (normalized.startsWith(`${keyword} `)) return true
  if (normalized.endsWith(` ${keyword}`)) return true
  if (normalized.includes(` ${keyword} `)) return true
  return false
}

/** Prefer the longest matching keyword so "peanut butter" beats "butter". */
function matchKeywords(normalized: string): CategoryId | null {
  let best: { categoryId: CategoryId; length: number } | null = null

  for (const [categoryId, keywords] of Object.entries(KEYWORD_MAP) as [
    CategoryId,
    string[],
  ][]) {
    if (categoryId === 'other') continue
    for (const keyword of keywords) {
      if (!keywordMatches(normalized, keyword)) continue
      if (!best || keyword.length > best.length) {
        best = { categoryId, length: keyword.length }
      }
    }
  }

  if (best) return best.categoryId

  const words = normalized.split(/\s+/)
  for (const word of words) {
    const stem = word.endsWith('ies')
      ? `${word.slice(0, -3)}y`
      : word.endsWith('es') && word.length > 4
        ? word.slice(0, -2)
        : word.endsWith('s') && word.length > 3
          ? word.slice(0, -1)
          : word

    for (const [categoryId, keywords] of Object.entries(KEYWORD_MAP) as [
      CategoryId,
      string[],
    ][]) {
      if (categoryId === 'other') continue
      if (keywords.includes(word) || keywords.includes(stem)) {
        return categoryId
      }
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
