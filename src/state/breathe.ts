import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import type { Profile } from '@/domain/types'
import { breathXp } from '@/engines/breath'
import { addDays, startOfWeek, todayISO } from '@/lib/dates'
import { uid } from '@/lib/id'
import { addXp } from './gamification'

/** Breathing and relaxation sessions are saved like workouts with a `breathe:` key. */
export const BREATHE_PREFIX = 'breathe:'

export async function logBreath(args: { id: string; title: string; startedAt: number; profile: Profile }): Promise<{ minutes: number; xp: number }> {
  const date = todayISO()
  const finishedAt = Date.now()
  const minutes = Math.max(0.5, (finishedAt - args.startedAt) / 60000)
  const xp = breathXp(minutes)
  await db.workouts.add({
    id: uid('w'),
    date,
    startedAt: args.startedAt,
    finishedAt,
    sessionKey: `${BREATHE_PREFIX}${args.id}`,
    title: args.title,
    kind: 'custom',
    exercises: [],
    // Quiet breathing: about 1.3 METs.
    calories: Math.round((1.3 * args.profile.weightKg * minutes) / 60),
    xp,
  })
  await addXp('breathe', xp, date)
  return { minutes, xp }
}

/** Mindful minutes this week (breathing and relaxation). */
export function useMindfulMinutesThisWeek(): number | undefined {
  return useLiveQuery(async () => {
    const from = startOfWeek(todayISO())
    const logs = await db.workouts.where('date').between(from, addDays(from, 6), true, true).toArray()
    return Math.round(logs.filter((w) => w.sessionKey.startsWith(BREATHE_PREFIX)).reduce((s, w) => s + (w.finishedAt - w.startedAt) / 60000, 0))
  }, [])
}
