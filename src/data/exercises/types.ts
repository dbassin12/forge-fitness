import type { SegmentGroup } from '@/anim/draw'
import type { Motion } from '@/anim/types'
import type { Ache } from '@/domain/types'

export type Pattern =
  | 'h_push'
  | 'v_push'
  | 'h_pull'
  | 'v_pull'
  | 'squat'
  | 'lunge'
  | 'hinge'
  | 'bridge'
  | 'core'
  | 'cond'
  | 'arms'
  | 'mobility'

export type Muscle =
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'biceps'
  | 'forearms'
  | 'upper_back'
  | 'lats'
  | 'traps'
  | 'abs'
  | 'obliques'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'hip_flexors'
  | 'adductors'

/**
 * Equipment requirements. `db_pair` = both 20 lb dumbbells, `db_single` = any one dumbbell,
 * `db_heavy` = one dumbbell, ideally the heavier one (falls back to a 20 lb with slower tempo).
 */
export type Equip = 'db_pair' | 'db_single' | 'db_heavy' | 'chair' | 'table' | 'wall' | 'stairs'

export type ExerciseTag = 'warmup' | 'cooldown' | 'finisher' | 'skill' | 'isometric' | 'power' | 'snack' | 'quiet'

export interface Fault {
  id: string
  label: string
  motion: () => Motion
}

export interface ExerciseDef {
  id: string
  name: string
  pattern: Pattern
  /** Difficulty 1 (easiest) … 10. Ladders are ordered by this. */
  level: number
  muscles: { primary: Muscle[]; secondary: Muscle[] }
  /** Every listed item is required. Empty = bodyweight only. */
  equipment: Equip[]
  measure: 'reps' | 'time'
  perSide?: boolean
  /** Default target range (reps, or seconds for holds). Rep timing comes from the animation. */
  range: [number, number]
  /** Metabolic equivalent for calorie estimates. */
  met: number
  impact: 'none' | 'low' | 'high'
  avoidIf?: Ache[]
  cautionIf?: Ache[]
  tags?: ExerciseTag[]
  /** Mannequin animation (factory so motions are only built when needed). */
  motion: () => Motion
  /** Wrong-form demos used in the tutorial's "common mistakes" chapter. */
  faults?: Fault[]
  /** Overlay groups that glow during effort; derived from muscles when omitted. */
  highlight?: SegmentGroup[]
  /** Custom YouTube search phrase. */
  youtube?: string
}

export interface ExerciseCopy {
  /** One sentence: what it is and what it trains. */
  summary: string
  /** 1–3 short setup steps. */
  setup: string[]
  /** 2–4 movement steps. */
  steps: string[]
  breathing: string
  /** Short in-workout cues (3–6), each ≤ 8 words. */
  cues: string[]
  /** 2–3 common mistakes; `fault` links to a wrong-form animation id when one exists. */
  mistakes: { text: string; fix: string; fault?: string }[]
  easier: string
  harder: string
  safety?: string
}

export type Exercise = ExerciseDef & { copy: ExerciseCopy }
