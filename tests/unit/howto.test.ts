import { describe, expect, it } from 'vitest'
import { getExercise } from '@/data/exercises'
import { DEFAULT_EQUIPMENT } from '@/domain/types'
import { generateSession, generateSnack, type PlanInputs } from '@/engines/plan'
import { initialProgress } from '@/engines/progression/progress'
import { holdsForIntro, restLines } from '@/features/player/announce'
import { aggregate } from '@/features/player/finish'
import { depthFor, FULL_EXPLANATIONS, howToSteps, introLines, spokenStepCount } from '@/features/player/howto'
import { buildSteps, skipFrom, withoutSkipped, type RestStep, type Step, type WorkStep } from '@/features/player/steps'

const base: PlanInputs = {
  goal: 'build_muscle',
  experience: 'intermediate',
  daysPerWeek: 4,
  sessionMinutes: 30,
  aches: [],
  equipment: DEFAULT_EQUIPMENT,
  quietMode: false,
  bodyWeightKg: 80,
}

const works = (steps: Step[]) => steps.filter((x): x is WorkStep => x.kind === 'work')
const coach = () => 'COACH.'

function sessions() {
  const out = []
  for (const minutes of [5, 10, 20, 30, 45]) for (let index = 0; index < 5; index++) out.push(generateSession({ ...base, sessionMinutes: minutes }, initialProgress(base), { index }))
  return out
}

describe('first appearances', () => {
  it('flag the transition before each exercise’s first set, and only that one', () => {
    for (const s of sessions()) {
      const steps = buildSteps(s)
      const seen = new Set<string>()
      steps.forEach((st, i) => {
        if (st.kind !== 'work') return
        const prev = steps[i - 1]
        const isFirst = !seen.has(st.item.exerciseId)
        seen.add(st.item.exerciseId)
        if (prev?.kind === 'rest') expect(!!prev.first, `${s.key} step ${i}`).toBe(isFirst)
      })
      // Every exercise gets introduced exactly once.
      const flagged = steps.filter((x): x is RestStep => x.kind === 'rest' && !!x.first).map((r) => r.next!.item.exerciseId)
      expect(new Set(flagged).size).toBe(flagged.length)
      expect(new Set(flagged)).toEqual(new Set(works(steps).map((w) => w.item.exerciseId)))
    }
  })
})

describe('skipping an exercise mid-workout', () => {
  it('drops its remaining sets, keeps the ones already done, and leaves a clean sequence', () => {
    for (const s of sessions()) {
      const all = buildSteps(s)
      const main = works(all).filter((w) => w.blockKind === 'main')
      if (!main.length) continue
      const victim = main[0].item.exerciseId
      const firstIdx = all.findIndex((st) => st.kind === 'work' && st.item.exerciseId === victim)
      // Skip after its first set.
      const from = firstIdx + 1
      const left = withoutSkipped(all, { [victim]: from })
      const victimSteps = works(left).filter((w) => w.item.exerciseId === victim)
      expect(victimSteps.every((w) => all.indexOf(w) < from)).toBe(true)
      expect(victimSteps.length).toBeGreaterThan(0)
      // Never two rests in a row, never ends on a rest, every rest points at the work after it.
      for (let i = 1; i < left.length; i++) expect(left[i].kind === 'rest' && left[i - 1].kind === 'rest').toBe(false)
      expect(left[left.length - 1].kind).toBe('work')
      left.forEach((st, i) => {
        if (st.kind === 'rest') expect(st.next).toBe(left.slice(i + 1).find((x) => x.kind === 'work'))
      })
      // The original steps are untouched (they're shared with the saved run).
      expect(buildSteps(s).length).toBe(all.length)
      // What was done before the skip is still logged.
      const values = { [main[0].id]: 9 }
      expect(aggregate(left, values).map((g) => g.step.item.exerciseId)).toEqual([victim])
    }
  })

  it('keeps the rest you were owed after the last set you did (not a quick switch)', () => {
    // A superset: skipping the first exercise after round 1 must keep the round rest after the partner.
    const s = generateSession({ ...base, sessionMinutes: 30 }, initialProgress(base), { index: 0 })
    const all = buildSteps(s)
    const superset = s.blocks.findIndex((b) => b.format === 'superset')
    if (superset < 0) return
    const [a, b] = s.blocks[superset].items.map((it) => it.exerciseId)
    const bFirst = all.findIndex((st) => st.kind === 'work' && st.item.exerciseId === b)
    const left = withoutSkipped(all, { [a]: bFirst })
    // The partner's last step in round 1 (its second side, for one-side-at-a-time moves).
    const lastB = works(left).filter((w) => w.item.exerciseId === b && w.round === 1).pop()!
    const after = left[left.indexOf(lastB) + 1]
    expect(after.kind).toBe('rest')
    expect((after as RestStep).seconds).toBe(s.blocks[superset].restSec)
  })

  it('carries on with the transition into the next exercise (its how-to)', () => {
    for (const s of sessions()) {
      const all = buildSteps(s)
      const firstWork = all.findIndex((st) => st.kind === 'work')
      const victim = (all[firstWork] as WorkStep).item.exerciseId
      // From the exercise itself, and from the how-to before it.
      for (const current of [all[firstWork], all[firstWork - 1]]) {
        const r = skipFrom(all, undefined, current, victim)
        if (r.cursor === null) continue
        const landed = r.steps[r.cursor] as RestStep
        expect(landed.kind).toBe('rest')
        expect(landed.next!.item.exerciseId).not.toBe(victim)
        expect(landed.first).toBe(true)
        expect(works(r.steps.slice(r.cursor)).some((w) => w.item.exerciseId === victim)).toBe(false)
      }
    }
  })

  it('has nothing left to do once every exercise is skipped', () => {
    const all = buildSteps(generateSnack(base, 2, 0))
    let r: ReturnType<typeof skipFrom> | undefined
    for (const id of new Set(works(all).map((w) => w.item.exerciseId))) r = skipFrom(all, r?.skips, all[0], id)
    expect(r!.cursor).toBeNull()
  })

  it('is a no-op without skips', () => {
    const all = buildSteps(sessions()[3])
    expect(withoutSkipped(all, {})).toBe(all)
    expect(withoutSkipped(all, undefined)).toBe(all)
  })
})

describe('how-to lines', () => {
  const s = generateSession({ ...base, sessionMinutes: 30 }, initialProgress(base), { index: 0 })
  const all = buildSteps(s)

  it('explain in full the first times, then remind, or just name the move', () => {
    expect(depthFor('new', 0)).toBe('full')
    expect(depthFor('new', FULL_EXPLANATIONS - 1)).toBe('full')
    expect(depthFor('new', FULL_EXPLANATIONS)).toBe('brief')
    expect(depthFor('always', 99)).toBe('full')
    expect(depthFor('off', 0)).toBe('name')
  })

  it('read the whole setup and movement for main exercises, the first steps for warm-ups', () => {
    for (const w of works(all)) {
      const ex = getExercise(w.item.exerciseId)!
      const full = introLines(ex, w, 'full', 'next')
      expect(full[0]).toBe(`Up next: ${ex.name}.`)
      expect(full[1]).toMatch(/^\d+ (reps?|seconds)/)
      const n = spokenStepCount(ex, w)
      expect(full.slice(2)).toEqual(howToSteps(ex).slice(0, n))
      if (w.blockKind === 'main' || w.blockKind === 'finisher') expect(n).toBe(howToSteps(ex).length)
      expect(n).toBeGreaterThan(0)
      const brief = introLines(ex, w, 'brief', 'next')
      expect(brief).toHaveLength(ex.copy.cues.length ? 3 : 2)
      expect(brief[2]).toMatch(/[.!?]$/)
      expect(introLines(ex, w, 'name', 'first')).toEqual([`First up: ${ex.name}.`, full[1]])
    }
  })

  it('open the workout with "get ready", explain on first sets, and hold the countdown for it', () => {
    const ready = all[0] as RestStep
    expect(ready.reason).toBe('ready')
    expect(ready.first).toBe(true)
    const ex = getExercise(ready.next!.item.exerciseId)!
    const lines = restLines(ready, undefined, 'full', coach)
    expect(lines[0]).toBe('Get ready.')
    expect(lines[1]).toBe(`First up: ${ex.name}.`)
    expect(lines).toContain(howToSteps(ex)[0])
    expect(holdsForIntro(ready, 'full')).toBe(true)
    expect(holdsForIntro(ready, 'brief')).toBe(true)
    expect(holdsForIntro(ready, 'name')).toBe(false)
    // Later rests just name what's next, however new the move was.
    for (let i = 1; i < all.length; i++) {
      const st = all[i]
      if (st.kind !== 'rest' || st.first) continue
      expect(holdsForIntro(st, 'full')).toBe(false)
      const said = restLines(st, all[i - 1], 'full', coach)
      const nextEx = getExercise(st.next!.item.exerciseId)!
      expect(said).not.toContain(howToSteps(nextEx)[0])
    }
  })

  it('say sets, rounds and dumbbells the way the coach did before', () => {
    for (let i = 1; i < all.length; i++) {
      const st = all[i]
      if (st.kind !== 'rest') continue
      const said = restLines(st, all[i - 1], 'name', coach)
      expect(said.length).toBeGreaterThan(0)
      for (const l of said) expect(l).toMatch(/[.!?]$/)
      if (st.reason === 'side') expect(said).toEqual(['Switch sides.'])
      if (st.reason === 'set' && all[i - 1].kind === 'work' && (all[i - 1] as WorkStep).item.exerciseId === st.next!.item.exerciseId) {
        expect(said[0]).toBe(`Rest for ${st.seconds} seconds.`)
        expect(said[1]).toBe(`Then set ${st.next!.round} of ${st.next!.rounds}.`)
      }
      if (st.reason === 'block') {
        const db = getExercise(st.next!.item.exerciseId)!.equipment.some((e) => e.startsWith('db'))
        expect(said.includes('Grab your dumbbells.')).toBe(db)
      }
    }
  })
})
