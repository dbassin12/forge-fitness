import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Measurement, type ProgressPhoto, type WeightEntry } from '@/db/db'
import type { ISODate, Profile } from '@/domain/types'
import { XP } from '@/engines/gamification'
import { addDays, todayISO } from '@/lib/dates'
import { uid } from '@/lib/id'
import { addXp } from './gamification'
import { saveProfile } from './store'

export function useWeights(days = 365): WeightEntry[] | undefined {
  return useLiveQuery(() => db.weights.where('date').aboveOrEqual(addDays(todayISO(), -days)).sortBy('date'), [days])
}

/** One weigh-in per day (the latest wins); keeps the profile weight (and targets) current. */
export async function logWeight(kg: number, profile: Profile, date: ISODate = todayISO()): Promise<void> {
  const existed = await db.weights.get(date)
  await db.weights.put({ date, kg, at: Date.now() })
  if (!existed) await addXp('weigh-in', XP.weighIn, date)
  const latest = await db.weights.orderBy('date').last()
  if (latest && latest.date === date) await saveProfile({ ...profile, weightKg: kg })
}

export async function deleteWeight(date: ISODate): Promise<void> {
  await db.weights.delete(date)
}

export function useMeasurements(): Measurement[] | undefined {
  return useLiveQuery(() => db.measurements.orderBy('date').toArray(), [])
}

export async function addMeasurement(m: Omit<Measurement, 'id' | 'at'>): Promise<void> {
  await db.measurements.add({ ...m, id: uid('m'), at: Date.now() })
}

export function usePhotos(): ProgressPhoto[] | undefined {
  return useLiveQuery(() => db.photos.orderBy('date').toArray(), [])
}

/** Downscale a camera photo to ≤1280 px JPEG before storing (keeps storage small). */
export async function shrinkImage(file: Blob, maxSide = 1280, quality = 0.85): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * k)
    const h = Math.round(bmp.height * k)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', quality))
  } catch {
    return file
  }
}

export async function addPhoto(file: Blob, pose: ProgressPhoto['pose'], date: ISODate = todayISO()): Promise<void> {
  const blob = await shrinkImage(file)
  await db.photos.add({ id: uid('p'), date, blob, pose, at: Date.now() } as ProgressPhoto)
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id)
}
