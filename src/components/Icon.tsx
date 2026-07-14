import type { SVGProps, ReactNode } from 'react'

export type IconName =
  | 'cart'
  | 'cartFilled'
  | 'home'
  | 'homeFilled'
  | 'settings'
  | 'back'
  | 'add'
  | 'check'
  | 'close'
  | 'chevronDown'
  | 'paste'
  | 'share'
  | 'shop'
  | 'reorder'
  | 'more'
  | 'list'
  | 'checklist'

const STROKE = 1.75

type IconProps = {
  name: IconName
  size?: 'sm' | 'md' | 'lg'
  className?: string
} & Pick<SVGProps<SVGSVGElement>, 'aria-hidden' | 'aria-label'>

const sizes = { sm: 16, md: 20, lg: 24 } as const

function strokeProps(fill?: string) {
  return {
    fill: fill ?? 'none',
    stroke: 'currentColor',
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
}

const icons: Record<IconName, ReactNode> = {
  cart: (
    <>
      <path d="M6 7h14l-1.5 9H7.5L6 7z" {...strokeProps()} />
      <path d="M9 7V5a3 3 0 016 0v2" {...strokeProps()} />
      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  cartFilled: (
    <>
      <path d="M6 7h14l-1.5 9H7.5L6 7z" fill="currentColor" stroke="none" />
      <path d="M9 7V5a3 3 0 016 0v2" {...strokeProps()} />
      <circle cx="9" cy="19" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  home: (
    <>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" {...strokeProps()} />
    </>
  ),
  homeFilled: (
    <path
      d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
      fill="currentColor"
      stroke="none"
    />
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" {...strokeProps()} />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        {...strokeProps()}
      />
    </>
  ),
  back: <path d="M14 6l-6 6 6 6" {...strokeProps()} />,
  add: <path d="M12 6v12M6 12h12" {...strokeProps()} />,
  check: <path d="M5 12l4 4 9-9" {...strokeProps()} />,
  close: <path d="M7 7l10 10M17 7L7 17" {...strokeProps()} />,
  chevronDown: <path d="M6 9l6 6 6-6" {...strokeProps()} />,
  paste: (
    <>
      <rect x="8" y="4" width="12" height="14" rx="2" {...strokeProps()} />
      <path d="M6 8H5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-1" {...strokeProps()} />
    </>
  ),
  share: (
    <>
      <circle cx="17" cy="5" r="2.5" {...strokeProps()} />
      <circle cx="7" cy="12" r="2.5" {...strokeProps()} />
      <circle cx="17" cy="19" r="2.5" {...strokeProps()} />
      <path d="M9.2 10.7l5.6-3.2M9.2 13.3l5.6 3.2" {...strokeProps()} />
    </>
  ),
  shop: (
    <>
      <path d="M6 8h14l-1.5 9H7.5L6 8z" {...strokeProps()} />
      <path d="M9 8V6a3 3 0 016 0v2" {...strokeProps()} />
    </>
  ),
  reorder: (
    <>
      <circle cx="7" cy="6" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="6" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="7" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="7" cy="18" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="17" cy="18" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" {...strokeProps()} />
      <circle cx="5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  checklist: (
    <>
      <path d="M9 6l2 2 5-5" {...strokeProps()} />
      <path d="M8 14h10M8 18h10" {...strokeProps()} />
      <circle cx="5" cy="7" r="0.5" fill="currentColor" stroke="none" />
    </>
  ),
}

export function Icon({ name, size = 'md', className = '', ...props }: IconProps) {
  const px = sizes[size]
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      aria-hidden={props['aria-hidden'] ?? true}
      aria-label={props['aria-label']}
    >
      {icons[name]}
    </svg>
  )
}

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-sage/10 text-sage dark:bg-sage/20 dark:text-sage-light ${className}`}
      aria-hidden="true"
    >
      <Icon name="cartFilled" size="lg" />
    </div>
  )
}
