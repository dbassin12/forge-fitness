import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db/db'
import { exportBackup, parseBackup, restoreBackup, wipeAll } from '@/state/backup'

describe('backup', () => {
  beforeEach(async () => {
    await wipeAll()
  })

  it('round-trips data through a JSON backup', async () => {
    await db.kv.put({ key: 'profile', value: { name: 'Test' }, updatedAt: 1 })
    await db.weights.put({ date: '2026-10-01', kg: 82, at: 1 })
    await db.foodLogs.add({ id: 'f1', date: '2026-10-01', meal: 'lunch', name: 'Egg', source: 'db', servings: 1, servingLabel: '1 large', kcal: 72, protein: 6, carbs: 0, fat: 5, createdAt: 1 })
    const blob = await exportBackup(false)
    const text = await blob.text()
    await wipeAll()
    expect(await db.weights.count()).toBe(0)
    const counts = await restoreBackup(parseBackup(text))
    expect(counts.weights).toBe(1)
    expect((await db.kv.get('profile'))?.value).toEqual({ name: 'Test' })
    expect((await db.foodLogs.get('f1'))?.kcal).toBe(72)
  })

  it('rejects files that are not Forge backups', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow(/Forge backup/)
    expect(() => parseBackup('{"app":"forge","version":99,"tables":{}}')).toThrow(/newer version/)
  })
})
