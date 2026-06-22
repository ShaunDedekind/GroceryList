import type { CategoryId } from '../types'
import { guessCategoryOrDefault } from './categoryGuess'
import { parseItemText } from './parseItemText'

export interface ParsedItem {
  text: string
  category: CategoryId
  source: 'local' | 'ai'
}

const SECTION_HEADER =
  /^(ingredients?|shopping\s*list|grocery\s*list|items?|to\s*buy)\s*:?\s*$/i

function splitSegments(input: string): string[] {
  const lines = input.split(/\r?\n/)
  const segments: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || SECTION_HEADER.test(trimmed)) continue

    const parts = trimmed.split(/[,;]+/)
    for (const part of parts) {
      const segment = part.trim()
      if (segment) segments.push(segment)
    }
  }

  return segments
}

export function parseBulkText(input: string, listId: string): ParsedItem[] {
  const segments = splitSegments(input)
  const seen = new Set<string>()
  const items: ParsedItem[] = []

  for (const segment of segments) {
    const { text } = parseItemText(segment)
    if (!text) continue

    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    items.push({
      text,
      category: guessCategoryOrDefault(text, listId),
      source: 'local',
    })
  }

  return items
}
