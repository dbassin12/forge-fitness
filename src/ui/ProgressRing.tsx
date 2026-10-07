import { useEffect, useState, type ReactNode } from 'react'
import { cx } from './cx'

/** Circular progress (0..1) that sweeps in when it first appears. */
export function ProgressRing({
  progress,
  size = 56,
  stroke = 6,
  color = 'var(--color-ember)',
  track = 'var(--color-surface-3)',
  className,
  children,
  label,
}: {
  progress: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  className?: string
  children?: ReactNode
  label?: string
}) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(1, progress))))
    return () => cancelAnimationFrame(id)
  }, [progress])
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={cx('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${shown * c} ${c}`}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}
