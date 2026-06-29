import type { CategoryId } from '../types'
import { guessCategoryOrDefault } from './categoryGuess'
import { normalizeIngredientName } from './parseItemText'

export interface ParsedItem {
  text: string
  category: CategoryId
  source: 'local' | 'ai'
}

const SECTION_HEADER =
  /^(ingredients?|shopping\s*list|grocery\s*list|items?|to\s*buy)\s*:?\s*$/i

const RECIPE_CUES =
  /\b(ingredients?|tbsp|tsp|cup|cups|tablespoon|teaspoon|ounces?|grams?|preheat)\b/i

const INSTRUCTION_LINE =
  /^(preheat|bake|roast|grill|simmer|boil|stir|cook|heat|mix|combine|whisk|blend|fold|serve|let\s+stand|cover|uncover|remove|transfer|place|set\s+aside|meanwhile|until|for\s+\d+\s*(?:min|minutes|hour|hrs?)|step\s+\d+)/i

const UNIT_CUES =
  /\b(\d+\s*(?:\/\d+)?|\d+\.\d+|\d+\s*x\s+)\s*(?:cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|clove|can|package|tablespoon|teaspoon|ounce|pound|gram)\b/i

function isRecipeInput(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.some((line) => SECTION_HEADER.test(line))) return true
  if (lines.length >= 3 && RECIPE_CUES.test(trimmed)) return true
  if (lines.filter((line) => UNIT_CUES.test(line)).length >= 2) return true

  return false
}

function splitConjunctive(text: string): string[] {
  const normalized = text.trim()
  if (!normalized) return []

  const conjunctive = normalized.match(/^(.+?)\s+and\s+(.+)$/i)
  if (!conjunctive) return [normalized]

  const left = conjunctive[1].trim()
  const right = conjunctive[2].trim()

  if (left.split(/\s+/).length > 3 || right.split(/\s+/).length > 3) {
    return [normalized]
  }

  return [left, right]
}

function splitSegments(input: string): string[] {
  const recipeMode = isRecipeInput(input)
  const lines = input.split(/\r?\n/)
  const segments: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || SECTION_HEADER.test(trimmed)) continue
    if (recipeMode && INSTRUCTION_LINE.test(trimmed)) continue

    if (recipeMode) {
      segments.push(trimmed)
      continue
    }

    const parts = trimmed.split(/[,;]+/)
    for (const part of parts) {
      const segment = part.trim()
      if (segment) segments.push(segment)
    }
  }

  return segments
}

function addParsedItem(
  items: ParsedItem[],
  seen: Set<string>,
  text: string,
  listId: string,
): void {
  const normalized = normalizeIngredientName(text)
  if (!normalized) return

  const key = normalized.toLowerCase()
  if (seen.has(key)) return
  seen.add(key)

  items.push({
    text: normalized,
    category: guessCategoryOrDefault(normalized, listId),
    source: 'local',
  })
}

export function parseBulkText(input: string, listId: string): ParsedItem[] {
  const segments = splitSegments(input)
  const seen = new Set<string>()
  const items: ParsedItem[] = []
  const recipeMode = isRecipeInput(input)

  for (const segment of segments) {
    const parts = recipeMode ? splitConjunctive(segment) : [segment]
    for (const part of parts) {
      addParsedItem(items, seen, part, listId)
    }
  }

  return items
}

export function normalizeParsedItems(
  items: { text: string; category: CategoryId; source?: 'local' | 'ai' }[],
): ParsedItem[] {
  const seen = new Set<string>()
  const result: ParsedItem[] = []

  for (const item of items) {
    const text = normalizeIngredientName(item.text)
    if (!text) continue

    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    result.push({
      text,
      category: item.category,
      source: item.source ?? 'ai',
    })
  }

  return result
}
