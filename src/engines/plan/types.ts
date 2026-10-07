import type { Ache, Equipment, Experience, Goal, Intention, ISODate, Program } from '@/domain/types'

/** A progression ladder: one movement slot, ordered easiest → hardest. */
export type LadderId =
  | 'h_push'
  | 'v_push'
  | 'h_pull'
  | 'v_pull'
  | 'squat'
  | 'lunge'
  | 'hinge'
  | 'bridge'
  | 'core_ext'
  | 'core_lat'
  | 'core_flex'
  | 'cond'
  | 'biceps'
  | 'triceps'
  // Yoga (Bloom)
  | 'y_flow'
  | 'y_standing'
  | 'y_balance'
  | 'y_hip'
  | 'y_fold'
  | 'y_back'
  | 'y_core'

/** 1 = main lift … 4 = optional extra (first to go when time is short). */
export type Priority = 1 | 2 | 3 | 4

export interface Slot {
  ladder: LadderId
  priority: Priority
}

export type StrengthTemplateId = 'full_a' | 'full_b' | 'full_c' | 'upper_a' | 'upper_b' | 'lower_a' | 'lower_b' | 'cond_core'
/** Bloom's practice themes. */
export type YogaTemplateId = 'y_morning' | 'y_strength' | 'y_hips' | 'y_back' | 'y_unwind'
export type TemplateId = StrengthTemplateId | YogaTemplateId

export type Focus = 'full' | 'upper' | 'lower' | 'conditioning' | 'yoga'

export interface SessionTemplate {
  id: TemplateId
  name: string
  focus: Focus
  slots: Slot[]
}

/** Upgrades applied once an exercise tops out and there is no harder rung (fixed dumbbells!). */
export type Modifier = 'tempo' | 'pause' | 'one_and_half' | 'extra_set'

export interface LadderProgress {
  /** Index into the ladder's exercise list. */
  rung: number
  /** `sessionsCompleted` when the rung last changed (hysteresis against flip-flopping). */
  changedAt: number
}

export interface ExerciseProgress {
  /** Current per-set target: reps, or seconds for holds. */
  goal: number
  /** Consecutive sessions at the top of the range on every set. */
  topStreak: number
  /** Consecutive sessions that clearly fell short. */
  failStreak: number
  /** 0 = none; n = MODIFIERS[n - 1]. */
  modifierStage: number
  /** Best single set ever (reps or seconds). */
  best: number
  lastDate?: ISODate
}

/** Results of the quick fitness test (any part may be skipped). */
export interface FitnessTest {
  date: ISODate
  /** Max push-ups in one go (full push-ups; 0 if none yet). */
  pushups?: number
  /** Bodyweight squats in 60 seconds. */
  squats60?: number
  /** Forearm plank hold in seconds. */
  plankSec?: number
}

export interface ProgressState {
  version: 1
  /** Planned sessions completed — drives the rolling queue and the 4-week block. */
  sessionsCompleted: number
  ladders: Record<LadderId, LadderProgress>
  exercises: Record<string, ExerciseProgress>
  /** "Always use this instead" swaps, per ladder. */
  preferred: Partial<Record<LadderId, string>>
  tests: FitnessTest[]
}

export interface PlanInputs {
  goal: Goal
  experience: Experience
  daysPerWeek: number
  sessionMinutes: number
  aches: Ache[]
  equipment: Equipment
  /** No jumping (apartments, sensitive joints). */
  quietMode: boolean
  bodyWeightKg: number
  /** Strength sessions (default) or gentle yoga practices. */
  program?: Program
  /** Yoga: what the practice is for (shapes the weekly themes). */
  intentions?: Intention[]
}

export type Target =
  | { kind: 'reps'; reps: number; min: number; max: number }
  | { kind: 'time'; seconds: number; min: number; max: number }

export interface PlannedItem {
  exerciseId: string
  /** Template slot (100+ for accessories) — the key for swaps. */
  slot?: number
  ladder?: LadderId
  priority?: Priority
  target: Target
  perSide: boolean
  /** Estimated seconds of work for one set (both sides, including the switch). */
  workSec: number
  /** Suggested dumbbell weight per hand (lb). */
  loadLb?: number
  modifier?: Modifier
  /** Short coaching notes shown in the player, e.g. "3-second lowering". */
  notes: string[]
}

export type BlockKind = 'warmup' | 'main' | 'finisher' | 'cooldown'

/**
 * Every block is `rounds` passes through its items:
 * - straight: one exercise, rounds = sets
 * - superset: two exercises back to back, then rest
 * - circuit: 3+ exercises back to back, then rest
 * - intervals: timed work/rest for each item (finishers, cardio days)
 * - flow: one continuous pass (warm-up, cool-down)
 */
export type BlockFormat = 'flow' | 'straight' | 'superset' | 'circuit' | 'intervals'

export interface PlannedBlock {
  id: string
  kind: BlockKind
  format: BlockFormat
  title: string
  rounds: number
  /** Rest after each round. */
  restSec: number
  /** Intervals only: rest between items inside a round. */
  itemRestSec?: number
  items: PlannedItem[]
}

export interface PlannedSession {
  key: string
  /** Position in the rolling queue. */
  index: number
  templateId: TemplateId
  title: string
  focus: Focus
  /** Time budget the session was fitted to. */
  minutes: number
  /** 0-based week within the 4-week block (3 = deload). */
  mesoWeek: number
  deload: boolean
  express: boolean
  blocks: PlannedBlock[]
  estSec: number
  estKcal: number
  /** Pause between blocks (default BLOCK_GAP_SEC; yoga flows from one part to the next faster). */
  gapSec?: number
}
