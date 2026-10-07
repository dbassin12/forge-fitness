import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { CalendarRange, ChevronLeft, ChevronRight, Copy, Droplet, Flame, Minus, Plus, ShoppingCart, Sparkles } from 'lucide-react'
import { isBloom } from '@/app/brand'
import type { FoodLogEntry, MealSlot } from '@/db/db'
import { recipeById } from '@/engines/meals/planner'
import { dayScore, nudges } from '@/engines/nutrition/day'
import { addDays, formatShortDate, todayISO } from '@/lib/dates'
import { useProfile } from '@/state/store'
import { useMealPlan } from '@/state/meals'
import {
  addEntry,
  addWater,
  copyDay,
  entryForRecipe,
  OZ_ML,
  produceServings,
  removeEntry,
  targetsFor,
  totalsOf,
  undoWater,
  updateEntry,
  useDay,
  useNutritionSettings,
} from '@/state/nutrition'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Sheet } from '@/ui/Sheet'
import { Stepper } from '@/ui/Stepper'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { CalorieRing, MacroBar } from './Rings'
import { WaterGlass } from './WaterGlass'
import { MEAL_LABEL } from './labels'

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack']

function dayLabel(d: string) {
  const t = todayISO()
  if (d === t) return 'Today'
  if (d === addDays(t, -1)) return 'Yesterday'
  if (d === addDays(t, 1)) return 'Tomorrow'
  return formatShortDate(d)
}

export default function EatPage() {
  const profile = useProfile()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const date = params.get('d') ?? todayISO()
  const day = useDay(date)
  const settings = useNutritionSettings()
  const plan = useMealPlan(profile)
  const [edit, setEdit] = useState<FoodLogEntry | null>(null)
  const [editServings, setEditServings] = useState(1)

  const derived = useMemo(() => {
    if (!profile || !day) return null
    const targets = targetsFor(profile, day, settings)
    const eaten = totalsOf(day.logs)
    const produce = produceServings(day.logs)
    const logged = day.logs.length > 0
    const hour = date === todayISO() ? new Date().getHours() : 22
    return {
      targets,
      eaten,
      produce,
      score: dayScore({ eaten, targets, produce, waterMl: day.waterMl, mode: profile.trackingMode, logged }),
      nudges: nudges({ eaten, targets, waterMl: day.waterMl, produce, hour, diet: profile.diet, mode: profile.trackingMode, logged, units: profile.units }),
    }
  }, [profile, day, settings, date])

  if (!profile || !day || !derived) return <PageHeader title={isBloom ? 'Nourish' : 'Eat'} />
  const { targets, eaten, produce, score } = derived
  const lite = profile.trackingMode === 'lite'
  const imperial = profile.units === 'imperial'
  const glassMl = settings.glassOz * OZ_ML
  const glasses = Math.round(day.waterMl / glassMl)
  const glassTarget = Math.ceil(targets.waterMl / glassMl)
  const planned = plan?.days.find((d) => d.date === date)
  const go = (d: string) => setParams(d === todayISO() ? {} : { d }, { replace: true })

  return (
    <>
      <PageHeader
        title={isBloom ? 'Nourish' : 'Eat'}
        subtitle={lite ? (isBloom ? 'Protein, fruit & veg, water' : 'Lite: protein, produce, water') : `${targets.kcal.toLocaleString()} kcal · ${targets.protein} g protein`}
        right={
          <div className="flex items-center rounded-full border border-line bg-surface">
            <button aria-label="Previous day" className="grid h-9 w-9 place-items-center text-muted" onClick={() => go(addDays(date, -1))}>
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-[4.5rem] text-center text-sm font-semibold">{dayLabel(date)}</span>
            <button aria-label="Next day" className="grid h-9 w-9 place-items-center text-muted disabled:opacity-30" disabled={date >= todayISO()} onClick={() => go(addDays(date, 1))}>
              <ChevronRight size={18} />
            </button>
          </div>
        }
      />
      <div className="px-4">
        <Card>
          {lite ? (
            <div className="space-y-4">
              <MacroBar label="Protein" value={eaten.protein} target={targets.protein} tone="var(--color-ember)" />
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">Fruit & veg</span>
                  <span className="text-muted tabular">{produce}/5 servings</span>
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={cx('h-2 flex-1 rounded-full', i < produce ? 'bg-lime' : 'bg-surface-3')} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <CalorieRing eaten={eaten.kcal} target={targets.kcal} className="h-32 w-32 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <MacroBar label="Protein" value={eaten.protein} target={targets.protein} tone="var(--color-ember)" />
                <MacroBar label="Carbs" value={eaten.carbs} target={targets.carbs} tone="var(--color-sky)" />
                <MacroBar label="Fat" value={eaten.fat} target={targets.fat} tone="var(--color-amber)" />
              </div>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3 text-sm text-muted">
            {!lite ? (
              <span>
                {Math.round(eaten.kcal).toLocaleString()} eaten
                {day.burnedKcal && !isBloom ? (
                  <>
                    {' '}
                    · <Flame size={13} className="inline text-ember" /> {day.burnedKcal} burned
                  </>
                ) : null}
              </span>
            ) : (
              <span>{Math.round(eaten.kcal).toLocaleString()} kcal logged</span>
            )}
            <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-semibold', score.score >= 80 ? 'bg-good/15 text-good' : score.score >= 50 ? 'bg-amber/15 text-amber' : 'bg-surface-2 text-muted')}>
              Score {score.score}
            </span>
          </div>
        </Card>

        {derived.nudges.length && date === todayISO() ? (
          <div className="mt-3 space-y-2">
            {derived.nudges.slice(0, 2).map((n) => (
              <Card key={n.id} className="flex gap-3 py-3">
                <Sparkles size={18} className="mt-0.5 shrink-0 text-amber" />
                <div className="text-sm">
                  <div>{n.text}</div>
                  {n.ideas?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {n.ideas.map((i) => (
                        <button
                          key={i.foodId}
                          type="button"
                          onClick={() => navigate(`/eat/add?meal=snack&food=${i.foodId}${date !== todayISO() ? `&d=${date}` : ''}`)}
                          className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-xs"
                        >
                          {i.name.split(',')[0]} · {i.protein} g
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        <Card className="mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Droplet size={18} className="text-sky" /> Water
            </div>
            <div className="text-sm text-muted tabular">
              {imperial ? `${Math.round(day.waterMl / OZ_ML)} / ${Math.round(targets.waterMl / OZ_ML)} oz` : `${(day.waterMl / 1000).toFixed(1)} / ${(targets.waterMl / 1000).toFixed(1)} L`}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <WaterGlass level={targets.waterMl ? day.waterMl / targets.waterMl : 0} className="h-24 w-20 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl font-bold tabular">
                {glasses} <span className="text-base font-semibold text-muted">of {glassTarget} glasses</span>
              </div>
              <div className="text-sm text-muted">
                {glasses >= glassTarget ? 'Goal reached. Nicely hydrated! 💧' : `${glassTarget - glasses} more to go`}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Remove a glass"
                  onClick={() => void undoWater(date)}
                  disabled={glasses === 0}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-surface-2 active:scale-90 disabled:opacity-30"
                >
                  <Minus size={18} />
                </button>
                <button
                  type="button"
                  aria-label={`Add a ${settings.glassOz} oz glass`}
                  onClick={() => {
                    sfx.bloop()
                    haptic('medium')
                    void addWater(date, settings.glassOz, profile)
                  }}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-sky px-4 font-semibold text-on-accent shadow-[0_8px_20px_-10px_var(--color-sky)] active:scale-95"
                >
                  <Plus size={18} strokeWidth={3} /> {settings.glassOz} oz
                </button>
              </div>
            </div>
          </div>
        </Card>

        {SLOTS.map((slot) => {
          const items = day.logs.filter((l) => l.meal === slot)
          const kcal = Math.round(items.reduce((s, l) => s + l.kcal, 0))
          const plannedMeal = planned?.meals.find((m) => m.meal === slot)
          const recipe = plannedMeal ? recipeById(plannedMeal.recipeId) : undefined
          const alreadyLogged = !!plannedMeal && items.some((l) => l.refId === plannedMeal.recipeId)
          return (
            <section key={slot}>
              <SectionTitle
                action={
                  <span className="text-xs text-muted tabular">
                    {kcal} kcal
                  </span>
                }
              >
                {MEAL_LABEL[slot]}
              </SectionTitle>
              <Card className="py-1">
                {items.length ? (
                  <ul className="divide-y divide-line/60">
                    {items.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 py-2.5 text-left"
                          onClick={() => {
                            setEdit(l)
                            setEditServings(l.servings)
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{l.name}</div>
                            <div className="text-xs text-muted">
                              {l.servings !== 1 && !l.servingLabel.includes('serving') ? `${l.servings} × ` : ''}
                              {l.servingLabel} · {Math.round(l.protein)} g protein
                            </div>
                          </div>
                          <div className="text-sm font-semibold tabular">{Math.round(l.kcal)}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {recipe && plannedMeal && !alreadyLogged ? (
                  <div className={cx('flex items-center gap-3 py-2.5', items.length > 0 && 'border-t border-line/60')}>
                    <CalendarRange size={18} className="shrink-0 text-violet" />
                    <Link to={`/recipe/${recipe.id}`} className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">Planned: {recipe.name}</div>
                      <div className="text-xs text-muted">
                        {plannedMeal.servings} serving{plannedMeal.servings === 1 ? '' : 's'} · {plannedMeal.macros.kcal} kcal · {Math.round(plannedMeal.macros.protein)} g protein
                      </div>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const e = entryForRecipe(recipe.id, plannedMeal.servings, date, slot)
                        if (e) void addEntry(e, profile)
                      }}
                    >
                      Log
                    </Button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(`/eat/add?meal=${slot}${date !== todayISO() ? `&d=${date}` : ''}`)}
                  className={cx('flex w-full items-center gap-2 py-3 text-sm font-medium text-ember', (items.length > 0 || (!!recipe && !alreadyLogged)) && 'border-t border-line/60')}
                >
                  <Plus size={18} /> Add food
                </button>
              </Card>
            </section>
          )
        })}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            icon={<Copy size={16} />}
            onClick={async () => {
              const n = await copyDay(addDays(date, -1), date, profile)
              if (!n) alert('Nothing logged the day before.')
            }}
          >
            Copy previous day
          </Button>
          <Button variant="secondary" icon={<ShoppingCart size={16} />} onClick={() => navigate('/eat/plan')}>
            Meal plan
          </Button>
        </div>
        <p className="mt-3 px-1 text-xs text-faint">
          Targets: {targets.kcal.toLocaleString()} kcal (maintenance ≈ {targets.tdee.toLocaleString()}), {targets.protein} g protein, {targets.carbs} g carbs, {targets.fat} g fat,{' '}
          {targets.fiber} g fiber. Estimates only — adjust if your weight trend says otherwise.
        </p>
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit?.name}>
        {edit ? (
          <div>
            <div className="text-sm text-muted">{edit.servingLabel}</div>
            <div className="mt-4 flex justify-center">
              <Stepper value={editServings} onChange={setEditServings} min={0.25} max={20} step={0.25} label="servings" unit="×" />
            </div>
            <div className="mt-3 text-center text-sm text-muted">
              {Math.round((edit.kcal / edit.servings) * editServings)} kcal · {Math.round((edit.protein / edit.servings) * editServings)} g protein
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                variant="danger"
                onClick={async () => {
                  await removeEntry(edit.id)
                  setEdit(null)
                }}
              >
                Delete
              </Button>
              <Button
                onClick={async () => {
                  const k = editServings / edit.servings
                  await updateEntry(
                    edit.id,
                    {
                      servings: editServings,
                      kcal: edit.kcal * k,
                      protein: edit.protein * k,
                      carbs: edit.carbs * k,
                      fat: edit.fat * k,
                      fiber: (edit.fiber ?? 0) * k,
                      produceServings: edit.produceServings ? Math.round(edit.produceServings * k * 2) / 2 : undefined,
                    },
                    profile,
                  )
                  setEdit(null)
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : null}
      </Sheet>
    </>
  )
}
