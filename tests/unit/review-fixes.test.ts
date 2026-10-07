import { beforeEach, describe, expect, it } from 'vitest'
import { useCelebrate } from '@/app/celebrate'
import { usePrefs } from '@/app/prefs'
import { db } from '@/db/db'
import { DEFAULT_EQUIPMENT, type Profile } from '@/domain/types'
import { EMPTY_STATS } from '@/engines/gamification'
import { planInputsFromProfile } from '@/engines/plan'
import { initialProgress } from '@/engines/progression/progress'
import { wipeAll } from '@/state/backup'
import { unlockAchievements } from '@/state/gamification'
import { logPlay } from '@/state/play'
import { loadRecap } from '@/state/recap'

const profile: Profile = {
  name: 'Test',
  sex: 'male',
  birthYear: 1990,
  heightCm: 178,
  weightKg: 80,
  goal: 'general_fitness',
  experience: 'beginner',
  lifestyle: 'light',
  units: 'imperial',
  aches: [],
  diet: 'none',
  avoidFoods: [],
  daysPerWeek: 3,
  trainingDays: [1, 3, 5],
  sessionMinutes: 15,
  preferredTime: '07:00',
  equipment: DEFAULT_EQUIPMENT,
  trackingMode: 'full',
  reminderStyle: 'gentle',
  createdAt: '2026-09-01T00:00:00Z',
}
const inputs = planInputsFromProfile(profile)
const plan = { profile, progress: initialProgress(inputs), inputs, swaps: null }

describe('fixes from the code review', () => {
  beforeEach(async () => {
    await wipeAll()
  })

  it('pays an achievement once even when two checks race', async () => {
    const stats = { ...EMPTY_STATS, workouts: 1 }
    const [a, b] = await Promise.all([unlockAchievements(stats), unlockAchievements(stats)])
    expect(a.length + b.length).toBe(1)
    expect(await db.xpEvents.where('kind').equals('achievement').count()).toBe(1)
  })

  it('puts a badge earned on a Monday morning in that week’s recap', async () => {
    await db.achievements.put({ id: 'first-rep', unlockedAt: new Date(2026, 9, 5, 8, 0).getTime() }) // Mon 5 Oct, 08:00
    expect((await loadRecap(plan, '2026-10-05')).badges.map((b) => b.id)).toEqual(['first-rep'])
    expect((await loadRecap(plan, '2026-09-28')).badges).toEqual([])
  })

  it('logs only the time spent moving when a game says so', async () => {
    await logPlay({ key: 'wheel', title: 'Spin the wheel', startedAt: Date.now() - 25 * 60_000, activeMs: 90_000, profile, exercises: [], xp: 10 })
    const [w] = await db.workouts.toArray()
    expect((w.finishedAt - w.startedAt) / 60_000).toBeCloseTo(1.5)
  })

  it('shows celebrations as small notes when they are switched off', () => {
    useCelebrate.setState({ queue: [], toasts: [] })
    usePrefs.getState().update({ celebrations: false })
    useCelebrate.getState().push({ kind: 'level', level: 3, title: 'Spark', unlocks: [], gear: [{ id: 'headband', name: 'Sweatband' }] })
    expect(useCelebrate.getState().queue).toHaveLength(0)
    expect(useCelebrate.getState().toasts[0]).toMatchObject({ title: 'Level up! You’re level 3', text: 'New gear for Ember: Sweatband' })
    usePrefs.getState().update({ celebrations: true })
    useCelebrate.getState().push({ kind: 'pb', title: 'Plank hold: 1:05', text: 'First record', emoji: '🧱' })
    expect(useCelebrate.getState().queue).toHaveLength(1)
  })
})
