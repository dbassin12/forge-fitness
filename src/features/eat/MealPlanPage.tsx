import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeftRight, Check, RefreshCw, ShoppingCart } from 'lucide-react'
import type { MealType } from '@/data/recipes/types'
import { mealAlternatives, MEALS, recipeById, swapMeal, type MealPlan } from '@/engines/meals/planner'
import { recipeMacros } from '@/engines/nutrition/foods'
import { formatShortDate, isoWeekday, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { regeneratePlan, savePlan, useMealPlan } from '@/state/meals'
import { addEntry, entryForRecipe } from '@/state/nutrition'
import { useProfile } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Sheet } from '@/ui/Sheet'
import { MEAL_LABEL } from './labels'

export default function MealPlanPage() {
  const profile = useProfile()
  const plan = useMealPlan(profile)
  const navigate = useNavigate()
  const today = todayISO()
  const [day, setDay] = useState(today)
  const [swap, setSwap] = useState<{ meal: MealType } | null>(null)
  const [logged, setLogged] = useState<Set<string>>(new Set())

  if (!profile || !plan) return <PageHeader title="Meal plan" back="/eat" subtitle="Building your week…" />
  const current = plan.days.find((d) => d.date === day) ?? plan.days[0]

  return (
    <>
      <PageHeader
        title="Meal plan"
        subtitle={`~${plan.kcal.toLocaleString()} kcal · ${plan.protein} g protein a day${profile.diet === 'kosher' ? ' · kosher-style' : profile.diet !== 'none' ? ` · ${profile.diet}` : ''}`}
        back="/eat"
        right={
          <button aria-label="New plan" onClick={() => void regeneratePlan(profile)} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
            <RefreshCw size={19} />
          </button>
        }
      />
      <div className="px-4">
        <div className="grid grid-cols-7 gap-1">
          {plan.days.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setDay(d.date)}
              className={cx('flex flex-col items-center rounded-xl py-2 text-xs', d.date === current.date ? 'bg-ember text-on-accent' : 'bg-surface text-muted')}
            >
              <span className="font-semibold">{WEEKDAY_SHORT[isoWeekday(d.date) - 1].slice(0, 2)}</span>
              <span className="tabular">{Number(d.date.slice(8))}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-baseline justify-between px-1 text-sm">
          <span className="font-semibold">{current.date === today ? 'Today' : formatShortDate(current.date)}</span>
          <span className="text-muted tabular">
            {current.totals.kcal.toLocaleString()} kcal · {Math.round(current.totals.protein)} g protein
          </span>
        </div>
        <div className="mt-2 space-y-3">
          {MEALS.map((meal) => {
            const pm = current.meals.find((m) => m.meal === meal)
            const r = pm ? recipeById(pm.recipeId) : undefined
            if (!pm || !r) return null
            const key = `${current.date}:${meal}`
            return (
              <Card key={meal} className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">{MEAL_LABEL[meal]}</span>
                  <span className="text-xs text-muted">{r.prepMin + r.cookMin} min</span>
                </div>
                <Link to={`/recipe/${r.id}?servings=${pm.servings}`} className="mt-1 block">
                  <div className="font-semibold">{r.name}</div>
                  <div className="mt-0.5 line-clamp-2 text-sm text-muted">{r.blurb}</div>
                  <div className="mt-1 text-xs text-muted">
                    {pm.servings} serving{pm.servings === 1 ? '' : 's'} · {pm.macros.kcal} kcal · {Math.round(pm.macros.protein)} g protein
                  </div>
                </Link>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="secondary" size="sm" icon={<ArrowLeftRight size={15} />} onClick={() => setSwap({ meal })}>
                    Swap
                  </Button>
                  <Button
                    size="sm"
                    disabled={logged.has(key) || current.date > today}
                    icon={logged.has(key) ? <Check size={15} /> : undefined}
                    onClick={async () => {
                      const e = entryForRecipe(r.id, pm.servings, current.date, meal)
                      if (e) await addEntry(e, profile)
                      setLogged((s) => new Set(s).add(key))
                    }}
                  >
                    {logged.has(key) ? 'Logged' : current.date > today ? 'Upcoming' : 'Log it'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
        <Button block size="lg" className="mt-5" icon={<ShoppingCart size={18} />} onClick={() => navigate('/eat/grocery')}>
          Grocery list
        </Button>
        <p className="mt-3 px-1 text-xs text-faint">Plans refresh each week and follow your calorie and protein targets. Tap ↻ for a different set of meals.</p>
      </div>
      <SwapMealSheet plan={plan} date={current.date} meal={swap?.meal ?? null} avoid={profile.avoidFoods} onClose={() => setSwap(null)} />
    </>
  )
}

function SwapMealSheet({ plan, date, meal, avoid, onClose }: { plan: MealPlan; date: string; meal: MealType | null; avoid: string[]; onClose: () => void }) {
  const alts = meal ? mealAlternatives(plan, date, meal, avoid) : []
  return (
    <Sheet open={!!meal} onClose={onClose} title={meal ? `Swap ${MEAL_LABEL[meal].toLowerCase()}` : ''}>
      <ul className="space-y-2">
        {alts.map((r) => {
          const m = recipeMacros(r)
          return (
            <li key={r.id}>
              <button
                type="button"
                className="w-full rounded-2xl border border-line bg-surface p-3 text-left"
                onClick={async () => {
                  if (meal) await savePlan(swapMeal(plan, date, meal, r.id))
                  onClose()
                }}
              >
                <div className="font-semibold">{r.name}</div>
                <div className="text-sm text-muted">
                  {r.prepMin + r.cookMin} min · {m.kcal} kcal · {Math.round(m.protein)} g protein per serving
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}
