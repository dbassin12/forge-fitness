import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { BookOpen, Check, ChevronRight, Clock, Coffee, Flame, Play, Zap } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, motionFor } from '@/data/exercises'
import { db } from '@/db/db'
import {
  describeTarget,
  generateSession,
  LADDERS,
  mainExercises,
  planContext,
  resolveLadder,
  splitFor,
  splitName,
  TEMPLATES,
  upcomingDays,
  type LadderId,
  type TemplateId,
} from '@/engines/plan'
import { addDays, isoWeekday, parseISODate, startOfWeek, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { swapsFor, usePlan } from '@/state/plan'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { Chip } from '@/ui/Chip'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'

const SHORT: Record<TemplateId, string> = {
  full_a: 'A',
  full_b: 'B',
  full_c: 'C',
  upper_a: 'Up',
  upper_b: 'Up',
  lower_a: 'Lo',
  lower_b: 'Lo',
  cond_core: 'Cdio',
}

export default function TrainPage() {
  const plan = usePlan()
  const palette = usePalette()
  const navigate = useNavigate()
  const today = todayISO()
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 6)
  const logs = useLiveQuery(() => db.workouts.where('date').between(weekStart, weekEnd, true, true).toArray(), [weekStart, weekEnd])

  const next = useMemo(() => {
    if (!plan) return null
    const index = plan.progress.sessionsCompleted
    return generateSession(plan.inputs, plan.progress, { index, swaps: swapsFor(plan, index) })
  }, [plan])

  const week = useMemo(() => {
    if (!plan) return []
    const doneToday = (logs ?? []).some((l) => l.date === today && l.kind === 'plan')
    const upcoming = upcomingDays(plan.inputs, plan.profile.trainingDays, plan.progress.sessionsCompleted, doneToday ? addDays(today, 1) : today, 7)
    return Array.from({ length: 7 }, (_, k) => {
      const date = addDays(weekStart, k)
      const done = (logs ?? []).filter((l) => l.date === date)
      const planned = upcoming.find((u) => u.date === date)
      return { date, done, planned, isToday: date === today, past: date < today }
    })
  }, [plan, logs, today, weekStart])

  const levels = useMemo(() => {
    if (!plan) return []
    const ctx = planContext(plan.inputs)
    const ladders = [...new Set(splitFor(plan.inputs.daysPerWeek, plan.inputs.sessionMinutes).flatMap((t) => TEMPLATES[t].slots.map((s) => s.ladder)))]
    return ladders
      .filter((l): l is LadderId => l !== 'cond')
      .map((l) => {
        const rung = plan.progress.ladders[l]?.rung ?? 0
        const cur = resolveLadder(l, rung, ctx)
        const nxt = cur ? resolveLadder(l, cur.rung + 1, ctx) : undefined
        return { ladder: l, cur, next: nxt && nxt.rung > (cur?.rung ?? -1) ? nxt : undefined, total: LADDERS[l].exercises.length }
      })
      .filter((x) => x.cur)
  }, [plan])

  if (!plan || !next) return <PageHeader title="Train" />
  const p = plan.profile
  const items = mainExercises(next)

  return (
    <>
      <PageHeader title="Train" subtitle={`${splitName(p.daysPerWeek, p.sessionMinutes)} · ${p.daysPerWeek}× ${p.sessionMinutes} min`} />
      <div className="px-4">
        <Card className="relative overflow-hidden border-ember/40 bg-gradient-to-br from-ember/15 via-surface to-surface">
          <div className="text-xs font-semibold uppercase tracking-wider text-ember">
            Up next · Workout {next.index + 1}
            {next.deload ? ' · lighter week' : ''}
          </div>
          <div className="mt-1 font-display text-2xl font-bold">{next.title}</div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {next.minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Flame size={14} /> ~{next.estKcal} kcal
            </span>
            <span>{items.length} exercises</span>
          </div>
          <ul className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {items.map((it) => {
              const ex = getExercise(it.exerciseId)!
              return (
                <li key={it.exerciseId} className="w-24 shrink-0 rounded-xl bg-bg/70 p-1.5">
                  <Mannequin motion={motionFor(ex)} playing={false} time={0.9} palette={palette} className="aspect-[4/3] w-full" title={ex.name} />
                  <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight">{ex.name}</div>
                  <div className="text-[11px] text-muted">{describeTarget(it)}</div>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" icon={<Play size={20} />} onClick={() => navigate('/workout')}>
              Start
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/train/session')}>
              Preview
            </Button>
          </div>
        </Card>

        <Card className="mt-3">
          <div className="flex items-center gap-2 font-semibold">
            <Zap size={18} className="text-amber" /> Short on time?
          </div>
          <p className="mt-0.5 text-sm text-muted">Squeeze today's workout into fewer minutes — the most important moves stay.</p>
          <div className="mt-3 flex gap-2">
            {[5, 10, 15]
              .filter((m) => m < p.sessionMinutes)
              .map((m) => (
                <Chip key={m} onClick={() => navigate(`/train/session?min=${m}`)}>
                  {m} min
                </Chip>
              ))}
            <Chip onClick={() => navigate('/train/session?snack=3')}>
              <span className="inline-flex items-center gap-1">
                <Coffee size={14} /> 3-min snack
              </span>
            </Chip>
          </div>
        </Card>

        <SectionTitle>This week</SectionTitle>
        <Card className="grid grid-cols-7 gap-1 px-2 py-3">
          {week.map((d) => {
            const did = d.done.length > 0
            const planDone = d.done.some((l) => l.kind === 'plan')
            return (
              <button
                key={d.date}
                type="button"
                disabled={!d.planned && !did}
                onClick={() => d.planned && navigate(d.planned.index === plan.progress.sessionsCompleted ? '/train/session' : `/train/session?idx=${d.planned.index}`)}
                className="flex flex-col items-center gap-1"
                aria-label={`${WEEKDAY_SHORT[isoWeekday(d.date) - 1]}: ${did ? 'done' : d.planned ? d.planned.title : 'rest day'}`}
              >
                <span className={cx('text-[11px] font-medium', d.isToday ? 'text-ember' : 'text-faint')}>{WEEKDAY_SHORT[isoWeekday(d.date) - 1].slice(0, 2)}</span>
                <span
                  className={cx(
                    'grid h-10 w-10 place-items-center rounded-full text-xs font-bold',
                    did
                      ? planDone
                        ? 'bg-ember text-on-accent'
                        : 'bg-teal/80 text-on-accent'
                      : d.planned
                        ? cx('border-2 text-ink', d.isToday ? 'border-ember' : 'border-line')
                        : 'text-faint',
                    d.isToday && !did && 'ring-2 ring-ember/30',
                  )}
                >
                  {did ? <Check size={18} strokeWidth={3} /> : d.planned ? SHORT[d.planned.templateId] : '·'}
                </span>
                <span className="text-[10px] text-faint tabular">{parseISODate(d.date).getDate()}</span>
              </button>
            )
          })}
        </Card>
        <p className="mt-2 px-1 text-xs text-faint">Missed a day? No problem — the next workout simply moves to your next training day.</p>

        <SectionTitle>Your levels</SectionTitle>
        <Card className="py-1">
          <ul className="divide-y divide-line/60">
            {levels.map(({ ladder, cur, next: nx, total }) => {
              const ex = getExercise(cur!.exerciseId)!
              return (
                <li key={ladder}>
                  <Link to={`/exercise/${ex.id}`} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium uppercase tracking-wider text-faint">{LADDERS[ladder].name}</div>
                      <div className="truncate font-semibold">{ex.name}</div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-ember" style={{ width: `${((cur!.rung + 1) / total) * 100}%` }} />
                      </div>
                      {nx ? <div className="mt-1 truncate text-xs text-muted">Next: {getExercise(nx.exerciseId)?.name}</div> : <div className="mt-1 text-xs text-good">Top level — now we add challenges</div>}
                    </div>
                    <ChevronRight className="shrink-0 text-faint" size={18} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Card>

        <SectionTitle>Learn</SectionTitle>
        <Link to="/train/library">
          <Card className="flex items-center gap-3 active:scale-[0.99]">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ember/15 text-ember">
              <BookOpen size={22} />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Exercise library</div>
              <div className="text-sm text-muted">Animated guides with voiced tutorials</div>
            </div>
            <ChevronRight className="text-faint" />
          </Card>
        </Link>
      </div>
    </>
  )
}
