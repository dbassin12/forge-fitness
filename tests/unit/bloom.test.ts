import { describe, expect, it } from 'vitest'
import { achievementProgress, BLOOM_ACHIEVEMENTS, EMPTY_STATS, FORGE_ACHIEVEMENTS } from '@/engines/gamification'
import { pickQuests, questDef, questProgress, type QuestFacts } from '@/engines/quests'
import { weekReview } from '@/engines/review'
import { presetRules, reminderLabel } from '@shared/reminder-rules'

/** Bloom's logic that doesn't depend on which app is running (see bloom-mode.test.ts for the rest). */

const facts: QuestFacts = {
  trainingDay: true,
  planDone: false,
  snacks: 0,
  plays: 0,
  activeMinutes: 0,
  protein: 0,
  proteinTarget: 90,
  waterMl: 0,
  waterTargetMl: 2200,
  imperial: true,
  mealsLogged: 0,
  breakfastLogged: false,
  produce: 0,
  tutorials: 0,
  weighedIn: false,
  lite: true,
  weekday: 6,
  daysSinceWeighIn: 12,
  breaths: 0,
  yoga: true,
}

describe('Bloom quests', () => {
  it('pick a practice, a nourishing habit and something calming, with no scales or games', () => {
    for (let d = 1; d <= 28; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`
      const rest = d % 2 === 0
      const ids = pickQuests(date, { ...facts, trainingDay: !rest })
      expect(ids).toHaveLength(3)
      expect(new Set(ids).size).toBe(3)
      expect(ids).not.toContain('weighin')
      expect(ids).not.toContain('play')
      expect(ids).not.toContain('move20')
      expect(ids).not.toContain('breakfast')
      if (rest) expect(['snack', 'breathe']).toContain(ids[0])
      else expect(ids[0]).toBe('workout')
      expect(pickQuests(date, { ...facts, trainingDay: !rest })).toEqual(ids)
    }
  })

  it('use Bloom wording and count breathing sessions', () => {
    expect(questDef('workout', true).title(facts)).toBe('Finish today’s practice')
    expect(questDef('workout', true).emoji).toBe('🧘')
    expect(questDef('snack', true).title(facts)).toBe('Do a 3-minute mini flow')
    expect(questDef('workout').title(facts)).toBe('Finish today’s workout')
    expect(questDef('workout', true).xp).toBe(questDef('workout').xp)
    expect(questProgress('breathe', facts).done).toBe(false)
    expect(questProgress('breathe', { ...facts, breaths: 1 }).done).toBe(true)
  })
})

describe('Bloom badges', () => {
  it('have unique ids, show progress and start locked', () => {
    expect(new Set(BLOOM_ACHIEVEMENTS.map((a) => a.id)).size).toBe(BLOOM_ACHIEVEMENTS.length)
    expect(BLOOM_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(30)
    const yesNo = new Set(['early-bird', 'night-owl'])
    for (const a of BLOOM_ACHIEVEMENTS) {
      expect(a.check(EMPTY_STATS), a.id).toBe(false)
      if (!yesNo.has(a.id)) expect(achievementProgress(a.id, EMPTY_STATS), a.id).not.toBeNull()
    }
  })

  it('reward calm and curiosity instead of reps, records and weigh-ins', () => {
    const ids = BLOOM_ACHIEVEMENTS.map((a) => a.id)
    for (const forgeOnly of ['pushups-100', 'plank-60', 'pr-1', 'weigh-4', 'play-1', 'deck-52', 'real-pushup']) expect(ids).not.toContain(forgeOnly)
    const s = { ...EMPTY_STATS, breaths: 10, mindfulMinutes: 61, bestBalanceSec: 30, poses: 12 }
    const got = BLOOM_ACHIEVEMENTS.filter((a) => a.check(s)).map((a) => a.id)
    expect(got.sort()).toEqual(['balance-30', 'breathe-1', 'breathe-10', 'mindful-60', 'poses-10'])
    expect(achievementProgress('poses-25', s)).toEqual({ value: 12, target: 25 })
    // Forge's list is untouched.
    expect(FORGE_ACHIEVEMENTS.map((a) => a.id)).toContain('pushups-100')
  })
})

describe('Bloom weekly review', () => {
  const base = { weekOf: '2026-09-28', daysPerWeek: 3, food: [], kcalTarget: 1900, proteinTarget: 90, weights: [], yoga: true }
  const done = ['2026-09-28', '2026-09-30', '2026-10-02'].map((date) => ({ date, kind: 'plan', minutes: 20 }))

  it('talks about practices', () => {
    const r = weekReview({ ...base, sessionMinutes: 20, workouts: done })
    expect(r.headline).toBe('Every practice done. What a lovely week!')
    expect(weekReview({ ...base, sessionMinutes: 20, workouts: [] }).headline).toBe('A quiet week. Next week is a fresh start.')
  })

  it('suggests more within 45 minutes, and less after two light weeks', () => {
    const more = weekReview({ ...base, sessionMinutes: 20, workouts: done, lastWeekCompletion: 1 })
    expect(more.suggestion?.options.map((o) => o.label)).toEqual(['Practice 4 days a week', '30-minute practices'])
    const top = weekReview({ ...base, sessionMinutes: 45, workouts: done, lastWeekCompletion: 1 })
    expect(top.suggestion?.options.map((o) => o.sessionMinutes ?? o.daysPerWeek)).toEqual([4])
    const less = weekReview({ ...base, sessionMinutes: 20, workouts: [], lastWeekCompletion: 0.2 })
    expect(less.suggestion?.options.map((o) => o.label)).toEqual(['2 days a week', '15-minute practices'])
  })
})

describe('Bloom reminders', () => {
  it('start without weigh-in nudges, even in coach mode', () => {
    for (const style of ['gentle', 'coach'] as const) {
      const bloom = presetRules(style, { trainingDays: [1, 3, 5], workoutTime: '18:30', app: 'bloom' })
      expect(bloom.find((r) => r.type === 'weighin')?.enabled).toBe(false)
      const forge = presetRules(style, { trainingDays: [1, 3, 5], workoutTime: '18:30' })
      expect(forge.find((r) => r.type === 'weighin')?.enabled).toBe(true)
    }
    expect(presetRules('coach', { trainingDays: [2], workoutTime: '07:00', app: 'bloom' }).filter((r) => r.type !== 'weighin').every((r) => r.enabled)).toBe(true)
  })

  it('have gentle names', () => {
    expect(reminderLabel('workout', 'bloom')).toBe('Practice time')
    expect(reminderLabel('snack', 'bloom')).toBe('Stretch breaks')
    expect(reminderLabel('workout')).toBe('Workout time')
  })
})
