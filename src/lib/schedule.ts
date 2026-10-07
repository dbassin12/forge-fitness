/** Keep existing training days when changing the count (drop the last / add a spread day). */
export function spreadDays(n: number, current: number[]): number[] {
  const sorted = [...current].sort()
  if (n <= sorted.length) return sorted.slice(0, n)
  const out = new Set(sorted)
  for (const d of [1, 3, 5, 2, 4, 6, 7]) {
    if (out.size >= n) break
    out.add(d)
  }
  return [...out].sort()
}
