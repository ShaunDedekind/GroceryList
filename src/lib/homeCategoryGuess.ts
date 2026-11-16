import type { HomeCategoryId } from '../types'
import { DEFAULT_HOME_CATEGORY, normalizeHomeCategoryId } from '../constants/homeCategories'
import { getHomeOverride } from './homeCategoryOverrides'
import { getRecentHomeItems } from './recentItems'

const KEYWORD_MAP: Partial<Record<HomeCategoryId, string[]>> = {
  maintenance: [
    'fix', 'repair', 'broken', 'leak', 'tap', 'faucet', 'plumber', 'electric',
    'wiring', 'light', 'bulb', 'door', 'window', 'hinge', 'paint touch',
    'drill', 'screw', 'shelf', 'mount', 'install', 'replace filter', 'hvac',
    'heater', 'smoke alarm', 'battery', 'gutters', 'heat pump',
  ],
  cleaning: [
    'clean', 'vacuum', 'mop', 'dust', 'wipe', 'scrub', 'wash windows',
    'deep clean', 'declutter', 'organize', 'tidy', 'laundry', 'iron',
    'dishwasher', 'bins', 'rubbish', 'recycle',
  ],
  supplies: [
    'buy', 'need', 'stock', 'refill', 'replace', 'batteries', 'bulbs',
    'toilet paper', 'paper towels', 'soap', 'detergent', 'sponges', 'bags',
    'storage', 'containers', 'hooks', 'tape', 'glue',
  ],
  purchases: [
    'project', 'renovate', 'reno', 'build', 'diy', 'deck', 'fence', 'shed',
    'garden bed', 'landscape', 'furniture', 'assemble', 'ikea', 'room',
    'bedroom', 'bathroom remodel', 'kitchen remodel', 'lamp', 'entertainment unit',
    'purchase', 'buy new',
  ],
  bills: [
    'bill', 'power', 'electricity', 'gas', 'water', 'rates', 'insurance',
    'internet', 'phone', 'due', 'invoice', 'payment', 'utilities',
  ],
  admin: [
    'call', 'phone', 'appointment', 'booking', 'renew', 'licence', 'license',
    'passport', 'council', 'bank', 'tax', 'ird', 'admin',
  ],
  garden: [
    'garden', 'lawn', 'mow', 'weed', 'plant', 'plants', 'water', 'hose',
    'compost', 'mulch', 'prune', 'hedge', 'sprinkler', 'outdoor', 'patio',
    'bbq', 'grill',
  ],
  kids: [
    'kids', 'child', 'children', 'school', 'homework', 'toy', 'toys',
    'bedroom', 'nursery', 'baby', 'cot', 'stroller', 'car seat',
  ],
  pets: [
    'pet', 'pets', 'dog', 'cat', 'vet', 'food bowl', 'litter', 'walk',
    'groom', 'flea', 'treats', 'kennel', 'aquarium',
  ],
  other: [],
}

function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  let score = 0
  for (const keyword of keywords) {
    if (lower.includes(keyword)) score++
  }
  return score
}

export function guessHomeCategory(
  text: string,
  listId: string,
): HomeCategoryId | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const override = getHomeOverride(listId, trimmed)
  if (override) return normalizeHomeCategoryId(override)

  const recent = getRecentHomeItems(listId).find(
    (entry) => entry.text.toLowerCase() === trimmed.toLowerCase(),
  )
  if (recent) return normalizeHomeCategoryId(recent.category)

  let best: HomeCategoryId = DEFAULT_HOME_CATEGORY
  let bestScore = 0
  for (const [id, keywords] of Object.entries(KEYWORD_MAP) as [
    HomeCategoryId,
    string[],
  ][]) {
    const score = scoreKeywords(trimmed, keywords ?? [])
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }

  return bestScore > 0 ? best : null
}
