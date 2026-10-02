export * from './types'
export * from './ladders'
export * from './templates'
export * from './equipment'
export * from './prescribe'
export * from './duration'
export * from './generate'

import type { Profile } from '@/domain/types'
import type { PlanInputs } from './types'

export function planInputsFromProfile(p: Profile): PlanInputs {
  return {
    goal: p.goal,
    experience: p.experience,
    daysPerWeek: p.daysPerWeek,
    sessionMinutes: p.sessionMinutes,
    aches: p.aches,
    equipment: p.equipment,
    quietMode: !!p.quietMode,
    bodyWeightKg: p.weightKg,
  }
}
