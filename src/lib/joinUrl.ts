export function getJoinUrl(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}?join=${encodeURIComponent(code.toUpperCase())}`
}

export function parseJoinCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const join = params.get('join')?.trim().toUpperCase()
  return join || null
}

export function clearJoinParamFromUrl(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has('join')) return
  url.searchParams.delete('join')
  window.history.replaceState({}, '', url.pathname + url.search + url.hash)
}
