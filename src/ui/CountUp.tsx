import { useEffect, useRef, useState } from 'react'
import { reducedMotion } from '@/app/prefs'

const ease = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * A number that counts to its new value instead of jumping. Starts from `from` on first render
 * (0 by default) so dashboards feel alive when they open.
 */
export function useCountUp(value: number, { from = 0, duration = 700 }: { from?: number; duration?: number } = {}): number {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : from))
  const current = useRef(shown)
  useEffect(() => {
    const start = current.current
    if (start === value || reducedMotion()) {
      current.current = value
      setShown(value)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const stepFn = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const v = start + (value - start) * ease(t)
      current.current = v
      setShown(v)
      if (t < 1) raf = requestAnimationFrame(stepFn)
    }
    raf = requestAnimationFrame(stepFn)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return shown
}

export function CountUp({
  value,
  from,
  duration,
  decimals = 0,
  format,
  className,
}: {
  value: number
  from?: number
  duration?: number
  decimals?: number
  format?: (n: number) => string
  className?: string
}) {
  const v = useCountUp(value, { from, duration })
  const rounded = decimals ? Number(v.toFixed(decimals)) : Math.round(v)
  return <span className={className}>{format ? format(rounded) : rounded.toLocaleString()}</span>
}
