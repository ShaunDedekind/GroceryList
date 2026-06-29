const BULLET_PREFIX = /^[-*•]\s+/
const NUMBERED_PREFIX = /^\d+[.)]\s+/

const UNICODE_FRACTIONS = '½⅓⅔¼¾⅛⅜⅝⅞'
const FRACTION = `(?:\\d+\\s+)?\\d+\\/\\d+|[${UNICODE_FRACTIONS}]`
const NUMBER = `(?:${FRACTION}|\\d+(?:\\.\\d+)?(?:\\s*-\\s*\\d+(?:\\.\\d+)?)?)`

const UNITS =
  'teaspoons?|tablespoons?|tbsps?|tsps?|tbsp|tbs|tsp|' +
  'cups?|cup|' +
  'ounces?|oz|fl\\.?\\s*oz|' +
  'pounds?|lbs?|lb|' +
  'grams?|g|kilograms?|kg|' +
  'milliliters?|millilitres?|ml|liters?|litres?|l|' +
  'pints?|pt|quarts?|qt|gallons?|gal|' +
  'pinches?|pinch|dashes?|dash|' +
  'cloves?|clove|heads?|head|bunches?|bunch|' +
  'cans?|can|packages?|package|pkgs?|pkg|jars?|jar|' +
  'slices?|slice|sticks?|stick|stalks?|stalk|' +
  'sprigs?|sprig|fillets?|fillet|pieces?|piece|' +
  'sheets?|sheet|bags?|bag|boxes?|box|' +
  'handfuls?|handful|scoops?|scoops?'

const SIZE_WORDS =
  'extra\\s*large|extra-large|xl|large|medium|med|small|sm|fresh|dried|ripe|organic|boneless|skinless'

const LEADING_QUANTITY_UNIT = new RegExp(
  `^\\s*(?:${NUMBER}\\s*(?:x\\s*)?)?(?:(?:${UNITS})\\s+(?:of\\s+)?)+`,
  'i',
)

const LEADING_SIZE = new RegExp(`^\\s*(?:${SIZE_WORDS})\\s+`, 'i')

const LEADING_BARE_COUNT = new RegExp(`^\\s*${NUMBER}\\s+(?:x\\s*)?`, 'i')

const PREP_TAIL =
  /(?:\s*[,–-]\s*(?:diced|chopped|minced|sliced|grated|shredded|crushed|peeled|seeded|halved|quartered|trimmed|deveined|pitted|cored|mashed|softened|melted|room\s+temperature|at\s+room\s+temperature|thinly|finely|roughly|coarsely|optional|about|approximately|or\s+more|plus\s+more|for\s+serving|for\s+garnish|to\s+taste|as\s+needed|if\s+needed|well\s+beaten|lightly\s+beaten|well\s+shaken)(?:\s+\w+)*)+/gi

const WEIGHT_PAREN = /\s*\([^)]*(?:\d+\s*(?:oz|g|ml|lb|kg|cup|cups?|can|cans?).*?|\d+\s*x\s*\d+.*?)[^)]*\)/gi

const OPTIONAL_PAREN = /\s*\(\s*optional\s*\)/gi

const REMAINING_PAREN = /\s*\([^)]+\)/gi

const TRAILING_TO_TASTE = /\s+(?:,?\s*)?(?:or\s+)?to\s+taste(?:\s+as\s+needed)?/gi

function formatItemName(text: string): string {
  if (/^\d+%/.test(text)) return text
  return text.toLowerCase()
}

function cleanupDisplay(text: string): string {
  return formatItemName(text.replace(/\s+/g, ' ').trim())
}

function stripLeadingQuantityUnit(text: string): string {
  let result = text

  result = result.replace(LEADING_QUANTITY_UNIT, '')
  result = result.replace(LEADING_BARE_COUNT, '')
  result = result.replace(LEADING_SIZE, '')

  return result.trim()
}

function stripPrepTails(text: string): string {
  let result = text
  result = result.replace(WEIGHT_PAREN, '')
  result = result.replace(OPTIONAL_PAREN, '')
  result = result.replace(REMAINING_PAREN, '')
  result = result.replace(TRAILING_TO_TASTE, '')
  result = result.replace(PREP_TAIL, '')
  return result.trim()
}

export function normalizeIngredientName(raw: string): string {
  let text = raw.trim()
  if (!text) return ''

  if (/^\d+%\s/.test(text)) {
    return cleanupDisplay(text)
  }

  text = text.replace(BULLET_PREFIX, '')
  text = text.replace(NUMBERED_PREFIX, '')
  text = text.trim()

  let prev = ''
  let passes = 0
  while (prev !== text && passes < 6) {
    prev = text
    text = stripLeadingQuantityUnit(text)
    passes++
  }

  text = stripPrepTails(text)

  return cleanupDisplay(text)
}

export function parseItemText(raw: string): { text: string } {
  const text = normalizeIngredientName(raw)
  return { text }
}
