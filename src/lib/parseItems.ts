import { parseBulkText, type ParsedItem } from './parseBulkText'

const RECIPE_CUES =
  /\b(ingredients?|tbsp|tsp|cup|cups|preheat|tablespoon|teaspoon|ounces?|grams?)\b/i

export function parseLocally(text: string, listId: string): ParsedItem[] {
  return parseBulkText(text, listId)
}

export function needsSmartParse(
  text: string,
  localResult: ParsedItem[],
): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  if (trimmed.length > 200) return true
  if (RECIPE_CUES.test(trimmed)) return true

  const nonEmptyLines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length

  if (nonEmptyLines >= 3 && localResult.length === 0) return true

  return false
}

export type { ParsedItem }
