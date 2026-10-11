import { useLiveQuery } from 'dexie-react-hooks'
import { db, kvSet } from '@/db/db'

const KEY = 'howto.explained'

/** How many times the coach has explained each exercise in full (by exercise id). */
export type Explained = Record<string, number>

/** `undefined` while loading. */
export function useExplained(): Explained | undefined {
  return useLiveQuery(async () => ((await db.kv.get(KEY))?.value as Explained | undefined) ?? {}, [])
}

export async function markExplained(exerciseId: string): Promise<void> {
  await db.transaction('rw', db.kv, async () => {
    const cur = ((await db.kv.get(KEY))?.value as Explained | undefined) ?? {}
    await kvSet(KEY, { ...cur, [exerciseId]: (cur[exerciseId] ?? 0) + 1 })
  })
}
