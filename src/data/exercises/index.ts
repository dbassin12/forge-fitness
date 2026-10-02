import type { SegmentGroup } from '@/anim/draw'
import type { Motion } from '@/anim/types'
import { EXERCISE_DEFS } from './catalog'
import { EXERCISE_COPY } from './copy'
import type { Equip, Exercise, ExerciseCopy, ExerciseDef, Muscle, Pattern } from './types'

export type { Equip, Exercise, ExerciseCopy, ExerciseDef, Muscle, Pattern }

export const PATTERN_LABEL: Record<Pattern, string> = {
  h_push: 'Push',
  v_push: 'Overhead push',
  h_pull: 'Pull',
  v_pull: 'Lat pull',
  squat: 'Squat',
  lunge: 'Lunge & single leg',
  hinge: 'Hinge',
  bridge: 'Glute bridge',
  core: 'Core',
  cond: 'Cardio',
  arms: 'Arms',
  mobility: 'Mobility',
}

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  biceps: 'Biceps',
  forearms: 'Forearms',
  upper_back: 'Upper back',
  lats: 'Lats',
  traps: 'Traps',
  abs: 'Abs',
  obliques: 'Obliques',
  lower_back: 'Lower back',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  hip_flexors: 'Hip flexors',
  adductors: 'Inner thighs',
}

export const EQUIP_LABEL: Record<Equip, string> = {
  db_pair: 'Both dumbbells',
  db_single: 'One dumbbell',
  db_heavy: 'Heavier dumbbell',
  chair: 'Chair',
  table: 'Sturdy table',
  wall: 'Wall',
  stairs: 'Step or stairs',
}

const MUSCLE_GROUP: Record<Muscle, SegmentGroup> = {
  chest: 'chest',
  shoulders: 'shoulders',
  triceps: 'upperArms',
  biceps: 'upperArms',
  forearms: 'forearms',
  upper_back: 'back',
  lats: 'back',
  traps: 'back',
  lower_back: 'back',
  abs: 'core',
  obliques: 'core',
  glutes: 'glutes',
  quads: 'thighs',
  hamstrings: 'thighs',
  hip_flexors: 'thighs',
  adductors: 'thighs',
  calves: 'calves',
}

function fallbackCopy(d: ExerciseDef): ExerciseCopy {
  return {
    summary: `${d.name} trains your ${d.muscles.primary.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(' and ')}.`,
    setup: ['Get into the starting position shown in the animation.'],
    steps: ['Move slowly and with control.', 'Return to the start and repeat.'],
    breathing: 'Breathe out on the effort and in as you return.',
    cues: ['Slow and controlled', 'Keep your core tight', 'Full range of motion'],
    mistakes: [
      { text: 'Rushing the reps.', fix: 'Slow down and own every inch.' },
      { text: 'Holding your breath.', fix: 'Keep a steady breathing rhythm.' },
    ],
    easier: 'Do fewer reps or a smaller range of motion.',
    harder: 'Slow the lowering phase down to three seconds.',
  }
}

export const EXERCISES: Exercise[] = EXERCISE_DEFS.map((d) => ({ ...d, copy: EXERCISE_COPY[d.id] ?? fallbackCopy(d) }))

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id)
}

const motionCache = new Map<string, Motion>()

/** Cached motion for an exercise (and optionally one of its fault variants). */
export function motionFor(ex: Exercise, faultId?: string): Motion {
  const key = faultId ? `${ex.id}#${faultId}` : ex.id
  let m = motionCache.get(key)
  if (!m) {
    const fault = faultId ? ex.faults?.find((f) => f.id === faultId) : undefined
    m = fault ? fault.motion() : ex.motion()
    motionCache.set(key, m)
  }
  return m
}

/** Which mannequin overlay groups glow for this exercise. */
export function highlightFor(ex: Exercise): { primary: SegmentGroup[]; secondary: SegmentGroup[] } {
  if (ex.highlight) return { primary: ex.highlight, secondary: [] }
  const primary = [...new Set(ex.muscles.primary.map((m) => MUSCLE_GROUP[m]))]
  const secondary = [...new Set(ex.muscles.secondary.map((m) => MUSCLE_GROUP[m]))].filter((g) => !primary.includes(g))
  return { primary, secondary }
}

export function youtubeUrl(ex: Exercise): string {
  const q = ex.youtube ?? `${ex.name} proper form tutorial`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}
