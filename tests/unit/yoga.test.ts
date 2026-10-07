import { describe, expect, it } from 'vitest'
import { getExercise } from '@/data/exercises'
import { DEFAULT_EQUIPMENT, type Ache, type Equipment, type Experience, type Intention } from '@/domain/types'
import {
  generateSession,
  generateSnack,
  generateYogaSession,
  laddersFor,
  LADDERS,
  miniFlowFor,
  programName,
  TEMPLATES,
  upcomingDays,
  YOGA_FIT_SEC,
  YOGA_GAP_SEC,
  YOGA_THEMES,
  yogaRotation,
  type PlanInputs,
  type YogaTemplateId,
} from '@/engines/plan'
import { applyWorkout, initialProgress } from '@/engines/progression/progress'
import { buildSteps } from '@/features/player/steps'

const BLOOM_GEAR: Equipment = { ...DEFAULT_EQUIPMENT, dumbbells: [], mat: true }

const yoga: PlanInputs = {
  goal: 'general_fitness',
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 20,
  aches: [],
  equipment: BLOOM_GEAR,
  quietMode: false,
  bodyWeightKg: 60,
  program: 'yoga',
  intentions: [],
}

const THEMES = Object.keys(YOGA_THEMES) as YogaTemplateId[]
const ids = (s: ReturnType<typeof generateYogaSession>) => s.blocks.flatMap((b) => b.items.map((it) => it.exerciseId))

describe('Bloom weekly rotation', () => {
  it('picks gentle themes in a sensible order', () => {
    expect(yogaRotation(1)).toEqual(['y_morning'])
    expect(yogaRotation(3)).toEqual(['y_morning', 'y_strength', 'y_unwind'])
    expect(yogaRotation(5)).toEqual(['y_morning', 'y_strength', 'y_hips', 'y_back', 'y_unwind'])
    for (let d = 1; d <= 7; d++) expect(yogaRotation(d)).toHaveLength(d)
  })

  it('follows her intentions', () => {
    expect(yogaRotation(3, ['back'])).toContain('y_back')
    expect(yogaRotation(2, ['flexibility'])).toContain('y_hips')
    expect(yogaRotation(2, ['sleep'])).toContain('y_unwind')
    expect(yogaRotation(2, ['strength', 'balance'])).toContain('y_strength')
  })

  it('names the plan and schedules Bloom themes', () => {
    expect(programName({ ...yoga, daysPerWeek: 2, intentions: ['calm'] })).toBe('Morning Flow & Evening Unwind')
    const days = upcomingDays(yoga, [1, 3, 5], 0, '2026-10-05', 3)
    expect(days.map((d) => d.title)).toEqual(['Morning Flow', 'Strength & Balance', 'Evening Unwind'])
  })
})

describe('Bloom practices', () => {
  it('use only Bloom poses, each once, in flowing blocks that end with rest', () => {
    for (const t of THEMES) {
      const s = generateYogaSession(yoga, initialProgress(yoga), { templateId: t })
      const list = ids(s)
      expect(new Set(list).size, t).toBe(list.length)
      for (const id of list) expect(getExercise(id)?.apps, id).toContain('bloom')
      expect(s.blocks.every((b) => b.format === 'flow')).toBe(true)
      expect(s.gapSec).toBe(YOGA_GAP_SEC)
      expect(s.deload).toBe(false)
      const last = s.blocks[s.blocks.length - 1]
      expect(last.kind).toBe('cooldown')
      expect(['savasana', 'easy-seat-breath']).toContain(last.items[last.items.length - 1].exerciseId)
    }
  })

  it('fit the minutes she picked (every theme, length and level)', () => {
    const xps: Experience[] = ['beginner', 'intermediate', 'advanced']
    for (const t of THEMES)
      for (const minutes of [5, 10, 15, 20, 30, 45])
        for (const experience of xps) {
          const inputs = { ...yoga, sessionMinutes: minutes, experience }
          const s = generateYogaSession(inputs, initialProgress(inputs), { templateId: t })
          expect(Math.abs(s.estSec - minutes * 60), `${t} ${minutes} min ${experience}: ${Math.round(s.estSec)} s`).toBeLessThanOrEqual(YOGA_FIT_SEC)
        }
  })

  it('stay gentle: never longer than three quarters of an hour', () => {
    const s = generateYogaSession({ ...yoga, sessionMinutes: 90 }, initialProgress(yoga))
    expect(s.minutes).toBe(45)
    expect(s.express).toBe(false)
  })

  it('express versions keep the most important poses', () => {
    const full = generateYogaSession(yoga, initialProgress(yoga), { templateId: 'y_morning' })
    const quick = generateYogaSession(yoga, initialProgress(yoga), { templateId: 'y_morning', minutes: 5 })
    expect(quick.express).toBe(true)
    expect(quick.title).toBe('Morning Flow · Express')
    expect(ids(quick).length).toBeLessThan(ids(full).length)
    expect(ids(quick)).toContain(ids(full).find((id) => getExercise(id)?.pattern === 'flow'))
  })

  it('leave out poses that a pregnancy or sore knees should skip', () => {
    const cases: Ache[][] = [['pregnancy'], ['knees'], ['wrists'], ['pregnancy', 'knees', 'wrists', 'lower_back']]
    for (const aches of cases) {
      const inputs = { ...yoga, aches, experience: 'advanced' as const }
      for (const t of THEMES)
        for (let index = 0; index < 4; index++) {
          const s = generateYogaSession(inputs, initialProgress(inputs), { templateId: t, index })
          for (const id of ids(s)) {
            const avoid = getExercise(id)?.avoidIf ?? []
            expect(avoid.some((a) => aches.includes(a)), `${aches.join('+')} ${t}: ${id}`).toBe(false)
          }
          expect(ids(s).length).toBeGreaterThan(2)
        }
    }
  })

  it('only uses the chair and wall when they are there', () => {
    const bare = { ...yoga, equipment: { ...BLOOM_GEAR, chair: false, wall: false }, experience: 'intermediate' as const }
    for (const t of THEMES)
      for (let index = 0; index < 5; index++) {
        const s = generateYogaSession(bare, initialProgress(bare), { templateId: t, index })
        expect(ids(s)).not.toContain('warrior-3-chair')
        expect(ids(s)).not.toContain('legs-up-the-wall')
      }
  })

  it('go through the generic generator when the profile is a yoga one', () => {
    const s = generateSession(yoga, initialProgress(yoga))
    expect(s.focus).toBe('yoga')
    expect(TEMPLATES[s.templateId].focus).toBe('yoga')
  })

  it('play in the workout player with short transitions', () => {
    const s = generateYogaSession(yoga, initialProgress(yoga), { templateId: 'y_hips' })
    const steps = buildSteps(s)
    const blockRests = steps.filter((st) => st.kind === 'rest' && st.reason === 'block')
    expect(blockRests.length).toBe(s.blocks.length - 1)
    for (const r of blockRests) expect(r.kind === 'rest' && r.seconds).toBe(YOGA_GAP_SEC)
  })
})

describe('Bloom progression', () => {
  it('lengthens holds when she holds the full time, and never adds strength modifiers', () => {
    const progress = initialProgress(yoga)
    const s = generateYogaSession(yoga, progress, { templateId: 'y_strength' })
    const main = s.blocks.filter((b) => b.kind === 'main').flatMap((b) => b.items)
    const held = main.filter((it) => it.target.kind === 'time')
    expect(held.length).toBeGreaterThan(0)
    const exercises = main.map((it) => ({
      exerciseId: it.exerciseId,
      ladder: it.ladder,
      target: it.target,
      sets: [it.target.kind === 'time' ? it.target.seconds : it.target.reps],
    }))
    const ctx = { av: { chair: true, wall: true, table: false, stairs: false }, aches: [], quietMode: false, program: 'yoga' as const }
    let state = progress
    const all: string[] = []
    for (let k = 0; k < 12; k++) {
      const r = applyWorkout(state, { date: '2026-10-07', planned: true, feedback: 'easy', exercises }, ctx)
      state = r.state
      all.push(...r.changes.map((c) => c.kind))
    }
    expect(all).toContain('goal_up')
    expect(all).not.toContain('modifier_on')
    const first = held[0]
    expect(state.exercises[first.exerciseId].goal).toBeGreaterThan(first.target.kind === 'time' ? first.target.seconds : 0)
  })

  it('has yoga ladders that only Bloom uses', () => {
    const y = laddersFor('yoga')
    expect(y.length).toBe(7)
    for (const id of y) for (const ex of LADDERS[id].exercises) expect(getExercise(ex)?.apps, ex).toContain('bloom')
    expect(laddersFor('strength').some((id) => id.startsWith('y_'))).toBe(false)
  })
})

describe('mini flows', () => {
  it('match the time of day and fit the minutes', () => {
    expect(miniFlowFor(8)).toBe('wake')
    expect(miniFlowFor(14)).toBe('desk')
    expect(miniFlowFor(21)).toBe('unwind')
    for (const hour of [8, 14, 21])
      for (const minutes of [3, 5]) {
        const s = generateSnack(yoga, minutes, 0, hour)
        expect(s.focus).toBe('yoga')
        expect(s.blocks[0].items.length).toBeGreaterThanOrEqual(3)
        expect(Math.abs(s.estSec - minutes * 60), `${hour}h ${minutes} min`).toBeLessThanOrEqual(75)
      }
  })

  it('respect intentions-free defaults', () => {
    const intentions: Intention[] = []
    expect(generateSnack({ ...yoga, intentions }, 3, 1).title).toMatch(/minute/)
  })
})
