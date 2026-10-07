import { useId } from 'react'
import { APP, isBloom } from '@/app/brand'
import type { MascotGearId } from '@/app/prefs'
import { cx } from './cx'

export type MascotMood = 'happy' | 'fired' | 'cheer' | 'sleepy' | 'calm'
export type MascotGear = MascotGearId

/** Gear Ember earns as you level up. */
const EMBER_GEAR: { id: MascotGear; name: string; level: number }[] = [
  { id: 'headband', name: 'Sweatband', level: 2 },
  { id: 'shades', name: 'Shades', level: 4 },
  { id: 'cap', name: 'Coach cap', level: 6 },
  { id: 'medal', name: 'Gold medal', level: 8 },
  { id: 'crown', name: 'Crown', level: 10 },
]

/** What Lila, Bloom's little lotus, collects along the way. */
const LILA_GEAR: { id: MascotGear; name: string; level: number }[] = [
  { id: 'headband', name: 'Yoga headband', level: 2 },
  { id: 'shades', name: 'Sunglasses', level: 4 },
  { id: 'sunhat', name: 'Sun hat', level: 6 },
  { id: 'butterfly', name: 'Butterfly friend', level: 8 },
  { id: 'flowercrown', name: 'Flower crown', level: 10 },
]

/** Gear the mascot earns as you level up. */
export const MASCOT_GEAR = isBloom ? LILA_GEAR : EMBER_GEAR

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
    default:
      return null
  }
}

/** Lila's accessories, drawn around her petal "head". */
function LilaGear({ gear }: { gear: MascotGear }) {
  switch (gear) {
    case 'headband':
      return (
        <g>
          <path d="M18.8 27.5 Q32 22.5 45.2 27.5 L45.8 31.4 Q32 26.6 18.2 31.4 Z" fill="#b9a3ee" />
          <circle cx="42.6" cy="27.6" r="2.3" fill="#fff" />
          <circle cx="42.6" cy="27.6" r="1" fill="#f2c94c" />
        </g>
      )
    case 'shades':
      return (
        <g>
          <path d="M19.8 35 h10.6 v3.2 a4 4 0 0 1 -4 4 h-2.6 a4 4 0 0 1 -4 -4 z" fill="#5b2a46" />
          <path d="M33.6 35 h10.6 v3.2 a4 4 0 0 1 -4 4 h-2.6 a4 4 0 0 1 -4 -4 z" fill="#5b2a46" />
          <path d="M30.4 36 h3.2" stroke="#5b2a46" strokeWidth="1.8" />
          <path d="M21.8 36.6 l3 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M35.6 36.6 l3 0" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )
    case 'sunhat':
      return (
        <g>
          <ellipse cx="32" cy="17.5" rx="21" ry="4.6" fill="#f3d9a4" stroke="#d9b56f" strokeWidth="1" />
          <path d="M21.5 17 Q22 6.5 32 6.5 Q42 6.5 42.5 17 Z" fill="#f6e2b6" stroke="#d9b56f" strokeWidth="1" />
          <path d="M22 14.6 Q32 17.6 42 14.6 L42.3 16.8 Q32 19.8 21.7 16.8 Z" fill="#e58aae" />
          <circle cx="40.5" cy="15.6" r="2" fill="#fff" />
        </g>
      )
    case 'butterfly':
      return (
        <g className="animate-[flutter_1.6s_ease-in-out_infinite]" style={{ transformOrigin: '52px 12px' }}>
          <path d="M52 12 Q45 4 46.5 11 Q45.5 16 52 12 Z" fill="#8fc6f0" />
          <path d="M52 12 Q59 4 57.5 11 Q58.5 16 52 12 Z" fill="#8fc6f0" />
          <path d="M52 12 Q47 15 48.5 18.5 Q51 17.5 52 12 Z" fill="#b8dcf7" />
          <path d="M52 12 Q57 15 55.5 18.5 Q53 17.5 52 12 Z" fill="#b8dcf7" />
          <path d="M52 8.5 v8" stroke="#3a1b2c" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )
    case 'flowercrown':
      return (
        <g>
          <path d="M18.5 23.5 Q32 16.5 45.5 23.5" stroke="#6f9f80" strokeWidth="2" fill="none" strokeLinecap="round" />
          {[
            [20.5, 22.2, '#fff'],
            [26, 19.4, '#f7c948'],
            [32, 18.4, '#f48fb1'],
            [38, 19.4, '#f7c948'],
            [43.5, 22.2, '#fff'],
          ].map(([x, y, c]) => (
            <g key={String(x)}>
              <circle cx={Number(x)} cy={Number(y)} r="2.7" fill={String(c)} stroke="#e7a3bf" strokeWidth="0.6" />
              <circle cx={Number(x)} cy={Number(y)} r="0.9" fill="#e79b3d" />
            </g>
          ))}
        </g>
      )
    default:
      return null
  }
}

const PLUM = '#3a1b2c'

/**
 * Lila, Bloom's little lotus. Pure SVG + CSS like Ember: she sways, blinks and opens her petals
 * wider on good days; at night her petals fold in and she dozes.
 */
function Lila({ mood, size, className, gear }: { mood: MascotMood; size: number; className?: string; gear?: MascotGear | null }) {
  const id = useId().replace(/:/g, '')
  const sleepy = mood === 'sleepy'
  // How far the side petals open: folded at night, wide open when celebrating.
  const open = sleepy ? 0.55 : mood === 'cheer' ? 1.18 : mood === 'fired' ? 1.08 : 1
  const petal = (deg: number, len: number, fill: string) => {
    const tip = 52 - len
    return <path transform={`rotate(${deg * open} 32 52)`} fill={fill} d={`M32 52 C${32 - len * 0.32} ${52 - len * 0.35} ${32 - len * 0.3} ${tip + len * 0.28} 32 ${tip} C${32 + len * 0.3} ${tip + len * 0.28} ${32 + len * 0.32} ${52 - len * 0.35} 32 52 Z`} />
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cx('shrink-0 overflow-visible', className)} role="img" aria-label={`${APP.mascot} the lotus, ${mood}`}>
      <defs>
        <linearGradient id={`l-head-${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#f7c3d6" />
          <stop offset="1" stopColor="#ec8fb3" />
        </linearGradient>
        <linearGradient id={`l-side-${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fbd5e3" />
          <stop offset="1" stopColor="#f1a7c3" />
        </linearGradient>
        <radialGradient id={`l-glow-${id}`} cx="0.5" cy="0.6" r="0.5">
          <stop offset="0" stopColor="var(--color-ember)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-ember)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="46" rx="28" ry="15" fill={`url(#l-glow-${id})`} />
      <ellipse cx="32" cy="55.5" rx="21" ry="4.6" fill="#7fb08f" />
      <path d="M32 55.5 L45 52.4" stroke="#5f8f70" strokeWidth="1.2" strokeLinecap="round" />
      <g className={sleepy ? '' : 'animate-sway'} style={{ transformOrigin: '32px 54px' }}>
        {petal(-66, 18, `url(#l-side-${id})`)}
        {petal(66, 18, `url(#l-side-${id})`)}
        {petal(-36, 26, `url(#l-side-${id})`)}
        {petal(36, 26, `url(#l-side-${id})`)}
        <path d="M32 54.5 C14 47 12 23 32 5 C52 23 50 47 32 54.5 Z" fill={`url(#l-head-${id})`} />
        <path d="M32 50 C23 43 22 26 31 13 C27.5 26 27.5 40 32 50 Z" fill="#fff" opacity="0.22" />
        {/* Face */}
        <g transform="translate(0 3)">
          {mood === 'happy' || mood === 'cheer' || mood === 'fired' ? (
            <>
              <path d="M22.8 35 q3.4 -4.2 6.8 0" stroke={PLUM} strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <path d="M34.4 35 q3.4 -4.2 6.8 0" stroke={PLUM} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </>
          ) : sleepy ? (
            <>
              <path d="M22.8 35.5 q3.4 2.6 6.8 0" stroke={PLUM} strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M34.4 35.5 q3.4 2.6 6.8 0" stroke={PLUM} strokeWidth="2.4" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <g className="animate-[blink_5s_ease-in-out_infinite]" style={{ transformOrigin: '32px 35px' }}>
              <ellipse cx="26.2" cy="35" rx="3" ry="3.7" fill={PLUM} />
              <ellipse cx="37.8" cy="35" rx="3" ry="3.7" fill={PLUM} />
              <circle cx="27.2" cy="33.7" r="1.1" fill="#fff" />
              <circle cx="38.8" cy="33.7" r="1.1" fill="#fff" />
            </g>
          )}
          <ellipse cx="21" cy="40.6" rx="2.8" ry="1.8" fill="#e8577f" opacity={mood === 'fired' || mood === 'cheer' ? 0.55 : 0.35} />
          <ellipse cx="43" cy="40.6" rx="2.8" ry="1.8" fill="#e8577f" opacity={mood === 'fired' || mood === 'cheer' ? 0.55 : 0.35} />
          {mood === 'cheer' ? (
            <path d="M27 40.5 q5 7 10 0 z" fill={PLUM} />
          ) : sleepy ? (
            <ellipse cx="32" cy="42" rx="1.8" ry="1.4" fill={PLUM} />
          ) : (
            <path d={mood === 'calm' ? 'M28.5 41.5 q3.5 2.2 7 0' : 'M27.5 41 q4.5 4.4 9 0'} stroke={PLUM} strokeWidth="2.3" fill="none" strokeLinecap="round" />
          )}
        </g>
        {gear ? <LilaGear gear={gear} /> : null}
      </g>
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
      {mood === 'cheer' || mood === 'fired' ? (
        <g fill="#f7c948">
          <path d="M8 16 l1.4 2.8 2.8 1.4 -2.8 1.4 -1.4 2.8 -1.4 -2.8 -2.8 -1.4 2.8 -1.4z" className="animate-pulse-soft" />
          {mood === 'cheer' ? <path d="M56 26 l1 2 2 1 -2 1 -1 2 -1 -2 -2 -1 2 -1z" className="animate-pulse-soft" /> : null}
        </g>
      ) : null}
    </svg>
  )
}

/**
 * The app's mascot: Ember, Forge's little flame, or Lila, Bloom's lotus. Ember bobs, flickers and
 * blinks, and its face follows your day (fired up after a workout, cheering on a perfect day,
 * sleepy late at night).
 */
export function Mascot({ mood = 'happy', size = 56, className, gear }: { mood?: MascotMood; size?: number; className?: string; gear?: MascotGear | null }) {
  if (isBloom) return <Lila mood={mood} size={size} className={className} gear={gear} />
  return <Ember mood={mood} size={size} className={className} gear={gear} />
}

function Ember({ mood, size, className, gear }: { mood: MascotMood; size: number; className?: string; gear?: MascotGear | null }) {
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
