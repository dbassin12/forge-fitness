import { useLiveQuery } from 'dexie-react-hooks'
import { db, kvGet, kvSet } from '@/db/db'
import { isStandalone } from '@/app/pwa'
import { addXp } from './gamification'

export type StarterId = 'tutorial' | 'workout' | 'food' | 'play' | 'reminders' | 'install'

export interface StarterItem {
  id: StarterId
  emoji: string
  title: string
  text: string
  to: string
  done: boolean
}

export const STARTER_XP = 50

const DEFS: Omit<StarterItem, 'done'>[] = [
  { id: 'tutorial', emoji: '🎬', title: 'Watch a voiced tutorial', text: 'See how Forge teaches a move', to: '/exercise/bodyweight-squat' },
  { id: 'workout', emoji: '🏋️', title: 'Do your first workout', text: 'Or a 3-minute snack to start small', to: '/workout' },
  { id: 'food', emoji: '🍳', title: 'Log something you ate', text: 'Search, scan a barcode, or ask Claude', to: '/eat/add' },
  { id: 'play', emoji: '🎮', title: 'Play a game', text: 'Spin the wheel for a random move', to: '/play/wheel' },
  { id: 'reminders', emoji: '🔔', title: 'Turn on reminders', text: 'Nudges at the times you choose', to: '/more/reminders' },
  { id: 'install', emoji: '📲', title: 'Add Forge to your Home Screen', text: 'Full screen, offline, notifications', to: '/guide#install' },
]

export interface Starter {
  items: StarterItem[]
  done: number
  dismissed: boolean
  rewarded: boolean
}

/** The "Get started" checklist for new users. */
export function useStarter(): Starter | undefined {
  return useLiveQuery(async () => {
    const [acts, workouts, foods, reminders, dismissed, rewarded] = await Promise.all([
      db.kv.where('key').startsWith('act:').toArray(),
      db.workouts.toArray(),
      db.foodLogs.count(),
      kvGet<{ enabled?: boolean }>('reminders'),
      kvGet<boolean>('starter.dismissed'),
      kvGet<boolean>('starter.rewarded'),
    ])
    const flags: Record<StarterId, boolean> = {
      tutorial: acts.some((a) => ((a.value as Record<string, number>)?.tutorial ?? 0) > 0),
      workout: workouts.some((w) => w.kind !== 'test' && !w.sessionKey.startsWith('play:')),
      food: foods > 0,
      play: workouts.some((w) => w.sessionKey.startsWith('play:')),
      reminders: !!reminders?.enabled,
      install: typeof window !== 'undefined' && isStandalone(),
    }
    const items = DEFS.map((d) => ({ ...d, done: flags[d.id] }))
    return { items, done: items.filter((i) => i.done).length, dismissed: !!dismissed, rewarded: !!rewarded }
  }, [])
}

export async function dismissStarter(): Promise<void> {
  await kvSet('starter.dismissed', true)
}

/** Pay the one-time bonus when every item is done. Returns true the first time. */
export async function rewardStarter(): Promise<boolean> {
  return db.transaction('rw', [db.kv, db.xpEvents], async () => {
    if (await kvGet<boolean>('starter.rewarded')) return false
    await kvSet('starter.rewarded', true)
    await addXp('starter', STARTER_XP)
    return true
  })
}
