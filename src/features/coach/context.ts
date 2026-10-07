import { db, type FoodLogEntry, type WeightEntry, type WorkoutLog } from '@/db/db'
import type { ISODate, Profile } from '@/domain/types'
import { getExercise } from '@/data/exercises'
import { weeklyStreak } from '@/engines/gamification'
import { describeTarget, generateSession, LADDERS, laddersFor, planInputsFromProfile, programName, upcomingDays, type PlannedSession } from '@/engines/plan'
import type { ProgressState } from '@/engines/plan/types'
import type { Targets } from '@/engines/nutrition/targets'
import { addDays, isoWeekday, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { formatHeight, formatWeight, mlToOz } from '@/lib/units'
import { loadDay, loadNutritionSettings, produceServings, targetsFor, totalsOf, type DayData } from '@/state/nutrition'
import { planDates } from '@/state/gamification'
import { loadSessionSwaps } from '@/state/store'

/** Everything the coach is told about, gathered from the phone's own database. */
export interface CoachData {
  now: Date
  profile: Profile
  progress: ProgressState
  next: PlannedSession
  nextDate: ISODate | null
  today: DayData
  targets: Targets
  /** Workouts in the 7 days before today, plus today's. */
  workouts: WorkoutLog[]
  /** Daily food totals for the 7 days before today (days with anything logged). */
  food: { date: ISODate; kcal: number; protein: number }[]
  weights: WeightEntry[]
  planDates: ISODate[]
}

const GOAL: Record<Profile['goal'], string> = { lose_fat: 'lose fat', build_muscle: 'build muscle', get_stronger: 'get stronger', general_fitness: 'feel fit and healthy' }
const DIET: Record<Profile['diet'], string> = { none: 'no restrictions', vegetarian: 'vegetarian', vegan: 'vegan', pescatarian: 'pescatarian', kosher: 'kosher-style (no pork or shellfish, no meat with dairy)' }
const ACHE: Record<Profile['aches'][number], string> = { knees: 'knees', lower_back: 'lower back', shoulders: 'shoulders', wrists: 'wrists', neck: 'neck', hips: 'hips', pregnancy: 'pregnant' }
const FEEL = { easy: 'too easy', right: 'just right', hard: 'too hard' } as const
const FEEL_YOGA = { easy: 'too gentle', right: 'just right', hard: 'too much' } as const
const INTENTION: Record<NonNullable<Profile['intentions']>[number], string> = {
  calm: 'feel calmer',
  sleep: 'sleep better',
  flexibility: 'more flexibility',
  strength: 'gentle strength',
  balance: 'better balance',
  back: 'ease the back',
  energy: 'more energy',
}

const round = (n: number) => Math.round(n).toLocaleString('en-US')
const dayName = (iso: ISODate) => WEEKDAY_SHORT[isoWeekday(iso) - 1]

function clock(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()
}

function equipmentLine(p: Profile): string {
  const e = p.equipment
  if (p.program === 'yoga') {
    const props = [e.mat && 'mat or rug', e.chair && 'chair', e.wall && 'wall'].filter(Boolean)
    return `Props: ${props.length ? props.join(', ') : 'none (just the floor)'}.`
  }
  const bells = e.dumbbells.map((d) => `${d.count} × ${d.weightLb} lb${d.found ? '' : ' (owned but not found yet)'}`)
  const extras = [e.chair && 'chair', e.table && 'sturdy table', e.wall && 'wall', e.stairs && 'stairs', e.mat && 'mat', e.pullupBar && 'pull-up bar'].filter(Boolean)
  return `Equipment: ${bells.length ? `dumbbells ${bells.join(', ')}` : 'no dumbbells'}${extras.length ? `; ${extras.join(', ')}` : ''}${e.pullupBar ? '' : '; no pull-up bar'}.`
}

function sessionLine(s: PlannedSession): string {
  const main = s.blocks
    .filter((b) => b.kind === 'main' || b.kind === 'finisher')
    .map((b) => {
      const items = b.items.map((it) => `${getExercise(it.exerciseId)?.name ?? it.exerciseId} ${describeTarget(it)}${it.loadLb ? ` @ ${it.loadLb} lb` : ''}`).join(', ')
      return `${b.title} × ${b.rounds}: ${items}`
    })
  return `${s.title}, ${s.minutes} min${s.deload ? ' (lighter deload week)' : ''} — ${main.join(' | ')}`
}

function foodLine(logs: FoodLogEntry[]): string {
  if (!logs.length) return 'nothing logged yet'
  const byMeal = new Map<string, string[]>()
  for (const l of logs) byMeal.set(l.meal, [...(byMeal.get(l.meal) ?? []), `${l.name} (${round(l.kcal)} kcal, ${Math.round(l.protein)} g protein)`])
  return [...byMeal].map(([meal, items]) => `${meal}: ${items.join('; ')}`).join(' · ')
}

/** A compact, plain-text snapshot (well under the server's 8,000-character cap). */
export function formatCoachContext(d: CoachData): string {
  const p = d.profile
  const u = p.units
  const date = todayISO(d.now)
  const age = d.now.getFullYear() - p.birthYear
  const yoga = p.program === 'yoga'
  const feel = yoga ? FEEL_YOGA : FEEL
  const sessions = yoga ? 'practice' : 'workout'
  const lines: string[] = []
  lines.push(`Now: ${d.now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}, ${clock(d.now)} (their local time).`)
  lines.push(
    `Profile: ${p.name || 'no name given'}, ${p.sex === 'unspecified' ? 'sex not given' : p.sex}, ${age} years, ${formatHeight(p.heightCm, u)}, ${formatWeight(p.weightKg, u)}` +
      `${p.goalWeightKg ? `, goal weight ${formatWeight(p.goalWeightKg, u)}` : ''}. ` +
      (yoga ? `Program: gentle yoga. Intentions: ${p.intentions?.length ? p.intentions.map((i) => INTENTION[i]).join(', ') : 'none picked'}.` : `Goal: ${GOAL[p.goal]}.`) +
      ` Experience: ${p.experience}. Daily activity outside ${sessions}s: ${p.lifestyle}. Units: ${u === 'imperial' ? 'US (lb, oz)' : 'metric'}.`,
  )
  const days = `${p.daysPerWeek} days a week (${[...p.trainingDays].sort().map((n) => WEEKDAY_SHORT[n - 1]).join(', ')}) around ${p.preferredTime}`
  lines.push(
    yoga
      ? `Practice: ${days}, ${p.sessionMinutes}-minute gentle yoga practices, themes: ${programName(planInputsFromProfile(p))}. Practices completed so far: ${d.progress.sessionsCompleted}.`
      : `Training: ${days}, ${p.sessionMinutes}-minute sessions, split: ${programName(planInputsFromProfile(p))}. ` +
          `${p.quietMode ? 'Quiet mode is on (no jumping). ' : ''}Sessions completed so far: ${d.progress.sessionsCompleted}.`,
  )
  lines.push(equipmentLine(p))
  lines.push(
    `${yoga ? 'Be gentle with' : 'Aches'}: ${p.aches.length ? p.aches.map((a) => ACHE[a]).join(', ') : 'none'}. Diet: ${DIET[p.diet]}${p.avoidFoods.length ? `; avoids ${p.avoidFoods.join(', ')}` : ''}. Food tracking: ${p.trackingMode === 'lite' ? 'Lite mode (protein, veggies and water only)' : 'full'}.`,
  )

  const levels = laddersFor(p.program ?? 'strength').flatMap((id) => {
    const l = LADDERS[id]
    const rung = d.progress.ladders[id]?.rung
    if (rung === undefined) return []
    const ex = getExercise(l.exercises[Math.min(rung, l.exercises.length - 1)]!)
    return [`${l.name}: ${ex?.name ?? '?'} (level ${rung + 1} of ${l.exercises.length})`]
  })
  if (levels.length) lines.push(`Current levels: ${levels.join('; ')}.`)

  const doneToday = d.workouts.filter((w) => w.date === date)
  if (doneToday.length) lines.push(`Done today: ${doneToday.map((w) => `${w.title} (${Math.round((w.finishedAt - w.startedAt) / 60000)} min${w.feedback ? `, felt ${feel[w.feedback]}` : ''})`).join(', ')}.`)
  const when = d.nextDate === date ? 'today' : d.nextDate ? `${dayName(d.nextDate)} ${d.nextDate}` : `next ${yoga ? 'practice' : 'training'} day`
  lines.push(`Next planned ${yoga ? 'practice' : 'session'} (${when}): ${sessionLine(d.next)}.`)

  const t = d.targets
  const eaten = totalsOf(d.today.logs)
  if (p.trackingMode === 'lite') {
    lines.push(`Today so far: protein ${Math.round(eaten.protein)} of ${t.protein} g; fruit & veg ${produceServings(d.today.logs)} servings; water ${Math.round(mlToOz(d.today.waterMl))} of ${Math.round(mlToOz(t.waterMl))} oz.`)
  } else {
    lines.push(
      `Today so far: ${round(eaten.kcal)} of ${round(t.kcal)} kcal; protein ${Math.round(eaten.protein)} of ${t.protein} g; carbs ${Math.round(eaten.carbs)} of ${t.carbs} g; fat ${Math.round(eaten.fat)} of ${t.fat} g; fiber ${Math.round(eaten.fiber)} of ${t.fiber} g; ` +
        `fruit & veg ${produceServings(d.today.logs)} servings; water ${Math.round(mlToOz(d.today.waterMl))} of ${Math.round(mlToOz(t.waterMl))} oz.`,
    )
  }
  lines.push(`Logged today: ${foodLine(d.today.logs)}.`)

  const past = d.workouts.filter((w) => w.date < date).sort((a, b) => a.date.localeCompare(b.date))
  lines.push(
    `Last 7 days: ${past.length ? `${past.length} ${sessions}${past.length > 1 ? 's' : ''} — ${past.map((w) => `${dayName(w.date)} ${w.title} (${Math.round((w.finishedAt - w.startedAt) / 60000)} min${w.feedback ? `, ${feel[w.feedback]}` : ''})`).join('; ')}` : `no ${sessions}s`}.`,
  )
  if (d.food.length) {
    const avg = (k: 'kcal' | 'protein') => d.food.reduce((s, f) => s + f[k], 0) / d.food.length
    lines.push(`Food logged on ${d.food.length} of the last 7 days; on those days about ${round(avg('kcal'))} kcal and ${Math.round(avg('protein'))} g protein on average.`)
  } else lines.push('No food logged in the last 7 days.')

  const w = [...d.weights].sort((a, b) => a.date.localeCompare(b.date))
  if (w.length) {
    const last = w[w.length - 1]!
    const first = w[0]!
    lines.push(`Weigh-ins (last 30 days): ${formatWeight(last.kg, u)} on ${last.date}${w.length > 1 ? `; ${formatWeight(first.kg, u)} on ${first.date}` : ''}.`)
  }
  const streak = weeklyStreak(d.planDates, p.daysPerWeek, date)
  lines.push(`Weekly goal: ${streak.thisWeek} of ${streak.target} planned ${sessions}s done this week; streak ${streak.weeks} week${streak.weeks === 1 ? '' : 's'}.`)
  return lines.join('\n').slice(0, 7800)
}

export async function loadCoachContext(profile: Profile, progress: ProgressState, now = new Date()): Promise<string> {
  const date = todayISO(now)
  const from = addDays(date, -7)
  const inputs = planInputsFromProfile(profile)
  const [today, settings, workouts, foodLogs, weights, allWorkouts, swaps] = await Promise.all([
    loadDay(date),
    loadNutritionSettings(),
    db.workouts.where('date').between(from, date, true, true).toArray(),
    db.foodLogs.where('date').between(from, date, true, false).toArray(),
    db.weights.where('date').between(addDays(date, -30), date, true, true).toArray(),
    db.workouts.toArray(),
    loadSessionSwaps(),
  ])
  const index = progress.sessionsCompleted
  const next = generateSession(inputs, progress, { index, swaps: swaps && swaps.index === index ? swaps.swaps : undefined })
  const doneToday = workouts.some((w) => w.date === date && w.kind === 'plan')
  const nextDate = upcomingDays(inputs, profile.trainingDays, index, doneToday ? addDays(date, 1) : date, 1)[0]?.date ?? null
  const byDay = new Map<ISODate, { kcal: number; protein: number }>()
  for (const l of foodLogs) {
    const t = byDay.get(l.date) ?? { kcal: 0, protein: 0 }
    byDay.set(l.date, { kcal: t.kcal + l.kcal, protein: t.protein + l.protein })
  }
  return formatCoachContext({
    now,
    profile,
    progress,
    next,
    nextDate,
    today,
    targets: targetsFor(profile, today, settings),
    workouts,
    food: [...byDay].map(([d, t]) => ({ date: d, ...t })),
    weights,
    planDates: planDates(allWorkouts),
  })
}
