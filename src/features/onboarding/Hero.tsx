import { useEffect, useState } from 'react'
import { Mannequin } from '@/anim/Mannequin'
import { reducedMotion } from '@/app/prefs'
import { usePalette } from '@/app/theme'
import { getExercise, highlightFor, motionFor } from '@/data/exercises'
import { cx } from '@/ui/cx'

const SHOWCASE = ['bodyweight-squat', 'pushup', 'reverse-lunge', 'jumping-jacks', 'glute-bridge', 'mountain-climbers', 'db-bent-row', 'side-plank']

const BUBBLES = [
  { text: '🔥 Streaks', className: 'left-1 top-6', delay: '0s' },
  { text: '🎮 Games', className: 'right-1 top-3', delay: '0.6s' },
  { text: '🏆 Badges', className: 'left-3 bottom-10', delay: '1.2s' },
  { text: '🗣️ Voice coach', className: 'right-0 bottom-14', delay: '1.8s' },
]

/** Welcome-screen hero: the coach mannequin cycling through moves, with feature bubbles. */
export function Hero() {
  const palette = usePalette()
  const [i, setI] = useState(0)
  useEffect(() => {
    if (reducedMotion()) return
    const id = window.setInterval(() => setI((x) => (x + 1) % SHOWCASE.length), 3400)
    return () => window.clearInterval(id)
  }, [])
  const ex = getExercise(SHOWCASE[i]) ?? getExercise('bodyweight-squat')!
  return (
    <div className="relative mx-auto mt-2 h-60 w-full max-w-sm">
      <div aria-hidden className="absolute inset-x-6 top-6 bottom-2 rounded-full bg-ember/25 blur-3xl" />
      <div key={ex.id} className="absolute inset-x-8 top-4 bottom-8 animate-fade-in">
        <Mannequin motion={motionFor(ex)} palette={palette} pulse={highlightFor(ex).primary} className="h-full w-full" title={`${ex.name} demonstration`} />
      </div>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span key={ex.id} className="inline-block animate-fade-up rounded-full bg-surface-2/90 px-3 py-1 text-xs font-semibold text-muted backdrop-blur">
          {ex.name}
        </span>
      </div>
      {BUBBLES.map((b) => (
        <span
          key={b.text}
          aria-hidden
          className={cx('absolute animate-bob rounded-full border border-line bg-surface/90 px-2.5 py-1 text-xs font-semibold shadow-lg backdrop-blur', b.className)}
          style={{ animationDelay: b.delay }}
        >
          {b.text}
        </span>
      ))}
    </div>
  )
}
