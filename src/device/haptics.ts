import { usePrefs } from '@/app/prefs'

const appleTouch = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1))

/**
 * iPhone Safari has no vibration API, but flipping a native switch control gives the system's
 * light "tick" (iOS 18 and later; older versions just stay silent).
 */
function tick(): void {
  const label = document.createElement('label')
  label.setAttribute('aria-hidden', 'true')
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  label.remove()
}

/** Haptic feedback: the vibration API where there is one (Android), switch ticks on iPhone. */
export function vibrate(pattern: number | number[]): void {
  if (!usePrefs.getState().haptics) return
  try {
    // Browsers refuse (and log a warning) before the first tap on the page.
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
    if (ua && !ua.hasBeenActive) return
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern)
    } else if (appleTouch()) {
      // One tick per pulse in the pattern ([on, off, on, …]).
      const pulses = Array.isArray(pattern) ? Math.ceil(pattern.length / 2) : 1
      tick()
      for (let i = 1; i < pulses; i++) setTimeout(tick, i * 110)
    }
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
