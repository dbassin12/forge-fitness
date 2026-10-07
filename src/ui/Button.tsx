import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { haptic } from '@/device/haptics'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-ember text-on-accent hover:bg-ember-2 active:scale-[0.98] shadow-[0_8px_24px_-12px_var(--color-ember)]',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 active:scale-[0.98] border border-line',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-surface-2 active:scale-[0.98]',
  danger: 'bg-bad/15 text-bad hover:bg-bad/25 border border-bad/30 active:scale-[0.98]',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-4 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5 font-semibold',
}

export function Button({ variant = 'primary', size = 'md', block, icon, className, children, onClick, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        if (variant === 'primary') haptic('light')
        onClick?.(e)
      }}
      className={cx(
        'inline-flex items-center justify-center whitespace-nowrap font-medium transition duration-150 disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
      {children}
    </button>
  )
}
