/**
 * Tiny IndexedDB key/value store shared by the app and the service worker (no Dexie in the SW).
 * The app keeps a small "context" snapshot here so push notifications can say something specific
 * ("💪 Full Body B · 15 min") even when the app is closed.
 */
import type { AppId } from './app/appId'

const STORE = 'kv'

/** One small database per app (Forge's keeps its original name). */
const dbName = (app: AppId) => `${app}-sw`

function open(app: AppId): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName(app), 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function bridgeSet(app: AppId, key: string, value: unknown): Promise<void> {
  const db = await open(app)
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function bridgeGet<T>(app: AppId, key: string): Promise<T | undefined> {
  const db = await open(app)
  const v = await new Promise<T | undefined>((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
  db.close()
  return v
}

export interface SwContext {
  /** Local date this snapshot describes. */
  date: string
  name?: string
  nextWorkout?: { title: string; minutes: number; exercises: string[] }
  workoutDone: boolean
  waterMl: number
  waterTargetMl: number
  imperial: boolean
  proteinLeft?: number
  kcalLeft?: number
  mealsLogged: string[]
  streakWeeks: number
  thisWeek: number
  weekTarget: number
  /** The coach personality picked in the app (Look & feel). */
  coach?: 'hype' | 'calm' | 'drill' | 'zen' | 'sunny'
  /** Which app wrote the snapshot (Bloom words things more gently). */
  app?: AppId
}

/** Workout and streak nudges in the voice of the user's coach. */
const VOICE = {
  hype: { workout: ['🔥', 'Let’s go!'], streakTitle: (w: number) => (w > 0 ? `🔥 ${w}-week streak on the line!` : '🔥 Still time to train today!'), streakBody: 'Even 5 minutes keeps the fire alive. Tap and go!' },
  calm: { workout: ['🙂', 'Whenever you’re ready.'], streakTitle: (w: number) => (w > 0 ? `🙂 Your ${w}-week streak is waiting` : '🙂 Still time for a short workout'), streakBody: 'A gentle 5-minute workout still counts.' },
  drill: { workout: ['🪖', 'Move it, recruit!'], streakTitle: (w: number) => (w > 0 ? `🪖 ${w}-week streak in danger!` : '🪖 No workout yet, recruit!'), streakBody: 'Five minutes. Right now. Tap to start.' },
  zen: { workout: ['🧘', 'Breathe, then begin.'], streakTitle: (w: number) => (w > 0 ? `🧘 Keep your ${w}-week rhythm` : '🧘 A moment for you'), streakBody: 'Five mindful minutes keep your streak.' },
  sunny: { workout: ['🌼', 'Your mat is waiting!'], streakTitle: (w: number) => (w > 0 ? `🌼 ${w} lovely weeks in a row` : '🌼 Still time for a little stretch'), streakBody: 'Even five gentle minutes count.' },
} as const

/** Bloom's gentler versions of the practice nudges. */
const BLOOM_VOICE: Record<'calm' | 'zen' | 'sunny', { practice: [string, string]; rhythmTitle: (w: number) => string; rhythmBody: string }> = {
  zen: { practice: ['🧘', 'Breathe, then begin.'], rhythmTitle: (w) => (w > 0 ? `🧘 Keep your ${w}-week rhythm` : '🧘 A moment for you'), rhythmBody: 'Five slow minutes on your mat still count.' },
  calm: { practice: ['🌿', 'Whenever you’re ready.'], rhythmTitle: (w) => (w > 0 ? `🌿 Your ${w}-week rhythm is waiting` : '🌿 Still time for a gentle stretch'), rhythmBody: 'A five-minute flow still counts.' },
  sunny: { practice: ['🌼', 'Your mat is waiting!'], rhythmTitle: (w) => (w > 0 ? `🌼 ${w} lovely weeks in a row` : '🌼 Still time for a little stretch'), rhythmBody: 'Even five gentle minutes count.' },
}

const pad = (n: number) => String(n).padStart(2, '0')
export function localISODate(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Notification text from today's snapshot; null keeps the server's generic text. */
export function personalize(type: string, ctx: SwContext | undefined, meal?: string): { title: string; body: string } | null {
  if (!ctx || ctx.date !== localISODate()) return null
  if (ctx.app === 'bloom' && (type === 'workout' || type === 'streak')) return bloomNudge(type, ctx)
  const water = ctx.imperial ? `${Math.round(ctx.waterMl / 29.5735)}/${Math.round(ctx.waterTargetMl / 29.5735)} oz` : `${(ctx.waterMl / 1000).toFixed(1)}/${(ctx.waterTargetMl / 1000).toFixed(1)} L`
  switch (type) {
    case 'workout': {
      if (ctx.workoutDone) return { title: '✅ Already trained today', body: 'Nice work. Fancy a 3-minute stretch instead?' }
      if (!ctx.nextWorkout) return null
      const moves = `${ctx.nextWorkout.exercises.slice(0, 3).join(', ')}${ctx.nextWorkout.exercises.length > 3 ? '…' : ''}`
      if (!ctx.coach) return { title: `💪 ${ctx.nextWorkout.title} · ${ctx.nextWorkout.minutes} min`, body: moves }
      const [emoji, line] = VOICE[ctx.coach].workout
      return { title: `${emoji} ${ctx.nextWorkout.title} · ${ctx.nextWorkout.minutes} min`, body: `${line} ${moves}` }
    }
    case 'streak':
      if (ctx.workoutDone) return { title: '🔥 Streak safe', body: `${ctx.thisWeek}/${ctx.weekTarget} workouts this week. See you next time!` }
      if (ctx.coach) return { title: VOICE[ctx.coach].streakTitle(ctx.streakWeeks), body: VOICE[ctx.coach].streakBody }
      return { title: ctx.streakWeeks > 0 ? `🔥 ${ctx.streakWeeks}-week streak on the line` : '🔥 Still time to train today', body: 'Even a 5-minute express workout counts. Tap to start.' }
    case 'water':
      if (ctx.waterMl >= ctx.waterTargetMl) return { title: '💧 Water goal reached', body: `${water} — great job staying hydrated.` }
      return { title: `💧 ${water}`, body: 'Time for a glass of water.' }
    case 'meal':
      if (meal && ctx.mealsLogged.includes(meal)) return { title: `🍽️ ${meal[0].toUpperCase()}${meal.slice(1)} logged`, body: ctx.proteinLeft && ctx.proteinLeft > 0 ? `${ctx.proteinLeft} g protein to go today.` : 'Nice — on track today.' }
      return { title: `🍽️ What did you have for ${meal ?? 'your meal'}?`, body: ctx.proteinLeft && ctx.proteinLeft > 0 ? `${ctx.proteinLeft} g protein to go today. Logging takes 10 seconds.` : 'Logging takes 10 seconds.' }
    case 'checkin':
      return { title: '🌙 Evening check-in', body: `${ctx.kcalLeft !== undefined ? `${Math.max(0, ctx.kcalLeft)} kcal left · ` : ''}${water} water. Log anything you missed.` }
    default:
      return null
  }
}

function bloomNudge(type: 'workout' | 'streak', ctx: SwContext): { title: string; body: string } | null {
  const v = BLOOM_VOICE[ctx.coach === 'calm' || ctx.coach === 'sunny' ? ctx.coach : 'zen']
  if (type === 'workout') {
    if (ctx.workoutDone) return { title: '🌸 Practice done for today', body: 'Lovely. Fancy a few slow breaths later on?' }
    if (!ctx.nextWorkout) return null
    const poses = `${ctx.nextWorkout.exercises.slice(0, 3).join(', ')}${ctx.nextWorkout.exercises.length > 3 ? '…' : ''}`
    return { title: `${v.practice[0]} ${ctx.nextWorkout.title} · ${ctx.nextWorkout.minutes} min`, body: `${v.practice[1]} ${poses}` }
  }
  if (ctx.workoutDone) return { title: '🌸 Rhythm kept', body: `${ctx.thisWeek}/${ctx.weekTarget} practices this week. See you on the mat.` }
  return { title: v.rhythmTitle(ctx.streakWeeks), body: v.rhythmBody }
}
