import type { ChangeEvent, InputHTMLAttributes } from 'react'

interface HapticSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  role?: 'tab'
  selected?: boolean
}

const switchAttr = { switch: '' } as InputHTMLAttributes<HTMLInputElement>

export function HapticSwitch({
  checked,
  onChange,
  label,
  role,
  selected,
}: HapticSwitchProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      role={role}
      aria-selected={role === 'tab' ? selected : undefined}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.checked)
      }}
      className="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
      {...switchAttr}
    />
  )
}
