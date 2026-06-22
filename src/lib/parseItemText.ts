const BULLET_PREFIX = /^[-*•]\s+/
const NUMBERED_PREFIX = /^\d+[.)]\s+/
const QUANTITY_PREFIX =
  /^(\d+\s*x\s+|\d+\s*(?:lb|lbs|oz|g|kg|ml|l|cup|cups|tbsp|tsp)\s+)/i

export function parseItemText(raw: string): { text: string } {
  let text = raw.trim()
  if (!text) return { text: '' }

  // Preserve percentages and similar (e.g. "2% milk")
  if (/^\d+%\s/.test(text)) {
    return { text }
  }

  text = text.replace(BULLET_PREFIX, '')
  text = text.replace(NUMBERED_PREFIX, '')
  text = text.replace(QUANTITY_PREFIX, '')

  return { text: text.trim() }
}
