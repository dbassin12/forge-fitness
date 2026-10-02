import { db } from '@/db/db'

export const BACKUP_APP = 'forge'
export const BACKUP_VERSION = 1

const TABLES = ['kv', 'workouts', 'foodLogs', 'customFoods', 'water', 'weights', 'measurements', 'photos', 'achievements', 'xpEvents', 'chat'] as const
type TableName = (typeof TABLES)[number]

export interface Backup {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  tables: Partial<Record<TableName, unknown[]>>
}

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(b)
  })
}

async function dataUrlToBlob(url: string): Promise<Blob> {
  return (await fetch(url)).blob()
}

/** Everything in one JSON file. Photos are included (as data URLs) only when asked. */
export async function exportBackup(includePhotos: boolean): Promise<Blob> {
  const tables: Backup['tables'] = {}
  for (const name of TABLES) {
    if (name === 'photos') {
      if (!includePhotos) continue
      const photos = await db.photos.toArray()
      tables.photos = await Promise.all(photos.map(async (p) => ({ ...p, blob: await blobToDataUrl(p.blob) })))
      continue
    }
    tables[name] = await db.table(name).toArray()
  }
  const backup: Backup = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables }
  return new Blob([JSON.stringify(backup)], { type: 'application/json' })
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text) as Partial<Backup>
  if (data.app !== BACKUP_APP || typeof data.version !== 'number' || !data.tables || typeof data.tables !== 'object') {
    throw new Error("This doesn't look like a Forge backup file.")
  }
  if (data.version > BACKUP_VERSION) throw new Error('This backup comes from a newer version of Forge. Update the app first.')
  return data as Backup
}

/** Replace all local data with a backup (photos are kept if the backup has none). */
export async function restoreBackup(b: Backup): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  const photos = b.tables.photos ? await Promise.all((b.tables.photos as { blob: string }[]).map(async (p) => ({ ...p, blob: await dataUrlToBlob(p.blob) }))) : undefined
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) {
      const rows = name === 'photos' ? photos : b.tables[name]
      if (!rows) continue
      const t = db.table(name)
      await t.clear()
      await t.bulkPut(rows)
      counts[name] = rows.length
    }
  })
  return counts
}

export async function wipeAll(): Promise<void> {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) await db.table(name).clear()
  })
}

/** Ask the browser to keep our data even under storage pressure. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
