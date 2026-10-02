import { useLiveQuery } from 'dexie-react-hooks'
import { db, kvSet } from '@/db/db'
import type { Profile } from '@/domain/types'
import type { ProgressState } from '@/engines/plan/types'
import { initialProgress } from '@/engines/progression/progress'

export const KEYS = {
  profile: 'profile',
  progress: 'progress',
  swaps: 'plan.swaps',
} as const

async function read<T>(key: string): Promise<T | null> {
  return ((await db.kv.get(key))?.value as T | undefined) ?? null
}

/** `undefined` while loading, `null` before onboarding. */
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(() => read<Profile>(KEYS.profile), [])
}

export async function saveProfile(p: Profile): Promise<void> {
  await kvSet(KEYS.profile, p)
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  const cur = await read<Profile>(KEYS.profile)
  if (cur) await kvSet(KEYS.profile, { ...cur, ...patch })
}

export function useStoredProgress(): ProgressState | null | undefined {
  return useLiveQuery(() => read<ProgressState>(KEYS.progress), [])
}

/** Training progress, created from the profile on first use. */
export function useProgress(profile: Profile | null | undefined): ProgressState | undefined {
  const stored = useStoredProgress()
  if (stored === undefined || !profile) return undefined
  return stored ?? initialProgress(profile)
}

export async function saveProgress(p: ProgressState): Promise<void> {
  await kvSet(KEYS.progress, p)
}

export async function loadProgress(profile: Profile): Promise<ProgressState> {
  return (await read<ProgressState>(KEYS.progress)) ?? initialProgress(profile)
}

/** One-off swaps for one queue position (ignored once that session is done). */
export interface SessionSwaps {
  index: number
  swaps: Record<number, string>
}

export function useSessionSwaps(): SessionSwaps | null | undefined {
  return useLiveQuery(() => read<SessionSwaps>(KEYS.swaps), [])
}

export async function setSessionSwap(index: number, slotIndex: number, exerciseId: string | null): Promise<void> {
  const cur = await read<SessionSwaps>(KEYS.swaps)
  const swaps = cur && cur.index === index ? { ...cur.swaps } : {}
  if (exerciseId) swaps[slotIndex] = exerciseId
  else delete swaps[slotIndex]
  await kvSet(KEYS.swaps, { index, swaps })
}
