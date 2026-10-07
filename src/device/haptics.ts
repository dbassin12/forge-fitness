import { usePrefs } from '@/app/prefs'

/** Haptic feedback where supported (Android). iOS web apps have no vibration API. */
export function vibrate(pattern: number | number[]): void {
  if (!usePrefs.getState().haptics) return
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern)
  } catch {
    /* ignore */
  }
}

const PATTERNS = {
  /** A tap on a tab or a toggle. */
  light: 8,
  /** A button that does something real (log water, start). */
  medium: 18,
  /** A win: set done, quest complete. */
  success: [20, 40, 30],
  /** A big win: level up, personal best. */
  celebrate: [30, 50, 30, 50, 60],
  warning: [40, 60, 40],
} as const

export function haptic(kind: keyof typeof PATTERNS): void {
  const p = PATTERNS[kind]
  vibrate(typeof p === 'number' ? p : [...p])
}
