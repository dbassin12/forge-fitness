import { useLiveQuery } from 'dexie-react-hooks'
import { db, kvGet, kvSet, type SetLog } from '@/db/db'
import type { Profile } from '@/domain/types'
import { playKcal, recordResult, type ChallengeId, type ChallengeRecord, type ChallengeResult } from '@/engines/play'
import { todayISO } from '@/lib/dates'
import { uid } from '@/lib/id'
import { addXp } from './gamification'

const CHALLENGES_KEY = 'play.challenges'
const DECK_BEST_KEY = 'play.deck.best'

/** Save a finished Play game as a workout (counts for minutes, totals, quests and achievements). */
export async function logPlay(args: {
  key: string
  title: string
  startedAt: number
  profile: Profile
  exercises: { exerciseId: string; sets: SetLog[] }[]
  xp: number
}): Promise<void> {
  const date = todayISO()
  const finishedAt = Date.now()
  const minutes = Math.max(0.5, (finishedAt - args.startedAt) / 60000)
  await db.workouts.add({
    id: uid('w'),
    date,
    startedAt: args.startedAt,
    finishedAt,
    sessionKey: `play:${args.key}`,
    title: args.title,
    kind: 'custom',
    exercises: args.exercises.map((e) => ({ exerciseId: e.exerciseId, block: 'main', sets: e.sets })),
    calories: playKcal(minutes, args.profile.weightKg),
    xp: args.xp,
  })
  await addXp('play', args.xp, date)
}

export function useChallengeRecords(): Partial<Record<ChallengeId, ChallengeRecord>> | undefined {
  return useLiveQuery(async () => (await kvGet<Partial<Record<ChallengeId, ChallengeRecord>>>(CHALLENGES_KEY)) ?? {}, [])
}

export async function saveChallenge(id: ChallengeId, r: ChallengeResult): Promise<{ isBest: boolean; previous?: number }> {
  const all = (await kvGet<Partial<Record<ChallengeId, ChallengeRecord>>>(CHALLENGES_KEY)) ?? {}
  const { record, isBest, previous } = recordResult(all[id], r)
  await kvSet(CHALLENGES_KEY, { ...all, [id]: record })
  return { isBest, previous }
}

export function useDeckBests(): Record<string, number> | undefined {
  return useLiveQuery(async () => (await kvGet<Record<string, number>>(DECK_BEST_KEY)) ?? {}, [])
}

/** Record a deck time; returns true when it's the fastest for that size and mode. */
export async function saveDeckTime(key: string, seconds: number): Promise<{ isBest: boolean; previous?: number }> {
  const all = (await kvGet<Record<string, number>>(DECK_BEST_KEY)) ?? {}
  const previous = all[key]
  const isBest = previous === undefined || seconds < previous
  if (isBest) await kvSet(DECK_BEST_KEY, { ...all, [key]: seconds })
  return { isBest, previous }
}
