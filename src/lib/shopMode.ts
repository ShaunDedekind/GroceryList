function storageKey(listId: string): string {
  return `grocery:shop-mode:${listId}`
}

export function getShopMode(listId: string): boolean {
  try {
    return localStorage.getItem(storageKey(listId)) === '1'
  } catch {
    return false
  }
}

export function setShopMode(listId: string, enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(storageKey(listId), '1')
    } else {
      localStorage.removeItem(storageKey(listId))
    }
  } catch {
    // ignore storage errors
  }
}
