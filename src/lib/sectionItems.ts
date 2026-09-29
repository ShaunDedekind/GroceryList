import type { ListSection } from '../types'

export function shouldDeleteOnClearChecked(section: ListSection): boolean {
  return section === 'grocery'
}

export function normalizeItemSection(section: unknown): ListSection {
  if (section === 'home') return 'home'
  if (section === 'henry') return 'henry'
  return 'grocery'
}

export function inboundEmailAddress(
  listCode: string,
  domain = 'example.invalid',
): string {
  return `henry+${listCode.toUpperCase()}@${domain}`
}
