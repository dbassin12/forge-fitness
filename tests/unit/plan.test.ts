import { describe, expect, it } from 'vitest'
import { EXERCISES, getExercise } from '@/data/exercises'
import { DEFAULT_EQUIPMENT, type Ache, type Equipment, type Experience, type Goal } from '@/domain/types'
import {
  alternativesFor,
  availability,
  blockSeconds,
  describeTarget,
  FIT_TOLERANCE_SEC,
  generateSession,
  generateSnack,
  isAllowed,
  LADDER_IDS,
  LADDERS,
  mainExercises,
  planContext,
  rangeFor,
  repSeconds,
  resolveLadder,
  SCHEMES,
  sessionSeconds,
  splitFor,
  TEMPLATES,
  upcomingDays,
  type PlanInputs,
  type TemplateId,
} from '@/engines/plan'
import { initialProgress } from '@/engines/progression/progress'

const NO_GEAR: Equipment = { dumbbells: [], chair: false, wall: true, table: false, stairs: false, pullupBar: false, mat: false }
const ALL_GEAR: Equipment = {
  dumbbells: [
    { id: 'a', weightLb: 20, count: 2, found: true },
    { id: 'b', weightLb: 25, count: 1, found: true },
  ],
  chair: true,
  wall: true,
  table: true,
  stairs: true,
  pullupBar: false,
  mat: true,
}

const base: PlanInputs = {
  goal: 'general_fitness',
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 15,
  aches: [],
  equipment: DEFAULT_EQUIPMENT,
  quietMode: false,
  bodyWeightKg: 80,
}

/** Small deterministic PRNG so the property test samples the same combos every run. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)]

describe('ladders', () => {
  it('reference real exercises, ordered by difficulty, in the right pattern', () => {
    const patternOf: Record<string, string[]> = {
      h_push: ['h_push'],
      v_push: ['v_push'],
      h_pull: ['h_pull'],
      v_pull: ['v_pull'],
      squat: ['squat'],
      lunge: ['lunge'],
      hinge: ['hinge'],
      bridge: ['bridge'],
      core_ext: ['core'],
      core_lat: ['core'],
      core_flex: ['core'],
      cond: ['cond'],
      biceps: ['arms'],
      triceps: ['arms'],
      y_flow: ['flow'],
      y_standing: ['standing'],
      y_balance: ['balance'],
      y_hip: ['hip', 'mobility'],
      y_fold: ['fold'],
      y_back: ['backbend', 'mobility'],
      y_core: ['core'],
    }
    for (const id of LADDER_IDS) {
      const L = LADDERS[id]
      expect(L.id).toBe(id)
      let prev = 0
      for (const exId of L.exercises) {
        const ex = getExercise(exId)
        expect(ex, `${id}: ${exId}`).toBeDefined()
        expect(ex!.level, `${id}: ${exId} level`).toBeGreaterThanOrEqual(prev)
        expect(patternOf[id]).toContain(ex!.pattern)
        prev = ex!.level
      }
      for (const s of L.start) expect(s).toBeLessThan(L.exercises.length)
      expect(new Set(L.exercises).size).toBe(L.exercises.length)
    }
  })

  it('have a bodyweight option for every movement except the dumbbell-only arm ladders', () => {
    for (const id of LADDER_IDS) {
      if (id === 'biceps' || id === 'triceps') continue
      const bw = LADDERS[id].exercises.some((x) => getExercise(x)!.equipment.every((e) => e === 'wall'))
      expect(bw, id).toBe(true)
    }
  })

  it('resolve to the hardest allowed rung at or below the current one', () => {
    const ctx = planContext({ equipment: NO_GEAR, aches: [], quietMode: false })
    // Rung 3 = one-arm row (needs a dumbbell and chair) → falls back to the reverse snow angel.
    expect(resolveLadder('h_pull', 3, ctx)?.exerciseId).toBe('reverse-snow-angel')
    // Overhead press with no dumbbells → moves up to pike push-ups instead of skipping.
    expect(resolveLadder('v_push', 0, ctx)?.exerciseId).toBe('pike-pushup')
    const full = planContext({ equipment: ALL_GEAR, aches: [], quietMode: false })
    expect(resolveLadder('h_pull', 5, full)?.exerciseId).toBe('table-row')
    // Aches: wrists + shoulders remove every pike / handstand variation.
    const sore = planContext({ equipment: NO_GEAR, aches: ['wrists', 'shoulders'], quietMode: false })
    expect(resolveLadder('v_push', 4, sore)).toBeUndefined()
  })

  it('rotate cardio for variety without repeating within a session', () => {
    const ctx = planContext(base)
    const seen = new Set<string>()
    for (let v = 0; v < 6; v++) seen.add(resolveLadder('cond', 6, ctx, { variant: v })!.exerciseId)
    expect(seen.size).toBeGreaterThan(1)
    const excl = new Set(['high-knees'])
    for (let v = 0; v < 6; v++) expect(resolveLadder('cond', 6, ctx, { variant: v, exclude: excl })!.exerciseId).not.toBe('high-knees')
  })
})

describe('templates and splits', () => {
  it('use known ladders', () => {
    for (const t of Object.values(TEMPLATES)) {
      // Yoga themes list only the ladders they progress on; their full sequences live in yoga.ts.
      expect(t.slots.length).toBeGreaterThanOrEqual(t.focus === 'yoga' ? 1 : 4)
      for (const s of t.slots) expect(LADDER_IDS).toContain(s.ladder)
      expect(t.slots.some((s) => s.priority === 1)).toBe(true)
    }
  })

  it('pick a sensible rotation for each schedule', () => {
    expect(splitFor(2, 30)).toEqual(['full_a', 'full_b'])
    expect(splitFor(3, 45)).toEqual(['full_a', 'full_b', 'full_c'])
    expect(splitFor(5, 15)).toEqual(['full_a', 'full_b', 'full_c'])
    expect(splitFor(4, 30)).toEqual(['upper_a', 'lower_a', 'upper_b', 'lower_b'])
    expect(splitFor(5, 30)).toContain('cond_core')
    for (let d = 1; d <= 7; d++) for (const m of [5, 15, 30, 60]) expect(splitFor(d, m).length).toBeGreaterThanOrEqual(2)
  })
})

describe('equipment and limits', () => {
  it('treats unfound dumbbells as unavailable but remembers the heavier one', () => {
    const av = availability(DEFAULT_EQUIPMENT)
    expect(av.pairLb).toBe(20)
    expect(av.heavyLb).toBe(20)
    expect(av.missingHeavyLb).toBe(25)
    const found = availability(ALL_GEAR)
    expect(found.heavyLb).toBe(25)
    expect(found.missingHeavyLb).toBeUndefined()
    expect(availability(NO_GEAR).pairLb).toBeUndefined()
    const single = availability({ ...NO_GEAR, dumbbells: [{ id: 'x', weightLb: 25, count: 1, found: true }] })
    expect(single.pairLb).toBeUndefined()
    expect(single.heavyLb).toBe(25)
  })

  it('honours aches and quiet mode', () => {
    const quiet = planContext({ equipment: ALL_GEAR, aches: [], quietMode: true })
    expect(isAllowed(getExercise('burpee')!, quiet)).toBe(false)
    expect(isAllowed(getExercise('step-back-burpee')!, quiet)).toBe(true)
    const knees = planContext({ equipment: ALL_GEAR, aches: ['knees'], quietMode: false })
    expect(isAllowed(getExercise('jump-lunge')!, knees)).toBe(false)
    expect(isAllowed(getExercise('box-squat')!, knees)).toBe(true)
  })

  it('narrows rep ranges toward the goal without leaving the exercise range', () => {
    for (const goal of Object.keys(SCHEMES) as Goal[]) {
      for (const p of [1, 2, 3, 4] as const) {
        for (const ex of EXERCISES) {
          const [lo, hi] = rangeFor(ex, SCHEMES[goal][p])
          expect(lo).toBeGreaterThanOrEqual(ex.range[0])
          expect(hi).toBeLessThanOrEqual(ex.range[1])
          expect(hi).toBeGreaterThanOrEqual(lo)
        }
      }
    }
  })

  it('times reps from the animation tempo', () => {
    for (const ex of EXERCISES) {
      const s = repSeconds(ex.id)
      expect(s, ex.id).toBeGreaterThanOrEqual(1)
      expect(s, ex.id).toBeLessThanOrEqual(12)
    }
  })
})

describe('session generator', () => {
  const GOALS: Goal[] = ['lose_fat', 'build_muscle', 'get_stronger', 'general_fitness']
  const XPS: Experience[] = ['beginner', 'intermediate', 'advanced']
  const GEAR = [DEFAULT_EQUIPMENT, NO_GEAR, ALL_GEAR]
  const ACHES: Ache[][] = [[], ['knees'], ['wrists', 'shoulders'], ['knees', 'lower_back', 'shoulders', 'wrists']]
  const MINUTES = [5, 7, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60]

  function check(inputs: PlanInputs, index: number) {
    const progress = initialProgress(inputs)
    const s = generateSession(inputs, progress, { index })
    const label = JSON.stringify({ ...inputs, equipment: undefined, index })
    expect(Math.abs(s.estSec - s.minutes * 60), `${label} est ${s.estSec}`).toBeLessThanOrEqual(FIT_TOLERANCE_SEC)
    expect(s.estSec).toBe(sessionSeconds(s.blocks))
    expect(s.estKcal).toBeGreaterThan(0)
    const ctx = planContext(inputs)
    const main = mainExercises(s)
    expect(main.length, label).toBeGreaterThan(0)
    expect(new Set(main.map((m) => m.exerciseId)).size, label).toBe(main.length)
    for (const b of s.blocks) {
      expect(b.items.length).toBeGreaterThan(0)
      expect(b.rounds).toBeGreaterThanOrEqual(1)
      expect(blockSeconds(b)).toBeGreaterThan(0)
      for (const it of b.items) {
        const ex = getExercise(it.exerciseId)!
        expect(isAllowed(ex, ctx), `${label} ${it.exerciseId}`).toBe(true)
        expect(it.workSec).toBeGreaterThan(0)
        expect(describeTarget(it)).toMatch(/\d/)
        if (b.kind === 'main' && it.target.kind === 'reps') {
          expect(it.target.reps).toBeGreaterThanOrEqual(it.target.min)
          expect(it.target.reps).toBeLessThanOrEqual(it.target.max)
        }
      }
    }
    return s
  }

  it("fits David's default plan for every session length", () => {
    for (const minutes of MINUTES)
      for (let days = 1; days <= 7; days++) for (let index = 0; index < 8; index++) check({ ...base, sessionMinutes: minutes, daysPerWeek: days }, index)
  })

  it('fits any profile within ±1 minute (sampled property test)', () => {
    const r = rng(20261002)
    for (let n = 0; n < 900; n++) {
      check(
        {
          goal: pick(r, GOALS),
          experience: pick(r, XPS),
          daysPerWeek: 1 + Math.floor(r() * 7),
          sessionMinutes: pick(r, MINUTES),
          aches: pick(r, ACHES),
          equipment: pick(r, GEAR),
          quietMode: r() < 0.3,
          bodyWeightKg: 55 + r() * 60,
        },
        Math.floor(r() * 40),
      )
    }
  })

  it('is deterministic', () => {
    const p = initialProgress(base)
    expect(generateSession(base, p, { index: 4 })).toEqual(generateSession(base, p, { index: 4 }))
  })

  it('follows the rolling queue and lightens every 4th week', () => {
    const p = initialProgress(base)
    const ids: TemplateId[] = [0, 1, 2, 3].map((i) => generateSession(base, p, { index: i }).templateId)
    expect(ids).toEqual(['full_a', 'full_b', 'full_c', 'full_a'])
    const week4 = generateSession({ ...base, sessionMinutes: 30 }, p, { index: 9 })
    expect(week4.mesoWeek).toBe(3)
    expect(week4.deload).toBe(true)
    expect(week4.minutes).toBeLessThan(30)
    expect(week4.title).toContain('Deload')
  })

  it('shrinks a session on demand ("short on time")', () => {
    const p = initialProgress(base)
    const full = generateSession({ ...base, sessionMinutes: 30 }, p, { index: 0 })
    const quick = generateSession({ ...base, sessionMinutes: 30 }, p, { index: 0, minutes: 10 })
    expect(quick.express).toBe(true)
    expect(quick.estSec).toBeLessThan(full.estSec)
    expect(Math.abs(quick.estSec - 600)).toBeLessThanOrEqual(FIT_TOLERANCE_SEC)
  })

  it('applies one-off and sticky swaps', () => {
    const p = initialProgress(base)
    const swapped = generateSession(base, p, { index: 0, swaps: { 1: 'knee-pushup' } })
    expect(mainExercises(swapped).map((m) => m.exerciseId)).toContain('knee-pushup')
    const sticky = generateSession(base, { ...p, preferred: { h_push: 'db-floor-press' } }, { index: 0 })
    expect(mainExercises(sticky).map((m) => m.exerciseId)).toContain('db-floor-press')
  })

  it('uses a slower tempo note while the heavier dumbbell is missing', () => {
    const p = initialProgress(base)
    p.ladders.squat.rung = 3 // goblet squat (heavy dumbbell)
    const s = generateSession({ ...base, sessionMinutes: 30 }, p, { index: 0 })
    const goblet = mainExercises(s).find((m) => m.exerciseId === 'goblet-squat')!
    expect(goblet.loadLb).toBe(20)
    expect(goblet.notes.join(' ')).toMatch(/heavier/)
  })

  it('suggests swaps that the user can actually do', () => {
    const ctx = planContext({ equipment: NO_GEAR, aches: ['wrists'], quietMode: false })
    const alts = alternativesFor('pushup', ctx, 'h_push')
    expect(alts.length).toBeGreaterThan(0)
    for (const a of alts) {
      expect(a.id).not.toBe('pushup')
      expect(isAllowed(a, ctx)).toBe(true)
    }
  })

  it('makes short movement snacks', () => {
    for (const m of [2, 3, 5]) {
      const s = generateSnack(base, m, m)
      expect(s.blocks.length).toBe(1)
      expect(s.estSec).toBeGreaterThan(60)
      expect(s.estSec).toBeLessThanOrEqual(m * 60 + 120)
    }
  })

  it('projects the queue onto training days', () => {
    const days = upcomingDays(base, [1, 3, 5], 0, '2026-10-05', 5) // a Monday
    expect(days.map((d) => d.date)).toEqual(['2026-10-05', '2026-10-07', '2026-10-09', '2026-10-12', '2026-10-14'])
    expect(days.map((d) => d.templateId)).toEqual(['full_a', 'full_b', 'full_c', 'full_a', 'full_b'])
  })
})
