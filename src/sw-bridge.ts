/**
 * Tiny IndexedDB key/value store shared by the app and the service worker (no Dexie in the SW).
 * The app keeps a small "context" snapshot here so push notifications can say something specific
 * ("💪 Full Body B · 15 min") even when the app is closed.
 */
const DB_NAME = 'forge-sw'
const STORE = 'kv'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function bridgeSet(key: string, value: unknown): Promise<void> {
  const db = await open()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function bridgeGet<T>(key: string): Promise<T | undefined> {
  const db = await open()
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
}

const pad = (n: number) => String(n).padStart(2, '0')
export function localISODate(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Notification text from today's snapshot; null keeps the server's generic text. */
export function personalize(type: string, ctx: SwContext | undefined, meal?: string): { title: string; body: string } | null {
  if (!ctx || ctx.date !== localISODate()) return null
  const water = ctx.imperial ? `${Math.round(ctx.waterMl / 29.5735)}/${Math.round(ctx.waterTargetMl / 29.5735)} oz` : `${(ctx.waterMl / 1000).toFixed(1)}/${(ctx.waterTargetMl / 1000).toFixed(1)} L`
  switch (type) {
    case 'workout':
      if (ctx.workoutDone) return { title: '✅ Already trained today', body: 'Nice work. Fancy a 3-minute stretch instead?' }
      if (!ctx.nextWorkout) return null
      return { title: `💪 ${ctx.nextWorkout.title} · ${ctx.nextWorkout.minutes} min`, body: `${ctx.nextWorkout.exercises.slice(0, 3).join(', ')}${ctx.nextWorkout.exercises.length > 3 ? '…' : ''}` }
    case 'streak':
      if (ctx.workoutDone) return { title: '🔥 Streak safe', body: `${ctx.thisWeek}/${ctx.weekTarget} workouts this week. See you next time!` }
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
