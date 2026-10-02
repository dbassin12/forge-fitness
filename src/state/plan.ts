import { useMemo } from 'react'
import { planInputsFromProfile, type PlanInputs } from '@/engines/plan'
import type { Profile } from '@/domain/types'
import type { ProgressState } from '@/engines/plan/types'
import { useProfile, useProgress, useSessionSwaps, type SessionSwaps } from './store'

export interface PlanState {
  profile: Profile
  progress: ProgressState
  inputs: PlanInputs
  swaps: SessionSwaps | null
}

/** Everything needed to build sessions; `null` while loading (or before onboarding). */
export function usePlan(): PlanState | null {
  const profile = useProfile()
  const progress = useProgress(profile)
  const swaps = useSessionSwaps()
  return useMemo(() => {
    if (!profile || !progress || swaps === undefined) return null
    return { profile, progress, inputs: planInputsFromProfile(profile), swaps }
  }, [profile, progress, swaps])
}

/** One-off swaps that apply to a given queue position. */
export function swapsFor(plan: PlanState, index: number): Record<number, string> | undefined {
  return plan.swaps && plan.swaps.index === index ? plan.swaps.swaps : undefined
}
