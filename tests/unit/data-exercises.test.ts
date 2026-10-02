import { describe, expect, it } from 'vitest'
import { EXERCISE_DEFS } from '@/data/exercises/catalog'
import { COPY_PUSH_PULL } from '@/data/exercises/copy/push-pull'
import { COPY_LEGS } from '@/data/exercises/copy/legs'
import { COPY_CORE } from '@/data/exercises/copy/core'
import { COPY_COND_MOBILITY } from '@/data/exercises/copy/cond-mobility'
import type { ExerciseCopy, Pattern } from '@/data/exercises/types'

const FILES: Array<{ name: string; copy: Record<string, ExerciseCopy>; patterns: Pattern[] }> = [
  { name: 'push-pull', copy: COPY_PUSH_PULL, patterns: ['h_push', 'v_push', 'h_pull', 'v_pull', 'arms'] },
  { name: 'legs', copy: COPY_LEGS, patterns: ['squat', 'lunge', 'hinge', 'bridge'] },
  { name: 'core', copy: COPY_CORE, patterns: ['core'] },
  { name: 'cond-mobility', copy: COPY_COND_MOBILITY, patterns: ['cond', 'mobility'] },
]

const words = (s: string) => s.trim().split(/\s+/).length

describe('exercise catalog', () => {
  it('has unique ids and sane fields', () => {
    const ids = new Set<string>()
    for (const e of EXERCISE_DEFS) {
      expect(ids.has(e.id), `duplicate ${e.id}`).toBe(false)
      ids.add(e.id)
      expect(e.level).toBeGreaterThanOrEqual(1)
      expect(e.level).toBeLessThanOrEqual(10)
      expect(e.range[0]).toBeLessThanOrEqual(e.range[1])
      expect(e.met).toBeGreaterThan(1.5)
      expect(e.muscles.primary.length).toBeGreaterThan(0)
    }
    expect(EXERCISE_DEFS.length).toBeGreaterThanOrEqual(90)
  })
})

for (const f of FILES) {
  describe(`exercise copy: ${f.name}`, () => {
    const defs = EXERCISE_DEFS.filter((e) => f.patterns.includes(e.pattern))
    it('covers every exercise in its patterns and nothing else', () => {
      const missing = defs.filter((d) => !f.copy[d.id]).map((d) => d.id)
      expect(missing, 'missing copy').toEqual([])
      const extra = Object.keys(f.copy).filter((id) => !defs.some((d) => d.id === id))
      expect(extra, 'unknown ids').toEqual([])
    })
    for (const d of defs) {
      it(`${d.id} copy is complete and concise`, () => {
        const c = f.copy[d.id]
        if (!c) return // reported by the coverage test
        expect(c.summary.length).toBeGreaterThan(20)
        expect(c.summary.length).toBeLessThanOrEqual(200)
        expect(c.setup.length).toBeGreaterThanOrEqual(1)
        expect(c.setup.length).toBeLessThanOrEqual(3)
        expect(c.steps.length).toBeGreaterThanOrEqual(2)
        expect(c.steps.length).toBeLessThanOrEqual(4)
        for (const s of [...c.setup, ...c.steps]) expect(s.length).toBeLessThanOrEqual(160)
        expect(c.breathing.length).toBeGreaterThan(10)
        expect(c.cues.length).toBeGreaterThanOrEqual(3)
        expect(c.cues.length).toBeLessThanOrEqual(6)
        for (const cue of c.cues) expect(words(cue), `cue too long: ${cue}`).toBeLessThanOrEqual(8)
        expect(c.mistakes.length).toBeGreaterThanOrEqual(2)
        expect(c.mistakes.length).toBeLessThanOrEqual(3)
        const faultIds = new Set((d.faults ?? []).map((x) => x.id))
        for (const m of c.mistakes) {
          expect(m.text.length).toBeGreaterThan(5)
          expect(m.fix.length).toBeGreaterThan(5)
          if (m.fault) expect(faultIds.has(m.fault), `unknown fault ${m.fault}`).toBe(true)
        }
        expect(c.easier.length).toBeGreaterThan(10)
        expect(c.harder.length).toBeGreaterThan(10)
        const total = [c.summary, ...c.setup, ...c.steps, c.breathing, ...c.mistakes.map((m) => m.text + m.fix), c.easier, c.harder].join(' ')
        expect(total.length).toBeLessThanOrEqual(1400)
      })
    }
  })
}
