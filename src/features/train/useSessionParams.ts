import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { generateSession, generateSnack, MINI_FLOWS, type MiniFlowKind, type PlannedSession } from '@/engines/plan'
import { dayOfYear } from '@/lib/dates'
import { swapsFor, usePlan } from '@/state/plan'

export interface SessionFromParams {
  session: PlannedSession
  index: number
  snack: boolean
}

/** Session described by the URL (`?min=` express, `?snack=` minutes, `?idx=` queue position). */
export function useSessionFromParams(): SessionFromParams | null {
  const plan = usePlan()
  const [params] = useSearchParams()
  return useMemo(() => {
    if (!plan) return null
    const snackMin = Number(params.get('snack'))
    if (snackMin > 0) {
      // Bloom's mini flows: `flow=desk|wake|unwind`, or whichever suits the time of day.
      const f = params.get('flow')
      const flow = f && f in MINI_FLOWS ? (f as MiniFlowKind) : undefined
      return { session: generateSnack(plan.inputs, snackMin, dayOfYear(), new Date().getHours(), flow), index: -1, snack: true }
    }
    const index = params.has('idx') ? Number(params.get('idx')) : plan.progress.sessionsCompleted
    const min = Number(params.get('min'))
    const session = generateSession(plan.inputs, plan.progress, {
      index,
      minutes: min > 0 ? min : undefined,
      swaps: swapsFor(plan, index),
    })
    return { session, index, snack: false }
  }, [plan, params])
}
