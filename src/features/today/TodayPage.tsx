import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, Bot, Check, ChevronRight, Coffee, Droplet, Flame, Lightbulb, Play, Plus, Scale, Utensils, Zap } from 'lucide-react'
import { db, kvGet, kvSet } from '@/db/db'
import { getExercise } from '@/data/exercises'
import { levelTitle, weeklyStreak } from '@/engines/gamification'
import { generateSession, mainExercises, upcomingDays } from '@/engines/plan'
import { waterPace } from '@/engines/nutrition/day'
import { weekReview } from '@/engines/review'
import { tipOfTheDay } from '@/engines/tips'
import { addDays, daysBetween, formatShortDate, isoWeekday, parseISODate, startOfWeek, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { useAiAvailability } from '@/state/ai'
import { planDates, useLevel } from '@/state/gamification'
import { addWater, OZ_ML, targetsFor, totalsOf, useDay, useNutritionSettings } from '@/state/nutrition'
import { swapsFor, usePlan } from '@/state/plan'
import { updateProfile } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Chip } from '@/ui/Chip'
import { CalorieRing, MacroBar } from '../eat/Rings'

function greeting(h: number) {
  return h < 5 ? 'Up early' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function TodayPage() {
  const plan = usePlan()
  const navigate = useNavigate()
  const today = todayISO()
  const day = useDay(today)
  const settings = useNutritionSettings()
  const level = useLevel()
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').toArray(), [])
  const reviewDismissed = useLiveQuery(async () => (await kvGet<string>('review.dismissed')) ?? '', [])
  const remindersOn = useLiveQuery(async () => !!(await kvGet<{ enabled?: boolean }>('reminders'))?.enabled, [])
  const ai = useAiAvailability()
  const lastWeek = addDays(startOfWeek(today), -7)
  const reviewFood = useLiveQuery(() => db.foodLogs.where('date').between(lastWeek, addDays(lastWeek, 6), true, true).toArray(), [lastWeek])
  const reviewWeights = useLiveQuery(() => db.weights.where('date').between(lastWeek, addDays(lastWeek, 6), true, true).toArray(), [lastWeek])

  const derived = useMemo(() => {
    if (!plan || !workouts || !day) return null
    const p = plan.profile
    const now = new Date()
    const wd = isoWeekday(today)
    const doneToday = workouts.filter((w) => w.date === today && w.kind !== 'test')
    const planDoneToday = doneToday.find((w) => w.kind === 'plan')
    const trainingDay = p.trainingDays.includes(wd)
    const index = plan.progress.sessionsCompleted
    const next = generateSession(plan.inputs, plan.progress, { index, swaps: swapsFor(plan, index) })
    const upcoming = upcomingDays(plan.inputs, p.trainingDays, index, addDays(today, 1), 1)[0]
    const streak = weeklyStreak(planDates(workouts), p.daysPerWeek, today)
    const targets = targetsFor(p, day, settings)
    const eaten = totalsOf(day.logs)
    // Did the most recent training day pass without a workout?
    let missed = false
    for (let k = 1; k <= 7; k++) {
      const d = addDays(today, -k)
      if (p.trainingDays.includes(isoWeekday(d))) {
        missed = !workouts.some((w) => w.date === d && w.kind === 'plan')
        break
      }
    }
    const tip = tipOfTheDay({
      date: today,
      hour: now.getHours(),
      weekday: wd,
      goal: p.goal,
      trainingDay,
      workoutDoneToday: !!planDoneToday,
      daysSinceStart: daysBetween(p.createdAt.slice(0, 10), today),
      missedLastWorkout: missed,
      streakWeeks: streak.weeks,
      proteinBehind: day.logs.length > 0 && now.getHours() >= 14 && eaten.protein < targets.protein * 0.5,
      waterBehind: day.waterMl < targets.waterMl * waterPace(now.getHours()) - 400,
      overCalories: eaten.kcal > targets.kcal * 1.1,
      underCalories: now.getHours() >= 19 && day.logs.length > 0 && eaten.kcal < targets.kcal * 0.6,
      shortSessions: p.sessionMinutes <= 15,
      hasDumbbells: p.equipment.dumbbells.some((d) => d.found),
    })
    return { p, wd, planDoneToday, doneToday, trainingDay, next, upcoming, streak, targets, eaten, tip, missed }
  }, [plan, workouts, day, settings, today])

  const review = useMemo(() => {
    if (!plan || !workouts || !reviewFood || !reviewWeights) return null
    const byDay = new Map<string, { kcal: number; protein: number }>()
    for (const f of reviewFood) {
      const cur = byDay.get(f.date) ?? { kcal: 0, protein: 0 }
      byDay.set(f.date, { kcal: cur.kcal + f.kcal, protein: cur.protein + f.protein })
    }
    const t = targetsFor(plan.profile)
    const prevWeek = addDays(lastWeek, -7)
    const prevDone = workouts.filter((w) => w.kind === 'plan' && w.date >= prevWeek && w.date < lastWeek).length
    return weekReview({
      weekOf: lastWeek,
      workouts: workouts.map((w) => ({ date: w.date, kind: w.kind, minutes: (w.finishedAt - w.startedAt) / 60000 })),
      daysPerWeek: plan.profile.daysPerWeek,
      sessionMinutes: plan.profile.sessionMinutes,
      food: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
      kcalTarget: t.kcal,
      proteinTarget: t.protein,
      weights: reviewWeights,
      lastWeekCompletion: prevDone / Math.max(1, plan.profile.daysPerWeek),
    })
  }, [plan, workouts, reviewFood, reviewWeights, lastWeek])

  if (!plan || !derived || !day) return <div className="grid h-[60vh] place-items-center text-muted animate-pulse-soft">Loading…</div>
  const { p, planDoneToday, trainingDay, next, upcoming, streak, targets, eaten, tip } = derived
  const items = mainExercises(next)
  const showReview = review && plan.progress.sessionsCompleted > 0 && isoWeekday(today) <= 2 && reviewDismissed !== lastWeek && parseISODate(p.createdAt.slice(0, 10)) < parseISODate(lastWeek)
  const imperial = p.units === 'imperial'
  const lite = p.trackingMode === 'lite'

  return (
    <div className="px-4 safe-top">
      <header className="pt-5 pb-3">
        <div className="text-sm text-muted">{parseISODate(today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <h1 className="font-display text-[28px] font-bold leading-tight">
          {greeting(new Date().getHours())}
          {p.name ? `, ${p.name}` : ''}
        </h1>
      </header>

      {showReview && review ? (
        <Card className="mb-3 border-violet/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet">Last week in review</div>
          <div className="mt-1 font-semibold">{review.headline}</div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-muted">
            <li>
              Workouts: <b className="text-ink">{review.workouts}/{review.target}</b>
            </li>
            <li>
              Minutes: <b className="text-ink">{review.minutes}</b>
            </li>
            {review.avgKcal ? (
              <li>
                Avg calories: <b className="text-ink">{Math.round(review.avgKcal).toLocaleString()}</b>
              </li>
            ) : null}
            {review.loggedDays ? (
              <li>
                Protein days: <b className="text-ink">{review.proteinDays}/{review.loggedDays}</b>
              </li>
            ) : null}
            {review.weightDeltaKg !== undefined ? (
              <li>
                Weight:{' '}
                <b className="text-ink">
                  {review.weightDeltaKg >= 0 ? '+' : ''}
                  {(imperial ? review.weightDeltaKg * 2.20462 : review.weightDeltaKg).toFixed(1)} {imperial ? 'lb' : 'kg'}
                </b>
              </li>
            ) : null}
          </ul>
          {review.suggestion ? (
            <div className="mt-3">
              <p className="text-sm">{review.suggestion.text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {review.suggestion.options.map((o) => (
                  <Chip
                    key={o.label}
                    onClick={async () => {
                      await updateProfile({ ...(o.daysPerWeek ? { daysPerWeek: o.daysPerWeek, trainingDays: spread(o.daysPerWeek, p.trainingDays) } : {}), ...(o.sessionMinutes ? { sessionMinutes: o.sessionMinutes } : {}) })
                      await kvSet('review.dismissed', lastWeek)
                    }}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
          <Button size="sm" variant="ghost" className="mt-2 -ml-2" onClick={() => void kvSet('review.dismissed', lastWeek)}>
            Got it
          </Button>
        </Card>
      ) : null}

      {planDoneToday ? (
        <Card className="border-good/40 bg-good/5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-good text-on-accent">
              <Check size={24} strokeWidth={3} />
            </span>
            <div className="flex-1">
              <div className="font-semibold">Workout done — nice!</div>
              <div className="text-sm text-muted">
                {planDoneToday.title} · {Math.max(1, Math.round((planDoneToday.finishedAt - planDoneToday.startedAt) / 60000))} min · +{planDoneToday.xp} XP
              </div>
            </div>
          </div>
          {upcoming ? (
            <p className="mt-3 text-sm text-muted">
              Next: {upcoming.title} on {WEEKDAY_SHORT[isoWeekday(upcoming.date) - 1]}, {formatShortDate(upcoming.date)}.
            </p>
          ) : null}
        </Card>
      ) : (
        <Card className="border-ember/40 bg-gradient-to-br from-ember/15 via-surface to-surface">
          <div className="text-xs font-semibold uppercase tracking-wider text-ember">{trainingDay ? "Today's workout" : 'Rest day — or get ahead'}</div>
          <div className="mt-1 font-display text-2xl font-bold">{next.title}</div>
          <div className="mt-0.5 text-sm text-muted">
            {next.minutes} min · ~{next.estKcal} kcal · {items.length} exercises
          </div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4">
            {items.map((it) => (
              <span key={it.exerciseId} className="shrink-0 rounded-full bg-bg/60 px-2.5 py-1 text-xs">
                {getExercise(it.exerciseId)?.name}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" icon={<Play size={20} />} onClick={() => navigate('/workout')}>
              {trainingDay ? 'Start workout' : 'Do it anyway'}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/train/session')}>
              Preview
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Zap size={15} className="text-amber" />
            <span className="text-muted">Short on time?</span>
            {[5, 10]
              .filter((m) => m < p.sessionMinutes)
              .map((m) => (
                <Chip key={m} className="h-8" onClick={() => navigate(`/workout?min=${m}`)}>
                  {m} min
                </Chip>
              ))}
            <Chip className="h-8" onClick={() => navigate('/workout?snack=3')}>
              <span className="inline-flex items-center gap-1">
                <Coffee size={13} /> 3-min snack
              </span>
            </Chip>
          </div>
        </Card>
      )}

      <Card className="mt-3">
        <Link to="/eat" className="flex items-center gap-4">
          {lite ? (
            <div className="flex-1 space-y-3">
              <MacroBar label="Protein" value={eaten.protein} target={targets.protein} tone="var(--color-ember)" />
              <MacroBar label="Water" value={day.waterMl / (imperial ? OZ_ML : 1000)} target={targets.waterMl / (imperial ? OZ_ML : 1000)} unit={imperial ? ' oz' : ' L'} tone="var(--color-sky)" />
            </div>
          ) : (
            <>
              <CalorieRing eaten={eaten.kcal} target={targets.kcal} className="h-24 w-24 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <MacroBar label="Protein" value={eaten.protein} target={targets.protein} tone="var(--color-ember)" />
                <MacroBar label="Water" value={Math.round(day.waterMl / (imperial ? OZ_ML : 1))} target={Math.round(targets.waterMl / (imperial ? OZ_ML : 1))} unit={imperial ? ' oz' : ' ml'} tone="var(--color-sky)" />
              </div>
            </>
          )}
        </Link>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button size="sm" variant="secondary" icon={<Utensils size={15} />} onClick={() => navigate('/eat/add')}>
            Food
          </Button>
          <Button size="sm" variant="secondary" icon={<Droplet size={15} />} onClick={() => void addWater(today, settings.glassOz, p)}>
            +{settings.glassOz} oz
          </Button>
          <Button size="sm" variant="secondary" icon={<Scale size={15} />} onClick={() => navigate('/progress')}>
            Weigh-in
          </Button>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Flame size={14} className="text-ember" /> Weekly streak
          </div>
          <div className="mt-1 font-display text-2xl font-bold">{streak.weeks} {streak.weeks === 1 ? 'week' : 'weeks'}</div>
          <div className="mt-1.5 flex gap-1">
            {Array.from({ length: streak.target }, (_, i) => (
              <span key={i} className={i < streak.thisWeek ? 'h-1.5 flex-1 rounded-full bg-ember' : 'h-1.5 flex-1 rounded-full bg-surface-3'} />
            ))}
          </div>
          <div className="mt-1 text-xs text-muted">
            {Math.min(streak.thisWeek, streak.target)}/{streak.target} this week
          </div>
        </Card>
        <Link to="/progress">
          <Card className="h-full p-3">
            <div className="text-xs text-muted">Level</div>
            <div className="mt-1 font-display text-2xl font-bold">
              {level?.level ?? 1} <span className="text-base font-semibold text-muted">{levelTitle(level?.level ?? 1)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-violet" style={{ width: `${(level?.progress ?? 0) * 100}%` }} />
            </div>
            <div className="mt-1 text-xs text-muted">{level ? `${level.into}/${level.span} XP` : ''}</div>
          </Card>
        </Link>
      </div>

      <Card className="mt-3 flex gap-3">
        <Lightbulb size={20} className="mt-0.5 shrink-0 text-amber" />
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">Tip of the day</div>
          {tip.title ? <div className="mt-0.5 font-semibold">{tip.title}</div> : null}
          <p className="mt-0.5 text-sm text-muted">{tip.text}</p>
        </div>
      </Card>

      {ai.status === 'ready' || ai.status === 'needs-code' ? (
        <Link to="/coach">
          <Card className="mt-3 flex items-center gap-3">
            <Bot size={20} className="shrink-0 text-ember" />
            <div className="flex-1">
              <div className="font-semibold">Ask your coach</div>
              <div className="text-sm text-muted">“What should I eat tonight?” · “Swap for sore knees?”</div>
            </div>
            <ChevronRight className="text-faint" />
          </Card>
        </Link>
      ) : null}

      {remindersOn === false && p.reminderStyle !== 'off' ? (
        <Link to="/more/reminders">
          <Card className="mt-3 flex items-center gap-3">
            <Bell size={20} className="shrink-0 text-sky" />
            <div className="flex-1">
              <div className="font-semibold">Turn on reminders</div>
              <div className="text-sm text-muted">Workout, meal and water nudges at the times you choose.</div>
            </div>
            <ChevronRight className="text-faint" />
          </Card>
        </Link>
      ) : null}

      <Link to="/train/library" className="mt-3 flex items-center justify-center gap-1.5 py-4 text-sm text-muted">
        <Plus size={15} /> Browse all exercises
      </Link>
      <div className="h-2" />
    </div>
  )
}

/** Keep existing training days when changing the count (drop the last / add a spread day). */
function spread(n: number, current: number[]): number[] {
  const sorted = [...current].sort()
  if (n <= sorted.length) return sorted.slice(0, n)
  const out = new Set(sorted)
  for (const d of [1, 3, 5, 2, 4, 6, 7]) {
    if (out.size >= n) break
    out.add(d)
  }
  return [...out].sort()
}
