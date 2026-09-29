export interface ParsedItemDisplay {
  title: string
  note: string | null
}

/**
 * Split a trailing dash-separated note for display.
 * e.g. "ms balls - only if on sale" → title + muted note line.
 */
export function parseItemDisplay(text: string): ParsedItemDisplay {
  const trimmed = text.trim()
  if (!trimmed) return { title: '', note: null }

  const match = trimmed.match(/^(.+?)\s+[-–—]\s+(.+)$/)
  if (!match) return { title: trimmed, note: null }

  const title = match[1].trim()
  const note = match[2].trim()
  if (!title || !note) return { title: trimmed, note: null }

  return { title, note }
}
