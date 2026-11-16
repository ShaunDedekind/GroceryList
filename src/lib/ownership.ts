import type { ItemOwner } from '../types'

export function inferOwnerFromName(name: string | null | undefined): ItemOwner {
  const n = (name ?? '').trim().toLowerCase()
  if (!n) return 'shared'
  if (/(^|\s)(shaun|shawn)(\s|$)/.test(n)) return 'shaun'
  if (/(^|\s)(rosie|rose)(\s|$)/.test(n)) return 'rosie'
  return 'shared'
}

export function ownerLabel(owner: ItemOwner): string {
  if (owner === 'shaun') return 'Shaun'
  if (owner === 'rosie') return 'Rosie'
  return 'Shared'
}

export function ownerMarker(owner: ItemOwner): string {
  if (owner === 'shaun') return 'S'
  if (owner === 'rosie') return 'R'
  return 'SR'
}

export function normalizeOwner(value: unknown): ItemOwner {
  if (value === 'shaun' || value === 'rosie' || value === 'shared') return value
  return 'shared'
}
