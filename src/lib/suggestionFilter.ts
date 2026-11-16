export function normalizeSuggestionText(text: string): string {
  return text.trim().toLowerCase()
}

export function uncheckedTextKeys(
  items: ReadonlyArray<{ text: string; checked: boolean }>,
): Set<string> {
  const keys = new Set<string>()
  for (const item of items) {
    if (item.checked) continue
    const key = normalizeSuggestionText(item.text)
    if (key) keys.add(key)
  }
  return keys
}

export function filterSuggestionsNotLive<T extends { text: string }>(
  suggestions: readonly T[],
  liveKeys: ReadonlySet<string>,
): T[] {
  return suggestions.filter(
    (entry) => !liveKeys.has(normalizeSuggestionText(entry.text)),
  )
}

/** Prefix matches first, then contains; excludes live texts; caps results. */
export function rankSuggestionHints<T extends { text: string }>(
  suggestions: readonly T[],
  query: string,
  liveKeys: ReadonlySet<string>,
  limit = 5,
): T[] {
  const normalizedQuery = normalizeSuggestionText(query)
  if (normalizedQuery.length < 2) return []

  const available = filterSuggestionsNotLive(suggestions, liveKeys)
  const prefix: T[] = []
  const contains: T[] = []
  const seen = new Set<string>()

  for (const entry of available) {
    const key = normalizeSuggestionText(entry.text)
    if (!key || seen.has(key)) continue
    if (key.startsWith(normalizedQuery)) {
      seen.add(key)
      prefix.push(entry)
    } else if (key.includes(normalizedQuery)) {
      seen.add(key)
      contains.push(entry)
    }
  }

  return [...prefix, ...contains].slice(0, limit)
}

export function isLiveSuggestionText(
  text: string,
  liveKeys: ReadonlySet<string>,
): boolean {
  const key = normalizeSuggestionText(text)
  return Boolean(key) && liveKeys.has(key)
}
