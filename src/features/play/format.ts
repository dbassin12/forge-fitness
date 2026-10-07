/** "1:05" for holds (seconds), "42" for rep counts. */
export function formatValue(kind: 'hold' | 'amrap', v: number): string {
  if (kind === 'amrap') return `${Math.round(v)}`
  const s = Math.max(0, Math.round(v))
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
