import { useEffect, useState } from 'react'
import { CountUp } from '@/ui/CountUp'
import { cx } from '@/ui/cx'

/** 0 on the first frame, then the real value, so rings and bars sweep in when a page opens. */
function useSweep(value: number): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setV(value))
    return () => cancelAnimationFrame(id)
  }, [value])
  return v
}

/** Calorie ring: eaten vs target, with "left" in the middle. */
export function CalorieRing({ eaten, target, className }: { eaten: number; target: number; className?: string }) {
  const R = 52
  const C = 2 * Math.PI * R
  const pct = target > 0 ? eaten / target : 0
  const over = pct > 1
  const left = Math.round(target - eaten)
  const shown = useSweep(Math.min(1, pct))
  return (
    <div className={cx('relative grid place-items-center', className)}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-3)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={over ? 'var(--color-bad)' : 'var(--color-ember)'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${shown * C} ${C}`}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <CountUp value={Math.abs(left)} from={Math.abs(Math.round(target))} className={cx('block font-display text-3xl font-bold tabular', over && 'text-bad')} />
          <div className="text-xs text-muted">{over ? 'kcal over' : 'kcal left'}</div>
        </div>
      </div>
    </div>
  )
}

export function MacroBar({ label, value, target, unit = 'g', tone }: { label: string; value: number; target: number; unit?: string; tone: string }) {
  const pct = useSweep(target > 0 ? Math.min(1, value / target) : 0)
  const done = target > 0 && value >= target
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">
          {label}
          {done ? <span className="ml-1 inline-block animate-bounce-in">✓</span> : null}
        </span>
        <span className="text-muted tabular">
          <CountUp value={Math.round(value)} />
          <span className="text-faint">
            /{Math.round(target)}
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: tone, transition: 'width 900ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
      </div>
    </div>
  )
}
