import { create } from 'zustand'

/** How the voice coach talks to you during workouts. */
export type CoachStyle = 'hype' | 'calm' | 'drill' | 'zen'
export type MotionPref = 'system' | 'full' | 'reduced'

export interface Prefs {
  /** Little sounds for wins: sets done, quests, level-ups. */
  sounds: boolean
  /** Vibration on taps and wins (Android; iPhone web apps can't vibrate). */
  haptics: boolean
  /** Confetti and celebration screens. */
  celebrations: boolean
  motion: MotionPref
  coach: CoachStyle
  /** What Ember wears (unlocked by level; null = nothing). */
  gear: 'headband' | 'shades' | 'cap' | 'medal' | 'crown' | null
}

export const COACH_STYLES: { id: CoachStyle; name: string; emoji: string; blurb: string; sample: string }[] = [
  { id: 'hype', name: 'Hype', emoji: '🔥', blurb: 'Loud, proud, all energy', sample: 'Let’s go! You’re on fire!' },
  { id: 'calm', name: 'Calm', emoji: '🙂', blurb: 'Friendly and encouraging', sample: 'Nice and steady. You’ve got this.' },
  { id: 'drill', name: 'Drill sergeant', emoji: '🪖', blurb: 'Tough love, no excuses', sample: 'Did I say stop? Two more!' },
  { id: 'zen', name: 'Zen', emoji: '🧘', blurb: 'Breath, focus, flow', sample: 'Breathe in… and press away.' },
]

const KEY = 'forge.prefs'
const DEFAULTS: Prefs = { sounds: true, haptics: true, celebrations: true, motion: 'system', coach: 'hype', gear: null }

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) }
  } catch {
    /* ignore */
  }
  return DEFAULTS
}

function applyMotion(m: MotionPref) {
  if (typeof document === 'undefined') return
  if (m === 'system') delete document.documentElement.dataset.motion
  else document.documentElement.dataset.motion = m
}

export const usePrefs = create<Prefs & { update: (p: Partial<Prefs>) => void }>((set, get) => ({
  ...(typeof localStorage === 'undefined' ? DEFAULTS : load()),
  update: (p) => {
    set(p)
    if (p.motion) applyMotion(p.motion)
    const { update: _u, ...rest } = get()
    void _u
    try {
      localStorage.setItem(KEY, JSON.stringify(rest))
    } catch {
      /* ignore */
    }
  },
}))

export function initPrefs() {
  applyMotion(usePrefs.getState().motion)
}

/** True when animations should be kept to a minimum (setting, or the phone's accessibility switch). */
export function reducedMotion(): boolean {
  const m = usePrefs.getState().motion
  if (m !== 'system') return m === 'reduced'
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
