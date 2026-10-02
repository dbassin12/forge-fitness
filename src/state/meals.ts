import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { kvGet, kvSet } from '@/db/db'
import type { Profile } from '@/domain/types'
import { planWeek, type MealPlan } from '@/engines/meals/planner'
import { dailyTargets } from '@/engines/nutrition/targets'
import { startOfWeek, todayISO } from '@/lib/dates'

const KEY = 'meals.plan'

function wanted(profile: Profile) {
  const t = dailyTargets(profile)
  return { weekOf: startOfWeek(todayISO()), kcal: t.kcal, protein: t.protein, diet: profile.diet }
}

function stale(plan: MealPlan | null, profile: Profile): boolean {
  if (!plan) return true
  const w = wanted(profile)
  return plan.weekOf !== w.weekOf || plan.diet !== w.diet || Math.abs(plan.kcal - w.kcal) > 60 || Math.abs(plan.protein - w.protein) > 10
}

export async function regeneratePlan(profile: Profile, seed = Date.now() % 1000): Promise<MealPlan> {
  const w = wanted(profile)
  const plan = planWeek({ ...w, avoid: profile.avoidFoods, seed })
  await kvSet(KEY, plan)
  return plan
}

export async function savePlan(plan: MealPlan): Promise<void> {
  await kvSet(KEY, plan)
}

/** This week's meal plan, (re)generated when the week, diet or targets change. */
export function useMealPlan(profile: Profile | null | undefined): MealPlan | undefined {
  const plan = useLiveQuery(async () => (await kvGet<MealPlan>(KEY)) ?? null, [])
  const needs = !!profile && plan !== undefined && stale(plan, profile)
  useEffect(() => {
    if (needs && profile) void regeneratePlan(profile, 0)
  }, [needs, profile])
  return plan && !needs ? plan : undefined
}

export function useGroceryChecks(weekOf: string | undefined): Set<string> | undefined {
  return useLiveQuery(async () => {
    const v = await kvGet<{ weekOf: string; ids: string[] }>('meals.grocery')
    return new Set(v && v.weekOf === weekOf ? v.ids : [])
  }, [weekOf])
}

export async function toggleGrocery(weekOf: string, foodId: string): Promise<void> {
  const v = await kvGet<{ weekOf: string; ids: string[] }>('meals.grocery')
  const ids = new Set(v && v.weekOf === weekOf ? v.ids : [])
  if (ids.has(foodId)) ids.delete(foodId)
  else ids.add(foodId)
  await kvSet('meals.grocery', { weekOf, ids: [...ids] })
}
