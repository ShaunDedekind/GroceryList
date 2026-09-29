import { useEffect, useState, type RefObject } from 'react'

export function useCompactTitle(
  scrollRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLElement | null>,
) {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const height = titleRef.current?.offsetHeight ?? 72
      setCompact(el.scrollTop > Math.max(12, height - 8))
    }

    el.addEventListener('scroll', update, { passive: true })
    return () => el.removeEventListener('scroll', update)
  }, [scrollRef, titleRef])

  return compact
}

export function listCountLabel(
  count: number,
  kind: 'left' | 'todo',
  zeroLabel: string,
  loading: boolean,
): string {
  if (loading) return ''
  if (count === 0) return zeroLabel
  return kind === 'left' ? `${count} left` : `${count} to do`
}
