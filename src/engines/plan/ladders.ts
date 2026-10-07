import type { Program } from '@/domain/types'
import type { LadderId } from './types'

export type Region = 'upper' | 'lower' | 'core' | 'cond' | 'yoga'

export interface LadderInfo {
  id: LadderId
  name: string
  region: Region
  /** Push and pull ladders pair well in supersets even though both are upper body. */
  direction?: 'push' | 'pull'
  /** Exercise ids, easiest → hardest (levels never decrease). */
  exercises: string[]
  /** Starting rung for beginner / intermediate / advanced when there is no fitness test. */
  start: [number, number, number]
  /**
   * Rotate between this many rungs below the current one for variety (cardio, curls). Progress
   * still moves the whole window up.
   */
  variety?: number
  /** Which program uses it (default strength). */
  program?: Program
}

const ladder = (info: LadderInfo) => info

export const LADDERS: Record<LadderId, LadderInfo> = {
  h_push: ladder({
    id: 'h_push',
    name: 'Push-ups',
    region: 'upper',
    direction: 'push',
    exercises: ['wall-pushup', 'incline-pushup', 'knee-pushup', 'pushup', 'diamond-pushup', 'decline-pushup'],
    start: [1, 3, 4],
  }),
  v_push: ladder({
    id: 'v_push',
    name: 'Overhead press',
    region: 'upper',
    direction: 'push',
    exercises: ['db-overhead-press', 'pike-pushup', 'arnold-press', 'elevated-pike-pushup', 'wall-handstand'],
    start: [0, 0, 1],
  }),
  h_pull: ladder({
    id: 'h_pull',
    name: 'Rows',
    region: 'upper',
    direction: 'pull',
    exercises: ['prone-ytw', 'reverse-snow-angel', 'db-bent-row', 'one-arm-db-row', 'table-row-bent', 'table-row', 'renegade-row'],
    start: [2, 3, 3],
  }),
  v_pull: ladder({
    id: 'v_pull',
    name: 'Lats',
    region: 'upper',
    direction: 'pull',
    exercises: ['prone-w-pull', 'db-pullover'],
    start: [0, 1, 1],
  }),
  squat: ladder({
    id: 'squat',
    name: 'Squats',
    region: 'lower',
    exercises: ['box-squat', 'bodyweight-squat', 'pause-squat', 'goblet-squat', 'db-front-squat'],
    start: [1, 2, 3],
  }),
  lunge: ladder({
    id: 'lunge',
    name: 'Lunges',
    region: 'lower',
    exercises: ['split-squat', 'reverse-lunge', 'db-reverse-lunge', 'bulgarian-split-squat', 'db-bulgarian-split-squat'],
    start: [0, 1, 3],
  }),
  hinge: ladder({
    id: 'hinge',
    name: 'Hinges',
    region: 'lower',
    exercises: ['good-morning', 'db-rdl', 'single-leg-rdl', 'db-single-leg-rdl'],
    start: [1, 1, 2],
  }),
  bridge: ladder({
    id: 'bridge',
    name: 'Glute bridges',
    region: 'lower',
    exercises: ['glute-bridge', 'single-leg-bridge', 'hip-thrust', 'db-hip-thrust'],
    start: [0, 1, 2],
  }),
  core_ext: ladder({
    id: 'core_ext',
    name: 'Planks',
    region: 'core',
    exercises: ['dead-bug', 'knee-plank', 'forearm-plank', 'plank-shoulder-tap', 'hollow-hold-tuck', 'hollow-hold'],
    start: [1, 2, 3],
  }),
  core_lat: ladder({
    id: 'core_lat',
    name: 'Side core',
    region: 'core',
    exercises: ['bird-dog', 'side-plank-knee', 'russian-twist', 'side-plank', 'db-russian-twist'],
    start: [0, 1, 3],
  }),
  core_flex: ladder({
    id: 'core_flex',
    name: 'Abs',
    region: 'core',
    exercises: ['crunch', 'reverse-crunch', 'bicycle-crunch', 'leg-raise', 'v-up'],
    start: [0, 1, 3],
  }),
  cond: ladder({
    id: 'cond',
    name: 'Cardio',
    region: 'cond',
    exercises: [
      'march-in-place',
      'step-jacks',
      'shadow-boxing',
      'jumping-jacks',
      'butt-kicks',
      'fast-feet',
      'high-knees',
      'step-back-burpee',
      'mountain-climbers',
      'skaters',
      'squat-thrust',
      'db-thruster',
      'burpee',
    ],
    start: [2, 5, 8],
    variety: 3,
  }),
  biceps: ladder({
    id: 'biceps',
    name: 'Biceps',
    region: 'upper',
    direction: 'pull',
    exercises: ['db-curl', 'hammer-curl'],
    start: [1, 1, 1],
    variety: 1,
  }),
  triceps: ladder({
    id: 'triceps',
    name: 'Triceps',
    region: 'upper',
    direction: 'push',
    exercises: ['overhead-triceps', 'skull-crusher', 'chair-dip'],
    start: [0, 1, 2],
  }),

  // ---- Bloom (yoga): poses climb as holds lengthen; nearby poses rotate for variety. ----
  y_flow: ladder({
    id: 'y_flow',
    name: 'Sun salutations',
    region: 'yoga',
    exercises: ['mountain-breath', 'half-sun-salutation', 'sun-salutation-gentle', 'sun-salutation'],
    start: [1, 2, 3],
    program: 'yoga',
  }),
  y_standing: ladder({
    id: 'y_standing',
    name: 'Standing poses',
    region: 'yoga',
    exercises: ['warrior-2', 'goddess-pose', 'warrior-1', 'chair-pose', 'triangle-pose'],
    start: [1, 2, 4],
    variety: 2,
    program: 'yoga',
  }),
  y_balance: ladder({
    id: 'y_balance',
    name: 'Balance',
    region: 'yoga',
    exercises: ['tree-pose-kickstand', 'tree-pose', 'warrior-3-chair', 'tree-pose-full', 'warrior-3'],
    start: [0, 1, 3],
    program: 'yoga',
  }),
  y_hip: ladder({
    id: 'y_hip',
    name: 'Hip openers',
    region: 'yoga',
    exercises: ['figure-four-stretch', 'butterfly-pose', 'low-lunge', 'lizard-lunge', 'pigeon-pose', 'sleeping-pigeon'],
    start: [1, 2, 3],
    variety: 1,
    program: 'yoga',
  }),
  y_fold: ladder({
    id: 'y_fold',
    name: 'Forward folds',
    region: 'yoga',
    exercises: ['standing-forward-fold', 'seated-forward-fold', 'down-dog', 'half-splits'],
    start: [0, 1, 2],
    variety: 1,
    program: 'yoga',
  }),
  y_back: ladder({
    id: 'y_back',
    name: 'Backbends',
    region: 'yoga',
    exercises: ['sphinx-pose', 'cobra-stretch', 'bridge-pose', 'locust-pose'],
    start: [0, 1, 2],
    variety: 1,
    program: 'yoga',
  }),
  y_core: ladder({
    id: 'y_core',
    name: 'Gentle core',
    region: 'yoga',
    exercises: ['toe-taps', 'bird-dog', 'dead-bug', 'knee-plank', 'boat-pose-easy', 'side-plank-knee', 'forearm-plank', 'boat-pose'],
    start: [0, 2, 4],
    variety: 1,
    program: 'yoga',
  }),
}

export const LADDER_IDS = Object.keys(LADDERS) as LadderId[]

/** The ladders a program uses (Forge's strength ladders, or Bloom's yoga ones). */
export function laddersFor(program: Program = 'strength'): LadderId[] {
  return LADDER_IDS.filter((id) => (LADDERS[id].program ?? 'strength') === program)
}

/** Which ladder (if any) an exercise belongs to. */
export function ladderOf(exerciseId: string): LadderId | undefined {
  return LADDER_IDS.find((l) => LADDERS[l].exercises.includes(exerciseId))
}
