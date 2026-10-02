import { Minus, Plus } from 'lucide-react'
import { cx } from './cx'

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit,
  label,
  size = 'md',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  label?: string
  size?: 'md' | 'lg'
}) {
  const decimals = step < 1 ? (String(step).split('.')[1]?.length ?? 0) : 0
  const set = (v: number) => onChange(Number(Math.min(max, Math.max(min, Math.round(v / step) * step)).toFixed(decimals)))
  const btn = cx(
    'grid shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-ink active:scale-95 disabled:opacity-30',
    size === 'lg' ? 'h-14 w-14' : 'h-10 w-10',
  )
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button type="button" className={btn} aria-label={`Decrease ${label ?? ''}`} onClick={() => set(value - step)} disabled={value <= min}>
        <Minus size={size === 'lg' ? 24 : 18} />
      </button>
      <div className={cx('min-w-[4.5rem] text-center font-display font-bold tabular', size === 'lg' ? 'text-5xl' : 'text-2xl')} aria-live="polite">
        {Number(Number(value).toFixed(decimals)).toString()}
        {unit ? <span className="ml-1 text-base font-medium text-muted">{unit}</span> : null}
      </div>
      <button type="button" className={btn} aria-label={`Increase ${label ?? ''}`} onClick={() => set(value + step)} disabled={value >= max}>
        <Plus size={size === 'lg' ? 24 : 18} />
      </button>
    </div>
  )
}
