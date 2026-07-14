import { useEffect, useState } from 'react'

export interface VisualViewportState {
  height: number
  width: number
  offsetTop: number
  offsetLeft: number
  offsetBottom: number
}

const KEYBOARD_CLOSED_HEIGHT_RATIO = 0.92

function readVisualViewport(): VisualViewportState {
  const innerHeight = window.innerHeight
  const innerWidth = window.innerWidth
  const vv = window.visualViewport

  if (!vv) {
    return {
      height: innerHeight,
      width: innerWidth,
      offsetTop: 0,
      offsetLeft: 0,
      offsetBottom: 0,
    }
  }

  let offsetTop = vv.offsetTop
  const height = vv.height
  const offsetLeft = vv.offsetLeft

  // iOS 26 bug: offsetTop does not reset after keyboard dismiss
  const keyboardLikelyClosed = height >= innerHeight * KEYBOARD_CLOSED_HEIGHT_RATIO
  if (keyboardLikelyClosed && offsetTop > 0) {
    offsetTop = 0
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })
  }

  const offsetBottom = Math.max(0, innerHeight - height - offsetTop)

  return {
    height,
    width: vv.width,
    offsetTop,
    offsetLeft,
    offsetBottom,
  }
}

const SSR_FALLBACK: VisualViewportState = {
  height: 0,
  width: 0,
  offsetTop: 0,
  offsetLeft: 0,
  offsetBottom: 0,
}

export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() =>
    typeof window !== 'undefined' ? readVisualViewport() : SSR_FALLBACK,
  )

  useEffect(() => {
    const update = () => setState(readVisualViewport())
    const vv = window.visualViewport

    if (vv) {
      vv.addEventListener('resize', update)
      vv.addEventListener('scroll', update)
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    update()

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update)
        vv.removeEventListener('scroll', update)
      }
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return state
}
