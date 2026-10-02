import { describe, expect, it } from 'vitest'
import { DEFAULT_EQUIPMENT } from '@/domain/types'
import { generateSession, generateSnack, type PlanInputs } from '@/engines/plan'
import { initialProgress } from '@/engines/progression/progress'
import { aggregate } from '@/features/player/finish'
import { buildSteps, describeWork, prevWork, type WorkStep } from '@/features/player/steps'

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

describe('player steps', () => {
  it('cover every planned set, alternate work and rest, and never end on a rest', () => {
    for (const minutes of [5, 10, 15, 30, 45]) {
      for (let index = 0; index < 6; index++) {
        const s = generateSession({ ...base, sessionMinutes: minutes }, initialProgress(base), { index })
        const steps = buildSteps(s)
        expect(steps[0].kind).toBe('rest')
        expect(steps[steps.length - 1].kind).toBe('work')
        for (let i = 1; i < steps.length; i++) expect(steps[i].kind === 'rest' && steps[i - 1].kind === 'rest').toBe(false)
        const work = steps.filter((x): x is WorkStep => x.kind === 'work')
        // Every planned (block, item, round) appears at least once.
        const keys = new Set(work.map((w) => `${w.logKey}#${w.setIndex}`))
        s.blocks.forEach((b, bi) => b.items.forEach((_, ii) => {
          for (let r = 0; r < b.rounds; r++) expect(keys.has(`${bi}:${ii}#${r}`)).toBe(true)
        }))
        for (const st of steps) {
          if (st.kind === 'rest') {
            expect(st.seconds).toBeGreaterThan(0)
            expect(st.next).toBeDefined()
          } else {
            expect(st.seconds !== undefined || (st.reps ?? 0) > 0).toBe(true)
            expect(describeWork(st)).toMatch(/\d/)
          }
        }
        expect(new Set(steps.map((x) => x.id)).size).toBe(steps.length)
      }
    }
  })

  it('splits one-side-at-a-time sets and links them to one logged set', () => {
    const s = generateSession(base, initialProgress(base), { index: 1, swaps: { 0: 'one-arm-db-row' } })
    const steps = buildSteps(s)
    const sides = steps.filter((x): x is WorkStep => x.kind === 'work' && x.side !== undefined)
    expect(sides.length).toBeGreaterThan(0)
    const values: Record<string, number> = {}
    for (const w of sides) values[w.id] = w.side === 1 ? 10 : 8
    const agg = aggregate(steps, values)
    for (const g of agg) for (const v of g.sets) expect(v).toBe(8)
  })

  it('handles snacks and steps back to the previous exercise', () => {
    const s = generateSnack(base, 3, 1)
    const steps = buildSteps(s)
    expect(steps.filter((x) => x.kind === 'work').length).toBeGreaterThan(2)
    const lastWork = steps.length - 1
    expect(steps[prevWork(steps, lastWork)].kind).toBe('work')
    expect(prevWork(steps, 0)).toBe(0)
  })
})
