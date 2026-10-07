import { useId } from 'react'
import { cx } from './cx'

export type MascotMood = 'happy' | 'fired' | 'cheer' | 'sleepy' | 'calm'
export type MascotGear = 'headband' | 'shades' | 'cap' | 'medal' | 'crown'

/** Gear Ember earns as you level up. */
export const MASCOT_GEAR: { id: MascotGear; name: string; level: number }[] = [
  { id: 'headband', name: 'Sweatband', level: 2 },
  { id: 'shades', name: 'Shades', level: 4 },
  { id: 'cap', name: 'Coach cap', level: 6 },
  { id: 'medal', name: 'Gold medal', level: 8 },
  { id: 'crown', name: 'Crown', level: 10 },
]

function Gear({ gear }: { gear: MascotGear }) {
  switch (gear) {
    case 'headband':
      return (
        <g>
          <path d="M16.5 27 Q32 21 47.5 27 L48.5 31.5 Q32 25.5 15.5 31.5 Z" fill="#f8fafc" />
          <path d="M16 29.2 Q32 23.2 48 29.2" stroke="#ef4444" strokeWidth="1.6" fill="none" />
        </g>
      )
    case 'shades':
      return (
        <g>
          <path d="M19.5 34 h11 v3.5 a4 4 0 0 1 -4 4 h-3 a4 4 0 0 1 -4 -4 z" fill="#111827" />
          <path d="M33.5 34 h11 v3.5 a4 4 0 0 1 -4 4 h-3 a4 4 0 0 1 -4 -4 z" fill="#111827" />
          <path d="M30.5 35 h3" stroke="#111827" strokeWidth="1.8" />
          <path d="M21.5 35.5 l3 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M35.5 35.5 l3 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'cap':
      return (
        <g>
          <path d="M18 24 Q20 11 33 11 Q45 11 46 24 Z" fill="#2563eb" />
          <path d="M44 23.5 Q53 23 56 26.5 Q49 27.5 43 26 Z" fill="#1d4ed8" />
          <circle cx="32" cy="11.5" r="1.8" fill="#1e3a8a" />
          <path d="M26 18 h12" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )
    case 'medal':
      return (
        <g>
          <path d="M27 47 l5 8 5 -8" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <circle cx="32" cy="58" r="5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
          <path d="M32 55.2 l0.9 1.9 2 .3 -1.5 1.4 .4 2 -1.8 -1 -1.8 1 .4 -2 -1.5 -1.4 2 -.3z" fill="#fff7d6" />
        </g>
      )
    case 'crown':
      return (
        <g>
          <path d="M20 14 l4 8 8 -10 8 10 4 -8 -2 14 h-20 z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="32" cy="19" r="1.6" fill="#ef4444" />
          <circle cx="25.5" cy="23" r="1.2" fill="#38bdf8" />
          <circle cx="38.5" cy="23" r="1.2" fill="#38bdf8" />
        </g>
      )
  }
}

/**
 * Ember, Forge's little flame mascot. Pure SVG + CSS: it bobs, flickers and blinks, and its face
 * follows your day (fired up after a workout, cheering on a perfect day, sleepy late at night).
 */
export function Mascot({ mood = 'happy', size = 56, className, gear }: { mood?: MascotMood; size?: number; className?: string; gear?: MascotGear | null }) {
  const id = useId().replace(/:/g, '')
  const sleepy = mood === 'sleepy'
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cx('shrink-0 overflow-visible', !sleepy && 'animate-bob', className)} role="img" aria-label={`Ember the mascot, ${mood}`}>
      <defs>
        <linearGradient id={`m-body-${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--color-ember)" />
          <stop offset="1" stopColor="var(--color-amber)" />
        </linearGradient>
        <radialGradient id={`m-glow-${id}`} cx="0.5" cy="0.7" r="0.5">
          <stop offset="0" stopColor="var(--color-ember)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--color-ember)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="50" rx="26" ry="14" fill={`url(#m-glow-${id})`} />
      <g className={sleepy ? '' : 'animate-flame'} style={{ transformOrigin: '32px 60px' }}>
        <path d="M32 1C36 11 51 18 51 37A19 19 0 0 1 13 37C13 28 18 21 22.5 16C22.5 22 25.5 26 28.5 26C28.5 17 27.5 9 32 1Z" fill={`url(#m-body-${id})`} />
        <ellipse cx="32" cy="47" rx="11" ry="6" fill="#fff3c4" opacity="0.3" />
      </g>
      {/* Face */}
      <g transform="translate(0 3)">
        {mood === 'happy' || mood === 'cheer' ? (
          <>
            <path d="M22.5 35 q3.5 -4.5 7 0" stroke="#2b1408" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M34.5 35 q3.5 -4.5 7 0" stroke="#2b1408" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          </>
        ) : sleepy ? (
          <>
            <path d="M22.5 35 h7" stroke="#2b1408" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M34.5 35 h7" stroke="#2b1408" strokeWidth="2.8" strokeLinecap="round" />
          </>
        ) : (
          <g className="animate-[blink_4.5s_ease-in-out_infinite]" style={{ transformOrigin: '32px 35px' }}>
            <ellipse cx="26" cy="35" rx="3.3" ry="4" fill="#2b1408" />
            <ellipse cx="38" cy="35" rx="3.3" ry="4" fill="#2b1408" />
            <circle cx="27.1" cy="33.6" r="1.2" fill="#fff" />
            <circle cx="39.1" cy="33.6" r="1.2" fill="#fff" />
          </g>
        )}
        {mood === 'fired' ? (
          <>
            <path d="M21.5 29 l7 2.5" stroke="#2b1408" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M42.5 29 l-7 2.5" stroke="#2b1408" strokeWidth="2.4" strokeLinecap="round" />
          </>
        ) : null}
        <ellipse cx="20.5" cy="40.5" rx="3" ry="1.9" fill="#ff7a7a" opacity="0.6" />
        <ellipse cx="43.5" cy="40.5" rx="3" ry="1.9" fill="#ff7a7a" opacity="0.6" />
        {mood === 'cheer' ? (
          <path d="M26.5 40.5 q5.5 8 11 0 z" fill="#2b1408" />
        ) : mood === 'sleepy' ? (
          <ellipse cx="32" cy="42" rx="2.2" ry="1.8" fill="#2b1408" />
        ) : mood === 'calm' ? (
          <path d="M28 41.5 q4 2.5 8 0" stroke="#2b1408" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M27 41 q5 5 10 0" stroke="#2b1408" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        )}
      </g>
      {gear ? (
        <g className={sleepy ? '' : 'animate-flame'} style={{ transformOrigin: '32px 60px' }}>
          <Gear gear={gear} />
        </g>
      ) : null}
      {sleepy ? (
        <g fill="var(--color-muted)" fontFamily="var(--font-display)" fontWeight="800">
          <text x="46" y="14" fontSize="9" className="animate-pulse-soft">
            z
          </text>
          <text x="52" y="7" fontSize="7" className="animate-pulse-soft">
            z
          </text>
        </g>
      ) : null}
      {mood === 'cheer' ? (
        <g fill="var(--color-amber)">
          <path d="M8 14 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5z" className="animate-pulse-soft" />
          <path d="M55 22 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1z" className="animate-pulse-soft" />
        </g>
      ) : null}
    </svg>
  )
}

/** Ember's mood for a given moment of the day. */
export function mascotMood(o: { hour: number; workoutDone: boolean; perfect: boolean; anyProgress: boolean }): MascotMood {
  if (o.perfect) return 'cheer'
  if (o.workoutDone) return 'fired'
  if (o.hour >= 22 || o.hour < 5) return 'sleepy'
  if (o.anyProgress) return 'happy'
  return 'calm'
}
