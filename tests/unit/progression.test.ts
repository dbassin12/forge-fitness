import { describe, expect, it } from 'vitest'
import { DEFAULT_EQUIPMENT, type Equipment } from '@/domain/types'
import { FIT_TOLERANCE_SEC, generateSession, LADDERS, mainExercises, planContext, type PlanInputs, type Target } from '@/engines/plan'
import {
  applyTest,
  applyWorkout,
  emptyProgress,
  HYSTERESIS,
  initialProgress,
  type PerformedExercise,
  type WorkoutResult,
} from '@/engines/progression/progress'

const base: PlanInputs = {
  goal: 'build_muscle',
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 15,
  aches: [],
  equipment: DEFAULT_EQUIPMENT,
  quietMode: false,
  bodyWeightKg: 80,
}

const reps = (r: number, min: number, max: number): Target => ({ kind: 'reps', reps: r, min, max })
const secs = (s: number, min: number, max: number): Target => ({ kind: 'time', seconds: s, min, max })

function workout(exercises: PerformedExercise[], extra: Partial<WorkoutResult> = {}): WorkoutResult {
  return { date: '2026-10-05', planned: true, exercises, ...extra }
}

describe('starting levels', () => {
  it('come from experience when there is no test', () => {
    const b = initialProgress({ experience: 'beginner' })
    const a = initialProgress({ experience: 'advanced' })
    expect(b.ladders.h_push.rung).toBe(LADDERS.h_push.start[0])
    expect(a.ladders.h_push.rung).toBe(LADDERS.h_push.start[2])
    expect(a.ladders.squat.rung).toBeGreaterThan(b.ladders.squat.rung)
  })

  it('come from the fitness test when available', () => {
    const s = initialProgress({ experience: 'beginner' }, { date: '2026-10-02', pushups: 10, squats60: 50, plankSec: 30 })
    expect(LADDERS.h_push.exercises[s.ladders.h_push.rung]).toBe('pushup')
    expect(s.exercises.pushup.goal).toBe(6)
    expect(LADDERS.squat.exercises[s.ladders.squat.rung]).toBe('goblet-squat')
    expect(LADDERS.core_ext.exercises[s.ladders.core_ext.rung]).toBe('forearm-plank')
    expect(s.exercises['forearm-plank'].goal).toBe(20)
    expect(s.tests).toHaveLength(1)

    const weak = applyTest(emptyProgress(), { date: '2026-10-02', pushups: 0, squats60: 10, plankSec: 10 })
    expect(LADDERS.h_push.exercises[weak.ladders.h_push.rung]).toBe('incline-pushup')
    expect(LADDERS.squat.exercises[weak.ladders.squat.rung]).toBe('box-squat')
    expect(LADDERS.core_ext.exercises[weak.ladders.core_ext.rung]).toBe('knee-plank')
  })
})

describe('double progression', () => {
  it('adds a rep when every set hits the goal', () => {
    const { state, changes } = applyWorkout(emptyProgress(), workout([{ exerciseId: 'pushup', ladder: 'h_push', target: reps(8, 8, 12), sets: [8, 8, 9] }]))
    expect(state.exercises.pushup.goal).toBe(9)
    expect(changes[0].kind).toBe('goal_up')
    expect(state.sessionsCompleted).toBe(1)
  })

  it('adds 5 seconds to holds', () => {
    const { state } = applyWorkout(emptyProgress(), workout([{ exerciseId: 'forearm-plank', ladder: 'core_ext', target: secs(30, 20, 60), sets: [30, 32] }]))
    expect(state.exercises['forearm-plank'].goal).toBe(35)
  })

  it('jumps two reps when it felt easy and there was room to spare', () => {
    const { state } = applyWorkout(
      emptyProgress(),
      workout([{ exerciseId: 'pushup', ladder: 'h_push', target: reps(8, 8, 12), sets: [11, 10, 10], rating: 'easy' }]),
    )
    expect(state.exercises.pushup.goal).toBe(10)
  })

  it('advances to the next rung after two sessions at the top of the range', () => {
    let s = emptyProgress()
    s.ladders.h_push.rung = 3
    const top = () => workout([{ exerciseId: 'pushup', ladder: 'h_push', target: reps(12, 8, 12), sets: [12, 12, 12] }])
    let r = applyWorkout(s, top())
    expect(r.state.ladders.h_push.rung).toBe(3)
    r = applyWorkout(r.state, top())
    expect(LADDERS.h_push.exercises[r.state.ladders.h_push.rung]).toBe('diamond-pushup')
    expect(r.changes.some((c) => c.kind === 'advance')).toBe(true)
    s = r.state
    // Cool-off: an immediate second advance is blocked…
    r = applyWorkout(s, workout([{ exerciseId: 'diamond-pushup', ladder: 'h_push', target: reps(12, 8, 12), sets: [12, 12] }], { feedback: 'easy' }))
    expect(r.state.ladders.h_push.rung).toBe(4)
    // …until the hysteresis window has passed.
    for (let i = 0; i < HYSTERESIS; i++) r = applyWorkout(r.state, workout([{ exerciseId: 'diamond-pushup', ladder: 'h_push', target: reps(12, 8, 12), sets: [12, 12] }], { feedback: 'easy' }))
    expect(r.state.ladders.h_push.rung).toBe(5)
  })

  it('skips rungs the user cannot do', () => {
    const s = emptyProgress()
    s.ladders.h_pull.rung = 2
    const noChair: Equipment = { ...DEFAULT_EQUIPMENT, chair: false }
    const ctx = planContext({ equipment: noChair, aches: [], quietMode: false })
    const top = workout([{ exerciseId: 'db-bent-row', ladder: 'h_pull', target: reps(12, 8, 12), sets: [12, 12, 12] }], { feedback: 'easy' })
    const r = applyWorkout(s, top, ctx)
    // One-arm row needs a chair; table rows need a table → renegade row.
    expect(LADDERS.h_pull.exercises[r.state.ladders.h_pull.rung]).toBe('renegade-row')
  })

  it('adds tempo, pauses, 1½ reps then an extra set at the top of a ladder', () => {
    let s = emptyProgress()
    s.ladders.h_push.rung = LADDERS.h_push.exercises.length - 1
    const seen: string[] = []
    for (let i = 0; i < 12; i++) {
      const goal = s.exercises['decline-pushup']?.goal ?? 12
      const r = applyWorkout(s, workout([{ exerciseId: 'decline-pushup', ladder: 'h_push', target: reps(Math.max(goal, 12), 8, 12), sets: [12, 12, 12] }], { feedback: 'easy' }))
      s = r.state
      for (const c of r.changes) seen.push(c.kind)
    }
    expect(seen.filter((k) => k === 'modifier_on')).toHaveLength(4)
    expect(s.exercises['decline-pushup'].modifierStage).toBe(4)
  })

  it('treats a swapped-in exercise like the top of a ladder', () => {
    const r = applyWorkout(emptyProgress(), workout([{ exerciseId: 'db-floor-press', ladder: 'h_push', target: reps(15, 8, 15), sets: [15, 15, 15] }], { feedback: 'easy' }))
    expect(r.state.exercises['db-floor-press'].modifierStage).toBe(1)
    expect(r.state.ladders.h_push.rung).toBe(0)
  })

  it('backs off after clear misses, removing modifiers first and regressing last', () => {
    let s = emptyProgress()
    s.ladders.h_push.rung = 3
    s.exercises.pushup = { goal: 10, topStreak: 0, failStreak: 0, modifierStage: 1, best: 12 }
    const miss = (goal: number) => workout([{ exerciseId: 'pushup', ladder: 'h_push', target: reps(goal, 8, 12), sets: [5, 4, 4] }])
    let r = applyWorkout(s, miss(10))
    expect(r.state.exercises.pushup.modifierStage).toBe(0)
    r = applyWorkout(r.state, miss(10))
    expect(r.state.exercises.pushup.goal).toBe(8)
    r = applyWorkout(r.state, miss(8))
    expect(r.state.ladders.h_push.rung).toBe(2)
    expect(r.changes.some((c) => c.kind === 'regress')).toBe(true)
    s = r.state
    expect(s.ladders.h_push.changedAt).toBe(s.sessionsCompleted)
  })

  it('holds steady when the goal was hit but it felt too hard', () => {
    const { state, changes } = applyWorkout(emptyProgress(), workout([{ exerciseId: 'pushup', ladder: 'h_push', target: reps(8, 8, 12), sets: [8, 8, 8] }], { feedback: 'hard' }))
    expect(state.exercises.pushup.goal).toBe(8)
    expect(changes.filter((c) => c.kind !== 'pr')).toHaveLength(0)
  })

  it('records personal bests but leaves the plan alone on deload weeks and snacks', () => {
    let s = applyWorkout(emptyProgress(), workout([{ exerciseId: 'pushup', ladder: 'h_push', target: reps(8, 8, 12), sets: [8, 8] }])).state
    const r = applyWorkout(s, workout([{ exerciseId: 'pushup', ladder: 'h_push', target: reps(9, 8, 12), sets: [14, 9] }], { deload: true }))
    expect(r.changes.map((c) => c.kind)).toEqual(['pr'])
    expect(r.state.exercises.pushup.best).toBe(14)
    expect(r.state.exercises.pushup.goal).toBe(9)
    s = applyWorkout(r.state, workout([{ exerciseId: 'pushup', target: reps(9, 8, 12), sets: [12] }], { planned: false })).state
    expect(s.sessionsCompleted).toBe(r.state.sessionsCompleted)
  })
})

describe('simulated months of training', () => {
  it('climbs steadily for a consistent user while every session still fits the time budget', () => {
    const inputs = { ...base, sessionMinutes: 20 }
    const ctx = planContext(inputs)
    let s = initialProgress(inputs)
    const startRungs = Object.fromEntries(Object.entries(s.ladders).map(([k, v]) => [k, v.rung]))
    for (let n = 0; n < 36; n++) {
      const session = generateSession(inputs, s)
      expect(Math.abs(session.estSec - session.minutes * 60)).toBeLessThanOrEqual(FIT_TOLERANCE_SEC)
      const performed: PerformedExercise[] = session.blocks
        .filter((b) => b.kind === 'main')
        .flatMap((b) =>
          b.items.map((it) => {
            const v = it.target.kind === 'time' ? it.target.seconds : it.target.reps
            return { exerciseId: it.exerciseId, ladder: it.ladder, target: it.target, sets: Array.from({ length: b.rounds }, () => v) }
          }),
        )
      s = applyWorkout(s, { date: '2026-10-05', planned: true, deload: session.deload, exercises: performed }, ctx).state
      for (const [k, v] of Object.entries(s.ladders)) expect(v.rung).toBeGreaterThanOrEqual(startRungs[k] - 0)
    }
    expect(s.sessionsCompleted).toBe(36)
    const climbed = Object.entries(s.ladders).filter(([k, v]) => v.rung > startRungs[k])
    expect(climbed.length).toBeGreaterThanOrEqual(4)
    expect(mainExercises(generateSession(inputs, s)).length).toBeGreaterThan(0)
  })
})
