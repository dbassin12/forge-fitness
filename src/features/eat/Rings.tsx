import { cx } from '@/ui/cx'

/** Calorie ring: eaten vs target, with "left" in the middle. */
export function CalorieRing({ eaten, target, className }: { eaten: number; target: number; className?: string }) {
  const R = 52
  const C = 2 * Math.PI * R
  const pct = target > 0 ? eaten / target : 0
  const over = pct > 1
  const left = Math.round(target - eaten)
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
          strokeDasharray={`${Math.min(1, pct) * C} ${C}`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className={cx('font-display text-3xl font-bold tabular', over && 'text-bad')}>{Math.abs(left).toLocaleString()}</div>
          <div className="text-xs text-muted">{over ? 'kcal over' : 'kcal left'}</div>
        </div>
      </div>
    </div>
  )
}

export function MacroBar({ label, value, target, unit = 'g', tone }: { label: string; value: number; target: number; unit?: string; tone: string }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted tabular">
          {Math.round(value)}
          <span className="text-faint">
            /{Math.round(target)}
            {unit}
          </span>
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct * 100}%`, background: tone }} />
      </div>
    </div>
  )
}
