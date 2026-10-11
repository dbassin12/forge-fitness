import { describe, expect, it } from 'vitest'
import { EXERCISES, getExercise } from '@/data/exercises'
import { DEFAULT_EQUIPMENT, type Profile } from '@/domain/types'
import {
  alternativesFor,
  FIT_TOLERANCE_SEC,
  generateSession,
  generateSnack,
  isAllowed,
  LADDERS,
  planContext,
  planInputsFromProfile,
  resolveSlot,
  sessionSeconds,
  type PlanInputs,
  type PlannedSession,
} from '@/engines/plan'
import { deckPlan, wheelSlices } from '@/engines/play'
import { applyWorkout, initialProgress } from '@/engines/progression/progress'

const base: PlanInputs = {
  goal: 'general_fitness',
  experience: 'intermediate',
  daysPerWeek: 3,
  sessionMinutes: 30,
  aches: [],
  equipment: DEFAULT_EQUIPMENT,
  quietMode: false,
  bodyWeightKg: 80,
}

const idsIn = (s: PlannedSession) => s.blocks.flatMap((b) => b.items.map((it) => it.exerciseId))

describe('skipped exercises', () => {
  it('come from the profile and rule an exercise out', () => {
    const profile = { excludedExercises: ['burpee', 'pushup'] } as Partial<Profile> as Profile
    const inputs = planInputsFromProfile({ ...profile, aches: [], equipment: DEFAULT_EQUIPMENT } as Profile)
    expect(inputs.excluded).toEqual(['burpee', 'pushup'])
    const ctx = planContext(inputs)
    expect(isAllowed(getExercise('pushup')!, ctx)).toBe(false)
    expect(isAllowed(getExercise('knee-pushup')!, ctx)).toBe(true)
    // Profiles from before this setting existed behave exactly as before.
    expect(planInputsFromProfile({ aches: [], equipment: DEFAULT_EQUIPMENT } as unknown as Profile).excluded).toEqual([])
  })

  it('never show up anywhere in a session, and sessions still fit their time', () => {
    // A popular mix of dislikes: burpees, the push-up and squat staples, two warm-up moves and a stretch.
    const excluded = ['burpee', 'pushup', 'knee-pushup', 'bodyweight-squat', 'inchworm', 'worlds-greatest-stretch', 'childs-pose', 'jumping-jacks', 'step-jacks']
    for (const goal of ['build_muscle', 'lose_fat', 'get_stronger'] as const) {
      for (const minutes of [5, 10, 15, 20, 30, 45, 60]) {
        for (let index = 0; index < 8; index++) {
          const inputs = { ...base, goal, sessionMinutes: minutes, excluded }
          const s = generateSession(inputs, initialProgress(inputs), { index })
          const ids = idsIn(s)
          for (const id of excluded) expect(ids, `${goal} ${minutes} min #${index}`).not.toContain(id)
          expect(ids.length).toBeGreaterThan(0)
          expect(Math.abs(sessionSeconds(s.blocks) - s.minutes * 60)).toBeLessThanOrEqual(FIT_TOLERANCE_SEC)
        }
      }
    }
  })

  it('ignore a swap or "always use this" choice that was later skipped', () => {
    const inputs = { ...base, excluded: ['db-floor-press'] }
    const progress = { ...initialProgress(inputs), preferred: { h_push: 'db-floor-press' } }
    const s = generateSession(inputs, progress, { index: 0, swaps: { 0: 'db-floor-press' } })
    expect(idsIn(s)).not.toContain('db-floor-press')
  })

  it('fall back to the closest move of the same pattern when a whole ladder is skipped', () => {
    const inputs = { ...base, excluded: LADDERS.h_push.exercises }
    const ctx = planContext(inputs)
    const pick = resolveSlot('h_push', 3, ctx)
    expect(pick).toBeDefined()
    const ex = getExercise(pick!.exerciseId)!
    expect(ex.pattern).toBe('h_push')
    expect(LADDERS.h_push.exercises).not.toContain(ex.id)
    // Full-body A opens with a push slot: it still has one.
    const s = generateSession(inputs, initialProgress(inputs), { index: 0, templateId: 'full_a' })
    const main = s.blocks.filter((b) => b.kind === 'main').flatMap((b) => b.items)
    expect(main.some((it) => getExercise(it.exerciseId)?.pattern === 'h_push')).toBe(true)
  })

  it('leave a slot out when nothing of that movement is left', () => {
    const allPush = EXERCISES.filter((e) => e.pattern === 'h_push').map((e) => e.id)
    const ctx = planContext({ ...base, excluded: allPush })
    expect(resolveSlot('h_push', 3, ctx)).toBeUndefined()
    const s = generateSession({ ...base, excluded: allPush }, initialProgress(base), { index: 0, templateId: 'full_a' })
    expect(idsIn(s).some((id) => getExercise(id)?.pattern === 'h_push')).toBe(false)
    expect(Math.abs(sessionSeconds(s.blocks) - s.minutes * 60)).toBeLessThanOrEqual(FIT_TOLERANCE_SEC)
  })

  it('are never offered as swaps, snacks or game moves', () => {
    const excluded = ['incline-pushup', 'knee-pushup', 'mountain-climbers', 'jumping-jacks', 'reverse-lunge', 'wall-sit', 'glute-bridge']
    const inputs = { ...base, excluded }
    const ctx = planContext(inputs)
    for (const id of ['pushup', 'squat-thrust', 'split-squat']) {
      for (const alt of alternativesFor(id, ctx)) expect(excluded).not.toContain(alt.id)
    }
    for (let v = 0; v < 6; v++) {
      for (const id of idsIn(generateSnack(inputs, 4, v))) expect(excluded).not.toContain(id)
    }
    const progress = initialProgress(inputs)
    for (const seed of ['2026-10-11', '2026-10-12', 'x']) {
      for (const slice of wheelSlices(progress, ctx, seed)) expect(excluded).not.toContain(slice.exerciseId)
    }
    for (const ex of Object.values(deckPlan(progress, ctx).suits)) expect(excluded).not.toContain(ex.id)
  })

  it('give the card game another move of the same kind when its favorites are all skipped', () => {
    const excluded = ['crunch', 'bicycle-crunch', 'dead-bug', 'reverse-crunch', 'bird-dog', 'jumping-jacks', 'high-knees', 'step-jacks', 'march-in-place']
    const ctx = planContext({ ...base, excluded })
    const suits = deckPlan(initialProgress(base), ctx).suits
    for (const ex of Object.values(suits)) expect(isAllowed(ex, ctx), ex.id).toBe(true)
    expect(suits.diamonds.pattern).toBe('core')
    expect(suits.clubs.pattern).toBe('cond')
  })

  it('progress like a swapped-in exercise when the plan falls back off the ladder', () => {
    const inputs = { ...base, excluded: LADDERS.h_push.exercises }
    const ctx = planContext(inputs)
    const progress = initialProgress(inputs)
    const fallback = resolveSlot('h_push', progress.ladders.h_push.rung, ctx)!.exerciseId
    const target = { kind: 'reps' as const, reps: 12, min: 8, max: 12 }
    let state = progress
    for (let i = 0; i < 3; i++) {
      state = applyWorkout(state, { date: `2026-10-0${i + 1}`, planned: true, exercises: [{ exerciseId: fallback, ladder: 'h_push', target, sets: [12, 12, 12] }] }, ctx).state
    }
    // The ladder's rung stays put (none of its rungs are allowed); the move gets harder instead.
    expect(state.ladders.h_push.rung).toBe(progress.ladders.h_push.rung)
    expect(state.exercises[fallback].modifierStage).toBeGreaterThan(0)
  })

  it('apply to Bloom practices too', () => {
    const yoga: PlanInputs = { ...base, program: 'yoga', intentions: ['flexibility'], excluded: ['down-dog', 'pigeon-pose', 'warrior-2', 'tree-pose'] }
    for (let index = 0; index < 10; index++) {
      const s = generateSession(yoga, initialProgress(yoga), { index })
      for (const id of yoga.excluded!) expect(idsIn(s)).not.toContain(id)
    }
  })
})
