import { APP_BASE, appForPath, type AppId } from './appId'

/**
 * One codebase, two apps. Forge (calisthenics) lives at `/`; Bloom (yoga and gentle movement,
 * made for Michal) lives at `/bloom/`. Each HTML entry stamps `data-app` on <html>, and
 * everything that differs between the two (name, mascot, wording, storage) reads it from here.
 */
export type { AppId }
export type Program = 'strength' | 'yoga'

export interface Brand {
  id: AppId
  name: string
  /** Full name for titles and share text. */
  title: string
  /** One line under the name on the welcome screen. */
  tagline: string
  /** Where the app lives, with a trailing slash ('/' or '/bloom/'). */
  base: string
  /** IndexedDB name for all the user's data (kept separate per app). */
  dbName: string
  /** Prefix for small settings kept in localStorage. */
  storagePrefix: string
  /** The little character that gives tips and celebrates. */
  mascot: string
  program: Program
  /** Who the app was made for (shown on the welcome screen). */
  madeFor?: string
  /** Everyday words, so screens read naturally in either app. */
  words: {
    workout: string
    Workout: string
    workouts: string
    exercise: string
    Exercise: string
    exercises: string
    /** The training tab. */
    train: string
  }
}

export const BRANDS: Record<AppId, Brand> = {
  forge: {
    id: 'forge',
    name: 'Forge',
    title: 'Forge — Calisthenics & Nutrition Coach',
    tagline: 'Your pocket calisthenics coach',
    base: APP_BASE.forge,
    dbName: 'forge',
    storagePrefix: 'forge',
    mascot: 'Ember',
    program: 'strength',
    words: { workout: 'workout', Workout: 'Workout', workouts: 'workouts', exercise: 'exercise', Exercise: 'Exercise', exercises: 'exercises', train: 'Train' },
  },
  bloom: {
    id: 'bloom',
    name: 'Bloom',
    title: 'Bloom — Yoga & Gentle Movement',
    tagline: 'Yoga and gentle movement, at your pace',
    base: APP_BASE.bloom,
    dbName: 'bloom',
    storagePrefix: 'bloom',
    mascot: 'Lila',
    program: 'yoga',
    madeFor: 'Michal',
    words: { workout: 'practice', Workout: 'Practice', workouts: 'practices', exercise: 'pose', Exercise: 'Pose', exercises: 'poses', train: 'Practice' },
  },
}

function detect(): AppId {
  if (typeof document !== 'undefined') {
    const tagged = document.documentElement?.dataset.app
    if (tagged === 'bloom' || tagged === 'forge') return tagged
  }
  if (typeof location !== 'undefined') return appForPath(location.pathname)
  return 'forge'
}

/** The app this page is running. */
export const APP: Brand = BRANDS[detect()]

export const isBloom = APP.id === 'bloom'

/** Everyday words for the current app ("practice" in Bloom, "workout" in Forge). */
export const W = APP.words

/** A localStorage key that never collides between the two apps on one phone. */
export const storageKey = (name: string) => `${APP.storagePrefix}.${name}`

/** A public asset path inside the current app ("icons/icon-192.png" → "/bloom/icons/icon-192.png"). */
export const asset = (path: string) => `${APP.base}${path.replace(/^\//, '')}`
