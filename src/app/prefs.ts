import { create } from 'zustand'
import { isBloom, storageKey } from './brand'

/** How the voice coach talks to you during workouts (Bloom offers zen, calm and sunny). */
export type CoachStyle = 'hype' | 'calm' | 'drill' | 'zen' | 'sunny'
export type MotionPref = 'system' | 'full' | 'reduced'

export interface Prefs {
  /** Little sounds for wins: sets done, quests, level-ups. */
  sounds: boolean
  /** Vibration on taps and wins (Android; switch ticks on iPhone with iOS 18+). */
  haptics: boolean
  /** Confetti and celebration screens. */
  celebrations: boolean
  motion: MotionPref
  coach: CoachStyle
  /** What the mascot wears (unlocked by level; null = nothing). */
  gear: MascotGearId | null
}

/** Forge's Ember: headband, shades, cap, medal, crown. Bloom's Lila: headband, shades, sun hat, butterfly, flower crown. */
export type MascotGearId = 'headband' | 'shades' | 'cap' | 'medal' | 'crown' | 'sunhat' | 'butterfly' | 'flowercrown'

export interface CoachStyleInfo {
  id: CoachStyle
  name: string
  emoji: string
  blurb: string
  sample: string
}

const FORGE_COACHES: CoachStyleInfo[] = [
  { id: 'hype', name: 'Hype', emoji: '🔥', blurb: 'Loud, proud, all energy', sample: 'Let’s go! You’re on fire!' },
  { id: 'calm', name: 'Calm', emoji: '🙂', blurb: 'Friendly and encouraging', sample: 'Nice and steady. You’ve got this.' },
  { id: 'drill', name: 'Drill sergeant', emoji: '🪖', blurb: 'Tough love, no excuses', sample: 'Did I say stop? Two more!' },
  { id: 'zen', name: 'Zen', emoji: '🧘', blurb: 'Breath, focus, flow', sample: 'Breathe in… and press away.' },
]

const BLOOM_COACHES: CoachStyleInfo[] = [
  { id: 'zen', name: 'Zen', emoji: '🧘', blurb: 'Breath, stillness, flow', sample: 'Breathe in… and soften as you breathe out.' },
  { id: 'calm', name: 'Calm', emoji: '🌿', blurb: 'Warm and reassuring', sample: 'Nice and easy. You’re doing beautifully.' },
  { id: 'sunny', name: 'Sunny', emoji: '🌼', blurb: 'Bright and cheerful', sample: 'Look at you go! Big smile, soft shoulders.' },
]

/** Voice coach personalities this app offers. */
export const COACH_STYLES: CoachStyleInfo[] = isBloom ? BLOOM_COACHES : FORGE_COACHES

const KEY = storageKey('prefs')
const DEFAULTS: Prefs = { sounds: true, haptics: true, celebrations: true, motion: 'system', coach: isBloom ? 'zen' : 'hype', gear: null }

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) }
      // A coach this app doesn't offer (e.g. after a restore) falls back to the default.
      return COACH_STYLES.some((c) => c.id === p.coach) ? p : { ...p, coach: DEFAULTS.coach }
    }
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
