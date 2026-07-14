import { useEffect, type ReactNode } from 'react'
import { useVisualViewport } from '../hooks/useVisualViewport'

interface ViewportProviderProps {
  children: ReactNode
}

export function ViewportProvider({ children }: ViewportProviderProps) {
  const { height, offsetTop, offsetLeft, offsetBottom } = useVisualViewport()

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--vv-height', `${height}px`)
    root.style.setProperty('--vv-offset-top', `${offsetTop}px`)
    root.style.setProperty('--vv-offset-left', `${offsetLeft}px`)
    root.style.setProperty('--vv-offset-bottom', `${offsetBottom}px`)

    return () => {
      root.style.removeProperty('--vv-height')
      root.style.removeProperty('--vv-offset-top')
      root.style.removeProperty('--vv-offset-left')
      root.style.removeProperty('--vv-offset-bottom')
    }
  }, [height, offsetTop, offsetLeft, offsetBottom])

  return children
}
