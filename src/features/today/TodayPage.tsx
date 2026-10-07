import { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, Bot, Check, ChevronRight, Coffee, Droplet, Eye, Play, Plus, Scale, Settings, Utensils, X, Zap } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { useCelebrate } from '@/app/celebrate'
import { usePalette } from '@/app/theme'
import { db, kvGet, kvSet } from '@/db/db'
import { getExercise, highlightFor, motionFor } from '@/data/exercises'
import { weeklyStreak } from '@/engines/gamification'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { generateSession, mainExercises, upcomingDays } from '@/engines/plan'
import { waterPace } from '@/engines/nutrition/day'
import { weekReview } from '@/engines/review'
import { tipOfTheDay } from '@/engines/tips'
import { addDays, daysBetween, formatShortDate, isoWeekday, parseISODate, startOfWeek, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { planDates, useLevel } from '@/state/gamification'
import { addWater, OZ_ML, targetsFor, totalsOf, useDay, useNutritionSettings } from '@/state/nutrition'
import { swapsFor, usePlan } from '@/state/plan'
import { useQuests } from '@/state/quests'
import { useStarter } from '@/state/starter'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Chip } from '@/ui/Chip'
import { usePrefs } from '@/app/prefs'
import { MASCOT_GEAR, Mascot, mascotMood, type MascotMood } from '@/ui/Mascot'
import { ProgressRing } from '@/ui/ProgressRing'
import { unlockAudio } from '@/voice/beeps'
import { CalorieRing, MacroBar } from '../eat/Rings'
import { QuestCard } from './QuestCard'
import { StarterCard } from './StarterCard'
import { StreakCard } from './StreakCard'

const MOOD_LINE: Record<MascotMood, string> = {
  cheer: 'Ember: perfect day! 💎',
  fired: 'Ember: you trained today 🔥',
  happy: 'Ember: nice progress',
  calm: 'Ember’s tip of the day',
  sleepy: 'Ember: rest well tonight',
}

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
  const palette = usePalette()
  const quests = useQuests(plan?.profile)
  const starter = useStarter()
  const gear = usePrefs((s) => s.gear)
  const [params, setParams] = useSearchParams()
  const waterDone = useRef(false)

  // Home Screen shortcut "Log a glass of water" opens /today?water=1.
  useEffect(() => {
    if (params.get('water') !== '1' || !plan || waterDone.current) return
    waterDone.current = true
    setParams({}, { replace: true })
    void addWater(today, settings.glassOz, plan.profile).then(() => {
      sfx.bloop()
      useCelebrate.getState().toast({ tone: 'info', title: `+${settings.glassOz} oz of water`, text: 'Logged from your Home Screen shortcut', emoji: '💧' })
    })
  }, [params, plan, settings.glassOz, setParams, today])
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').toArray(), [])
  const reviewDismissed = useLiveQuery(async () => (await kvGet<string>('review.dismissed')) ?? '', [])
  const remindersOn = useLiveQuery(async () => !!(await kvGet<{ enabled?: boolean }>('reminders'))?.enabled, [])
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
  const mood = mascotMood({
    hour: new Date().getHours(),
    workoutDone: !!planDoneToday,
    perfect: !!quests?.perfect,
    anyProgress: (quests?.doneCount ?? 0) > 0 || derived.doneToday.length > 0,
  })
  const items = mainExercises(next)
  const firstEx = items[0] ? getExercise(items[0].exerciseId) : undefined
  const showReview = review && plan.progress.sessionsCompleted > 0 && isoWeekday(today) <= 2 && reviewDismissed !== lastWeek && parseISODate(p.createdAt.slice(0, 10)) < parseISODate(lastWeek)
  const imperial = p.units === 'imperial'
  const lite = p.trackingMode === 'lite'

  return (
    <div className="px-4 safe-top">
      <header className="flex items-center gap-3 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted">{parseISODate(today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 className="truncate font-display text-[28px] font-bold leading-tight">
            {greeting(new Date().getHours())}
            {p.name ? `, ${p.name}` : ''}
          </h1>
        </div>
        <Link to="/progress" viewTransition aria-label={`Level ${level?.level ?? 1}, ${level ? `${level.into} of ${level.span} XP` : ''}`} className="pressable">
          <ProgressRing progress={level?.progress ?? 0} size={46} stroke={4} color="var(--color-violet)">
            <span className="block text-[9px] font-semibold uppercase leading-none text-muted">Lv</span>
            <span className="block font-display text-base font-black leading-none tabular">{level?.level ?? 1}</span>
          </ProgressRing>
        </Link>
        <Link to="/more" viewTransition aria-label="Settings" className="pressable grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-muted">
          <Settings size={20} />
        </Link>
      </header>

      {showReview && review ? (
        <div className="mb-3 flex items-center gap-3 rounded-[var(--radius-card)] border border-violet/40 bg-gradient-to-r from-violet/20 via-surface to-surface p-3">
          <Link to="/recap" viewTransition className="pressable flex min-w-0 flex-1 items-center gap-3" aria-label="Watch your week in review">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-ember via-amber to-violet p-[3px]">
              <span className="grid h-full w-full place-items-center rounded-full bg-surface text-2xl">🎬</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-violet">Your week in review</span>
              <span className="block truncate font-semibold">{review.headline}</span>
              <span className="block text-sm text-muted">Tap to watch · 30 seconds</span>
            </span>
          </Link>
          <button type="button" aria-label="Skip the recap" onClick={() => void kvSet('review.dismissed', lastWeek)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-faint hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>
      ) : null}

      {planDoneToday ? (
        <Card className="border-good/40 bg-gradient-to-br from-good/15 via-surface to-surface">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 animate-bounce-in place-items-center rounded-2xl bg-good text-on-accent shadow-[0_8px_24px_-10px_var(--color-good)]">
              <Check size={26} strokeWidth={3} />
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
        <Card className="relative overflow-hidden border-ember/40 bg-gradient-to-br from-ember/20 via-surface to-surface">
          <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-ember/20 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-ember">{trainingDay ? "Today's workout" : 'Rest day — or get ahead'}</div>
              <div className="mt-1 font-display text-2xl font-bold leading-tight">{next.title}</div>
              <div className="mt-1 text-sm text-muted">
                {next.minutes} min · ~{next.estKcal} kcal · {items.length} moves
              </div>
            </div>
            {firstEx ? (
              <Link to="/train/session" viewTransition aria-label="Preview the workout" className="pressable -mr-1 w-28 shrink-0 overflow-hidden rounded-2xl border border-line/70 bg-bg/50">
                <Mannequin motion={motionFor(firstEx)} palette={palette} pulse={highlightFor(firstEx).primary} speed={0.85} className="aspect-[4/3] w-full" title={`${firstEx.name} preview`} />
              </Link>
            ) : null}
          </div>
          <div className="no-scrollbar relative -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4">
            {items.map((it) => (
              <span key={it.exerciseId} className="shrink-0 rounded-full bg-bg/60 px-2.5 py-1 text-xs">
                {getExercise(it.exerciseId)?.name}
              </span>
            ))}
          </div>
          <div className="relative mt-4 flex gap-2">
            <Button
              size="lg"
              className="flex-1 animate-glow"
              icon={<Play size={20} fill="currentColor" />}
              onClick={() => {
                unlockAudio()
                sfx.whoosh()
                navigate('/workout', { viewTransition: true })
              }}
            >
              {trainingDay ? 'Start workout' : 'Do it anyway'}
            </Button>
            <Button size="lg" variant="secondary" aria-label="Preview workout" className="w-14 px-0" icon={<Eye size={20} />} onClick={() => navigate('/train/session', { viewTransition: true })} />
          </div>
          <div className="relative mt-3 flex flex-wrap items-center gap-2 text-sm">
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

      {starter ? <StarterCard starter={starter} /> : null}

      {quests ? <QuestCard board={quests} /> : null}

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
          <Button
            size="sm"
            variant="secondary"
            icon={<Droplet size={15} className="text-sky" />}
            onClick={() => {
              sfx.bloop()
              haptic('medium')
              void addWater(today, settings.glassOz, p)
            }}
          >
            +{settings.glassOz} oz
          </Button>
          <Button size="sm" variant="secondary" icon={<Scale size={15} />} onClick={() => navigate('/progress')}>
            Weight
          </Button>
        </div>
      </Card>

      <StreakCard streak={streak} workouts={workouts ?? []} trainingDays={p.trainingDays} today={today} />

      <Card className="mt-3 flex items-start gap-3">
        <Mascot mood={mood} size={60} className="mt-1" gear={gear && (level?.level ?? 1) >= (MASCOT_GEAR.find((g) => g.id === gear)?.level ?? 99) ? gear : null} />
        <div className="relative min-w-0 flex-1 rounded-2xl rounded-tl-md bg-surface-2 p-3">
          <span aria-hidden className="absolute top-3 -left-1.5 h-3 w-3 rotate-45 bg-surface-2" />
          <div className="text-xs font-semibold uppercase tracking-wider text-ember">{MOOD_LINE[mood]}</div>
          {tip.title ? <div className="mt-0.5 font-semibold">{tip.title}</div> : null}
          <p className="mt-0.5 text-sm text-muted">{tip.text}</p>
        </div>
      </Card>

      <Link to="/coach">
        <Card className="mt-3 flex items-center gap-3">
          <Bot size={20} className="shrink-0 text-ember" />
          <div className="flex-1">
            <div className="font-semibold">Ask Claude</div>
            <div className="text-sm text-muted">“What should I eat tonight?” · “Swap for sore knees?”</div>
          </div>
          <ChevronRight className="text-faint" />
        </Card>
      </Link>

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
