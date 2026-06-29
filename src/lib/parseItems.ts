import { parseBulkText, normalizeParsedItems, type ParsedItem } from './parseBulkText'

const PROSE_CUES =
  /\b(preheat|instructions?|directions?|method|serves|servings|minutes?\s+(?:until|or)|degrees?\s+f|°f|°c)\b/i

export function parseLocally(text: string, listId: string): ParsedItem[] {
  return parseBulkText(text, listId)
}

export function needsSmartParse(
  text: string,
  localResult: ParsedItem[],
): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  if (localResult.length > 0) {
    return false
  }

  if (PROSE_CUES.test(trimmed)) return true

  const nonEmptyLines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length

  if (nonEmptyLines >= 5 && localResult.length === 0) return true

  return trimmed.length > 400 && localResult.length === 0
}

export { normalizeParsedItems }
export type { ParsedItem }
