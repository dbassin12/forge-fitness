import type { ExerciseCopy } from '../types'
import { COPY_PUSH_PULL } from './push-pull'
import { COPY_LEGS } from './legs'
import { COPY_CORE } from './core'
import { COPY_COND_MOBILITY } from './cond-mobility'

export const EXERCISE_COPY: Record<string, ExerciseCopy> = {
  ...COPY_PUSH_PULL,
  ...COPY_LEGS,
  ...COPY_CORE,
  ...COPY_COND_MOBILITY,
}
