import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COACH_STYLES } from '@/app/prefs'
import { EXERCISES, getExercise } from '@/data/exercises'
import { DEFAULT_EQUIPMENT, type Equipment, type Goal } from '@/domain/types'
import { generateSession, generateSnack, planContext, type PlanInputs } from '@/engines/plan'
import { CHALLENGES, deckPlan, spokenMove, wheelSlices } from '@/engines/play'
import { initialProgress } from '@/engines/progression/progress'
import { restLines } from '@/features/player/announce'
import { howToSteps, introLines } from '@/features/player/howto'
import { buildSteps, type WorkStep } from '@/features/player/steps'
import { voiceSentences } from '@/voice/catalog'
import { COACH_LINES } from '@/voice/coachLines'
import { tutorialScript } from '@/voice/narration'
import { VOICE_PACKS, VOICE_PREVIEW } from '@/voice/packs'
import { sentencesOf, voiceKey } from '@/voice/voiceKey'

const catalog = voiceSentences()
const keys = new Set(catalog.map((s) => s.key))

/** Sentences of `text` the natural voice couldn't say (a count followed by a known phrase is fine). */
function missing(text: string): string[] {
  return sentencesOf(text).filter((s) => {
    const k = voiceKey(s)
    if (keys.has(k)) return false
    const m = k.match(/^(\d+) (.+)$/)
    return !(m && keys.has(m[1]) && keys.has(m[2]))
  })
}

const ALL_GEAR: Equipment = { ...DEFAULT_EQUIPMENT, dumbbells: DEFAULT_EQUIPMENT.dumbbells.map((d) => ({ ...d, found: true })), table: true, stairs: true }

describe('natural voice catalog', () => {
  it('gives every distinct sentence its own recording', () => {
    expect(new Set(catalog.map((s) => s.id)).size).toBe(catalog.length)
    for (const s of catalog) expect(s.text).toMatch(/[.!?]$/)
  })

  it('covers everything the workout player can say', () => {
    const gaps = new Set<string>()
    const check = (text: string) => missing(text).forEach((s) => gaps.add(s))
    for (const goal of ['build_muscle', 'lose_fat', 'get_stronger', 'general_fitness'] as Goal[]) {
      for (const experience of ['beginner', 'intermediate', 'advanced'] as const) {
        for (const equipment of [DEFAULT_EQUIPMENT, ALL_GEAR]) {
          for (const minutes of [5, 10, 15, 20, 30, 45, 60]) {
            for (let index = 0; index < 6; index++) {
              const inputs: PlanInputs = { goal, experience, daysPerWeek: 4, sessionMinutes: minutes, aches: [], equipment, quietMode: false, bodyWeightKg: 80 }
              const sessions = [generateSession(inputs, initialProgress(inputs), { index }), generateSnack(inputs, Math.max(2, Math.min(5, minutes / 5)), index)]
              for (const s of sessions) {
                const steps = buildSteps(s)
                steps.forEach((st, i) => {
                  if (st.kind === 'rest') {
                    for (const depth of ['full', 'brief', 'name'] as const) restLines(st, steps[i - 1], depth).forEach(check)
                    if (st.next) {
                      const ex = getExercise(st.next.item.exerciseId)!
                      introLines(ex, st.next, 'full', 'next').forEach(check)
                    }
                    return
                  }
                  const w = st as WorkStep
                  for (let n = 1; n <= (w.reps ?? 0); n++) check(String(n))
                })
              }
            }
          }
        }
      }
    }
    expect([...gaps]).toEqual([])
  })

  it('covers coaching cues, coach personalities, tutorials and the full how-to', () => {
    const lines = [VOICE_PREVIEW, 'Go!', 'Resume.']
    for (const ex of EXERCISES) lines.push(...ex.copy.cues, ...howToSteps(ex), ...tutorialScript(ex).map((s) => s.text))
    for (const c of COACH_STYLES) lines.push(c.sample, ...Object.values(COACH_LINES[c.id]).flat())
    expect(lines.flatMap(missing)).toEqual([])
  })

  it('covers the games and the fitness test', () => {
    const inputs: PlanInputs = { goal: 'general_fitness', experience: 'beginner', daysPerWeek: 3, sessionMinutes: 20, aches: [], equipment: ALL_GEAR, quietMode: false, bodyWeightKg: 80 }
    const ctx = planContext(inputs)
    const progress = initialProgress(inputs)
    const lines: string[] = ['Thirty seconds!', 'Time!', 'Stop! Nice work.', '45 seconds. Well done.', '30 seconds left', '2 minutes!']
    for (const seed of ['a', 'b', 'c', 'd', 'e']) for (const s of wheelSlices(progress, ctx, seed)) lines.push(spokenMove(getExercise(s.exerciseId)!, s.amount, s.measure))
    for (const ex of Object.values(deckPlan(progress, ctx).suits)) for (let n = 1; n <= 22; n++) lines.push(spokenMove(ex, n, 'reps'))
    for (const c of CHALLENGES) {
      const ex = c.exercise(progress, ctx)
      if (ex) lines.push(`${ex.name}.`)
    }
    for (const ex of EXERCISES) lines.push(spokenMove(ex, 12, 'reps'), spokenMove(ex, 30, 'time'))
    expect(lines.flatMap(missing)).toEqual([])
  })

  // The recordings must match the copy: change a coaching line → run `npm run voice`.
  for (const pack of VOICE_PACKS) {
    it(`${pack.name}: every sentence is recorded`, () => {
      const dir = `public/voice/${pack.id}`
      expect(existsSync(`${dir}/manifest.json`), `No recordings in ${dir}: run npm run voice`).toBe(true)
      const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8')) as { clips: Record<string, number> }
      const absent = catalog.filter((s) => !(s.id in manifest.clips))
      expect(absent.map((s) => s.text).slice(0, 20), `${absent.length} sentences aren't recorded in ${dir}: run npm run voice`).toEqual([])
      for (const id of Object.keys(manifest.clips).slice(0, 50)) expect(existsSync(`${dir}/${id}.mp3`)).toBe(true)
    })
  }
})
