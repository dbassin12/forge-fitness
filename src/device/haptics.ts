/** Haptic feedback where supported (Android). iOS web apps have no vibration API. */
export function vibrate(pattern: number | number[]): void {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}
