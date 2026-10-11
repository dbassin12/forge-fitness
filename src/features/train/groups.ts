import { isBloom } from '@/app/brand'
import type { Pattern } from '@/data/exercises'

export interface ExerciseGroup {
  label: string
  patterns: Pattern[]
}

const FORGE_GROUPS: ExerciseGroup[] = [
  { label: 'All', patterns: [] },
  { label: 'Push', patterns: ['h_push', 'v_push'] },
  { label: 'Pull', patterns: ['h_pull', 'v_pull'] },
  { label: 'Legs', patterns: ['squat', 'lunge', 'hinge', 'bridge'] },
  { label: 'Core', patterns: ['core'] },
  { label: 'Cardio', patterns: ['cond'] },
  { label: 'Arms', patterns: ['arms'] },
  { label: 'Mobility', patterns: ['mobility'] },
]

const BLOOM_GROUPS: ExerciseGroup[] = [
  { label: 'All', patterns: [] },
  { label: 'Flows', patterns: ['flow'] },
  { label: 'Standing', patterns: ['standing'] },
  { label: 'Balance', patterns: ['balance'] },
  { label: 'Hips', patterns: ['hip'] },
  { label: 'Folds', patterns: ['fold'] },
  { label: 'Backbends & twists', patterns: ['backbend', 'twist'] },
  { label: 'Core', patterns: ['core'] },
  { label: 'Stretches', patterns: ['mobility'] },
  { label: 'Restore', patterns: ['restore'] },
  { label: 'Gentle strength', patterns: ['bridge', 'h_push', 'squat', 'cond'] },
]

/** Library filter groups for this app. */
export const GROUPS = isBloom ? BLOOM_GROUPS : FORGE_GROUPS

/** Display order of movement patterns (then easiest first). */
export const PATTERN_ORDER: Pattern[] = isBloom
  ? ['flow', 'standing', 'balance', 'hip', 'fold', 'backbend', 'twist', 'core', 'mobility', 'restore', 'bridge', 'h_push', 'squat', 'cond']
  : ['h_push', 'v_push', 'h_pull', 'v_pull', 'squat', 'lunge', 'hinge', 'bridge', 'core', 'cond', 'arms', 'mobility']
