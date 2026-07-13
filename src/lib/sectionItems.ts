import type { ListSection } from '../types'

export function shouldDeleteOnClearChecked(section: ListSection): boolean {
  return section === 'grocery'
}

export function normalizeItemSection(section: unknown): ListSection {
  return section === 'home' ? 'home' : 'grocery'
}
