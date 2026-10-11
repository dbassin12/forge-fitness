import { isBloom } from '@/app/brand'
import type { Exercise } from '@/data/exercises'
import type { ExplainMode } from '@/voice/settings'
import { spokenTarget, type WorkStep } from './steps'

/** full: how to do it, step by step; brief: name, target and one cue; name: just what's next. */
export type HowToDepth = 'full' | 'brief' | 'name'

/** Times a move is explained in full (in "new moves" mode) before the coach just reminds you. */
export const FULL_EXPLANATIONS = 2

/** Warm-up and cool-down moves are simple and the flow keeps moving: explain the first steps only. */
const FLOW_WORD_CAP = 45

export function depthFor(mode: ExplainMode, timesExplained: number): HowToDepth {
  if (mode === 'off') return 'name'
  if (mode === 'always') return 'full'
  return timesExplained < FULL_EXPLANATIONS ? 'full' : 'brief'
}

/** Setup and movement steps, in order (what the how-to screen lists). */
export function howToSteps(ex: Exercise): string[] {
  return [...ex.copy.setup, ...ex.copy.steps]
}

/** How many of `howToSteps` the coach reads out for this step. */
export function spokenStepCount(ex: Exercise, w: WorkStep): number {
  const all = howToSteps(ex)
  if (w.blockKind !== 'warmup' && w.blockKind !== 'cooldown') return all.length
  let words = 0
  let n = 0
  for (const s of all) {
    words += s.split(/\s+/).length
    if (n > 0 && words > FLOW_WORD_CAP) break
    n++
  }
  return n
}

/** "First up: Goblet squat." / "Up next: Goblet squat." (Bloom: "First: …" / "Next: …"). */
export function openingLine(ex: Exercise, first: boolean): string {
  if (isBloom) return `${first ? 'First' : 'Next'}: ${ex.name}.`
  return `${first ? 'First up' : 'Up next'}: ${ex.name}.`
}

/** A coaching cue as its own short sentence. */
export function cueLine(cue: string): string {
  return /[.!?]$/.test(cue) ? cue : `${cue}.`
}

/** What the coach says to bring in the next exercise: its name and target, then (in full) how to do it. */
export function introLines(ex: Exercise, w: WorkStep, depth: HowToDepth, opening: 'first' | 'next'): string[] {
  const lines = [openingLine(ex, opening === 'first'), spokenTarget(w)]
  if (depth === 'full') lines.push(...howToSteps(ex).slice(0, spokenStepCount(ex, w)))
  else if (depth === 'brief' && ex.copy.cues.length) lines.push(cueLine(ex.copy.cues[0]))
  return lines
}
