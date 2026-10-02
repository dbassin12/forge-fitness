/** "Nice" axis ticks (1, 2, 2.5, 5 × 10ⁿ steps) covering [min, max]. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0]
  if (min === max) {
    const pad = Math.abs(min) * 0.05 || 1
    min -= pad
    max += pad
  }
  const raw = (max - min) / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const start = Math.floor(min / step) * step
  const end = Math.ceil(max / step) * step
  const out: number[] = []
  for (let v = start; v <= end + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6)
  return out
}

export function linear(d0: number, d1: number, r0: number, r1: number) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0)
  return (v: number) => r0 + (v - d0) * k
}

/** Compact number for ticks and tiles: 1,284 · 12.9K. */
export function compact(n: number): string {
  const a = Math.abs(n)
  if (a >= 10000) return `${(n / 1000).toFixed(a >= 100000 ? 0 : 1)}K`
  return Math.round(n).toLocaleString()
}

/** Trailing moving average (window in points). */
export function movingAverage(values: number[], window = 7): number[] {
  const out: number[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    out.push(sum / Math.min(i + 1, window))
  }
  return out
}
