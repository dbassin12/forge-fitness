import confetti from 'canvas-confetti'
import { reducedMotion, usePrefs } from './prefs'

function accentColors(): string[] {
  const css = getComputedStyle(document.documentElement)
  const v = (n: string, f: string) => css.getPropertyValue(n).trim() || f
  return [v('--color-ember', '#ff6a3d'), v('--color-amber', '#ffb547'), v('--color-teal', '#2dd4bf'), v('--color-violet', '#a78bfa'), v('--color-ember-2', '#ff8f5e')]
}

/** Confetti in the accent colors, unless the user turned celebrations or motion off. */
export function burst(kind: 'small' | 'big' | 'sides' = 'small'): void {
  if (typeof document === 'undefined' || !usePrefs.getState().celebrations || reducedMotion()) return
  const colors = accentColors()
  if (kind === 'small') {
    void confetti({ particleCount: 70, spread: 70, startVelocity: 38, origin: { y: 0.45 }, colors, scalar: 0.9, disableForReducedMotion: true })
  } else if (kind === 'big') {
    void confetti({ particleCount: 150, spread: 90, startVelocity: 48, origin: { y: 0.4 }, colors, disableForReducedMotion: true })
    window.setTimeout(() => void confetti({ particleCount: 90, spread: 120, startVelocity: 30, origin: { y: 0.3 }, colors, scalar: 0.8, disableForReducedMotion: true }), 250)
  } else {
    const end = Date.now() + 700
    const frame = () => {
      void confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true })
      void confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }
}
