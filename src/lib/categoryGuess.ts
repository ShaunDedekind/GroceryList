import type { BuiltinCategoryId, CategoryId } from '../types'
import { DEFAULT_CATEGORY, isBuiltinCategoryId } from '../constants/categories'
import { getOverride } from './categoryOverrides'
import { getRecentItems } from './recentItems'

const PASTA_SHAPES = [
  'pasta',
  'rigatoni',
  'penne',
  'fusilli',
  'spaghetti',
  'spaghettini',
  'macaroni',
  'macaroni cheese',
  'mac and cheese',
  'lasagne',
  'lasagna',
  'ravioli',
  'tortellini',
  'orzo',
  'linguine',
  'fettuccine',
  'tagliatelle',
  'cannelloni',
  'vermicelli',
  'gnocchi',
  'farfalle',
  'conchiglie',
  'orecchiette',
  'paccheri',
  'cavatappi',
  'ziti',
  'bucatini',
  'angel hair',
  'egg noodles',
  'udon',
  'soba',
  'ramen noodles',
]

const BUILTIN_KEYWORD_MAP: Record<BuiltinCategoryId, string[]> = {
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
    'courgette', 'aubergine', 'bok choy', 'pak choi', 'silverbeet', 'swede',
    'parsnip', 'leek', 'leeks', 'beetroot', 'feijoa', 'feijoas', 'mandarin',
    'mandarins', 'nectarine', 'nectarines', 'plum', 'plums', 'raspberry',
    'raspberries', 'blackberry', 'blackberries',
  ],
  snacks: [
    'chips', 'crisps', 'popcorn', 'pretzel', 'pretzels', 'cracker', 'crackers',
    'granola bar', 'snack', 'snacks', 'trail mix', 'jerky', 'nuts mix',
    'muesli bar', 'rice crackers', 'corn chips', 'tortilla chips',
    'rice cakes', 'veggie chips', 'seaweed snacks',
  ],
  sweet_tooth: [
    'candy', 'chocolate', 'chocolates', 'cookie', 'cookies', 'biscuit',
    'biscuits', 'lolly', 'lollies', 'lollipop', 'sweets', 'gummy', 'gummies',
    'marshmallow', 'marshmallows', 'caramel', 'fudge', 'tim tam', 'tim tams',
    'wagon wheel', 'wagon wheels', 'block chocolate', 'chocolate bar',
    'chocolate bars', 'chocolate chips', 'hot chocolate', 'cocoa powder',
    'icing sugar', 'sprinkles', 'dessert', 'desserts', 'pudding', 'jelly crystals',
    'afghan', 'afghans', 'shortbread', 'brownie', 'brownies', 'lamington',
    'lamingtons', 'gingernut', 'gingernuts',
  ],
  meat: [
    'bacon', 'beef', 'chicken', 'cod', 'fish', 'ham', 'lamb', 'mince',
    'pork', 'prawn', 'prawns', 'salmon', 'sausage', 'sausages', 'seafood',
    'shrimp', 'steak', 'tuna', 'turkey', 'thighs', 'breast', 'ground beef',
    'meatballs', 'schnitzel', 'ribs', 'roast', 'fillet', 'chicken breast',
    'chicken thigh', 'chicken thighs', 'drumsticks', 'wings', 'chorizo',
    'venison', 'mussels', 'scallops', 'whitebait',
  ],
  dairy: [
    'butter', 'cheese', 'cream', 'egg', 'eggs', 'milk', 'mozzarella',
    'parmesan', 'yogurt', 'yoghurt', 'halloumi', 'feta', 'cheddar',
    'sour cream', 'cottage cheese', 'cream cheese', 'ricotta', 'brie',
    'camembert', 'margarine', 'oat milk', 'almond milk', 'soy milk',
    'custard', 'creme fraiche', 'crème fraîche', 'greek yoghurt',
    'whipping cream', 'thickened cream', 'truffle butter',
  ],
  deli: [
    'deli', 'hummus', 'rotisserie', 'prepared', 'coleslaw', 'mac and cheese',
    'potato salad', 'sushi', 'sandwich platter', 'antipasto', 'olives',
    'dip', 'guacamole', 'salsa', 'pesto', 'pate', 'pâté', 'salami',
    'prosciutto', 'quiche', 'falafel', 'tzatziki', 'kabana', 'fritz',
  ],
  bakery: [
    'bagel', 'bagels', 'baguette', 'bread', 'bun', 'buns', 'cake', 'croissant',
    'muffin', 'pastry', 'roll', 'rolls', 'toast', 'tortilla', 'tortillas',
    'pita', 'wrap', 'wraps', 'sourdough', 'ciabatta', 'focaccia', 'naan',
    'english muffin', 'donut', 'doughnut', 'brioche', 'crumpet', 'crumpets',
    'hot cross buns', 'fruit loaf', 'garlic bread',
  ],
  pantry: [
    'beans', 'cereal', 'flour', 'honey', 'jam', 'jelly', 'marmalade',
    'noodle', 'noodles', 'nut', 'nuts', 'oil', 'peanut',
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
    'vegemite', 'marmite', 'milo', 'weetbix', 'weet-bix', 'cornflakes',
    'instant coffee', 'tea bags', 'herb salt',
    ...PASTA_SHAPES,
  ],
  frozen: [
    'frozen', 'ice cream', 'icecream', 'pizza', 'popsicle', 'ice block',
    'iceblocks', 'frozen peas', 'frozen berries', 'hash browns', 'nuggets',
    'gelato', 'sorbet', 'frozen veggies', 'frozen vegetables', 'party pies',
    'sausage rolls', 'fish fingers',
  ],
  drinks: [
    'beer', 'coffee', 'cola', 'coke', 'pepsi', 'sprite', 'fanta', 'drink',
    'juice', 'soda', 'tea', 'water', 'wine', 'kombucha', 'seltzer', 'sparkling',
    'coke zero', 'diet coke', 'coca cola', 'energy drink', 'ginger ale',
    'lemonade', 'cordial', 'smoothie', 'kefir', 'ipa', 'lager', 'bundaberg',
    'v energy', 'red bull', 'sparkling water', 'tonic', 'soft drink',
  ],
  personal_care: [
    'cotton tips', 'cotton buds', 'q tips', 'q-tips', 'qtips', 'buds',
    'shampoo', 'conditioner', 'deodorant', 'razor', 'bandage', 'vitamin',
    'vitamins', 'lotion', 'sanitizer', 'toothpaste', 'toothbrush', 'sunscreen',
    'soap bar', 'body wash', 'moisturizer', 'moisturiser', 'tampon', 'tampons',
    'pads', 'floss', 'mouthwash', 'face wash', 'lip balm', 'paracetamol',
    'ibuprofen', 'panadol', 'nurofen', 'hand sanitiser', 'hand sanitizer',
    'plasters', 'band aid', 'bandaids',
  ],
  household: [
    'bag', 'bags', 'bleach', 'cleaner', 'detergent', 'diapers', 'nappies',
    'foil', 'cling wrap', 'glad wrap', 'garbage', 'napkin', 'napkins',
    'paper towel', 'paper towels', 'sponge', 'tissue', 'tissues', 'toilet',
    'toilet paper', 'towel', 'trash', 'laundry', 'dish soap', 'dishwashing',
    'bin bags', 'ziplock', 'baking paper', 'parchment', 'dishwashing liquid',
    'laundry powder', 'fabric softener', 'bin liners', 'aluminium foil',
  ],
  other: [],
}

export interface GuessOptions {
  listId?: string
  /** Extra keywords from custom aisles (and optional overrides). */
  extraKeywords?: Record<string, string[]>
  /** When set, overrides/recents outside this set are ignored. */
  knownIds?: ReadonlySet<string>
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

function buildKeywordEntries(
  extraKeywords?: Record<string, string[]>,
): Array<[CategoryId, string[]]> {
  const entries: Array<[CategoryId, string[]]> = (
    Object.entries(BUILTIN_KEYWORD_MAP) as [BuiltinCategoryId, string[]][]
  ).filter(([id]) => id !== 'other')

  if (extraKeywords) {
    for (const [id, keywords] of Object.entries(extraKeywords)) {
      if (!id || id === 'other' || !keywords?.length) continue
      entries.push([id, keywords.map((keyword) => normalizeForMatch(keyword)).filter(Boolean)])
    }
  }

  return entries
}

/** Prefer the longest matching keyword so "peanut butter" beats "butter". */
function matchKeywords(
  normalized: string,
  extraKeywords?: Record<string, string[]>,
): CategoryId | null {
  let best: { categoryId: CategoryId; length: number } | null = null
  const entries = buildKeywordEntries(extraKeywords)

  for (const [categoryId, keywords] of entries) {
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

    for (const [categoryId, keywords] of entries) {
      if (keywords.includes(word) || keywords.includes(stem)) {
        return categoryId
      }
    }
  }

  return null
}

function normalizeOptions(
  listIdOrOptions?: string | GuessOptions,
): GuessOptions {
  if (typeof listIdOrOptions === 'string') return { listId: listIdOrOptions }
  return listIdOrOptions ?? {}
}

function isKnownCategory(
  id: CategoryId,
  knownIds?: ReadonlySet<string>,
): boolean {
  if (!knownIds) return isBuiltinCategoryId(id) || id.startsWith('custom_')
  return knownIds.has(id)
}

export function guessCategory(
  text: string,
  listIdOrOptions?: string | GuessOptions,
): CategoryId | null {
  const options = normalizeOptions(listIdOrOptions)
  const normalized = normalizeForMatch(text)
  if (!normalized) return null

  if (options.listId) {
    const override = getOverride(options.listId, text)
    if (override && isKnownCategory(override, options.knownIds)) return override

    const recent = getRecentItems(options.listId).find(
      (item) => normalizeForMatch(item.text) === normalized,
    )
    if (recent && isKnownCategory(recent.category, options.knownIds)) {
      return recent.category
    }
  }

  const matched = matchKeywords(normalized, options.extraKeywords)
  if (matched && isKnownCategory(matched, options.knownIds)) return matched
  return matched
}

export function guessCategoryOrDefault(
  text: string,
  listIdOrOptions?: string | GuessOptions,
): CategoryId {
  return guessCategory(text, listIdOrOptions) ?? DEFAULT_CATEGORY
}

export function extraKeywordsFromResolved(
  categories: ReadonlyArray<{ id: string; keywords?: string[] }>,
): Record<string, string[]> {
  const extra: Record<string, string[]> = {}
  for (const category of categories) {
    if (!category.keywords?.length) continue
    if (isBuiltinCategoryId(category.id)) continue
    extra[category.id] = category.keywords
  }
  return extra
}
