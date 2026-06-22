export function withViewTransition(update: () => void): void {
  if (typeof document !== 'undefined' && 'startViewTransition' in document) {
    document.startViewTransition(update)
  } else {
    update()
  }
}
