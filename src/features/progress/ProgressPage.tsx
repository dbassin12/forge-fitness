import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, Plus, Scale, Settings, Trophy } from 'lucide-react'
import { isBloom, W } from '@/app/brand'
import { db } from '@/db/db'
import { getExercise } from '@/data/exercises'
import { levelTitle, weeklyStreak } from '@/engines/gamification'
import { dailyTargets } from '@/engines/nutrition/targets'
import { repWord } from '@/engines/plan'
import { retestDue } from '@/engines/progression/progress'
import { addDays, formatShortDate, parseISODate, startOfWeek, todayISO } from '@/lib/dates'
import { kgToLb, lbToKg } from '@/lib/units'
import { logWeight, useWeights } from '@/state/body'
import { BREATHE_PREFIX, useMindfulMinutesThisWeek } from '@/state/breathe'
import { planDates, useLevel, useUnlocked } from '@/state/gamification'
import { usePlan } from '@/state/plan'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { ChartFrame, ColumnChart, LegendDot, LegendLine, StatTile, TimeChart } from '@/ui/charts/Charts'
import { PageHeader } from '@/ui/PageHeader'
import { Sheet } from '@/ui/Sheet'
import { Stepper } from '@/ui/Stepper'
import { BodySection } from './BodySection'
import { TrophyShelf } from './TrophyShelf'

const DAY = 86_400_000
/** Sessions for the charts and totals: not movement snacks or mini flows, not breathing sessions. */
const countsAsSession = (w: { kind: string; sessionKey: string }) => w.kind !== 'snack' && !w.sessionKey.startsWith(BREATHE_PREFIX)
const toX = (d: string) => parseISODate(d).getTime()

export default function ProgressPage() {
  const plan = usePlan()
  const weights = useWeights(180)
  const workouts = useLiveQuery(() => db.workouts.orderBy('date').toArray(), [])
  const since = addDays(todayISO(), -13)
  const foodRows = useLiveQuery(() => db.foodLogs.where('date').aboveOrEqual(since).toArray(), [since])
  const level = useLevel()
  const unlocked = useUnlocked()
  const [weighOpen, setWeighOpen] = useState(false)
  const mindful = useMindfulMinutesThisWeek()

  const data = useMemo(() => {
    if (!plan || !weights || !workouts || !foodRows) return null
    const p = plan.profile
    const imperial = p.units === 'imperial'
    const toUnit = (kg: number) => (imperial ? kgToLb(kg) : kg)
    // Weight: raw weigh-ins + trailing 7-day average.
    const raw = weights.map((w) => ({ x: toX(w.date), y: toUnit(w.kg) }))
    const avg = raw.map((pt) => {
      const win = raw.filter((q) => q.x <= pt.x && q.x > pt.x - 7 * DAY)
      return { x: pt.x, y: win.reduce((s, q) => s + q.y, 0) / win.length }
    })
    const latestAvg = avg[avg.length - 1]?.y
    const monthAgo = avg.filter((q) => q.x <= Date.now() - 28 * DAY).pop()?.y
    // Workouts per week, last 12 weeks.
    const thisWeek = startOfWeek(todayISO())
    const weeks = Array.from({ length: 12 }, (_, k) => addDays(thisWeek, -7 * (11 - k)))
    const perWeek = weeks.map((w) => ({
      key: w,
      label: formatShortDate(w),
      value: workouts.filter((x) => countsAsSession(x) && x.date >= w && x.date <= addDays(w, 6)).length,
    }))
    // Calories, last 14 days.
    const t = dailyTargets(p)
    const days = Array.from({ length: 14 }, (_, k) => addDays(since, k))
    const byDay = days.map((d) => {
      const rows = foodRows.filter((f) => f.date === d)
      return { date: d, kcal: rows.reduce((s, r) => s + r.kcal, 0), protein: rows.reduce((s, r) => s + r.protein, 0), logged: rows.length > 0 }
    })
    const logged = byDay.filter((d) => d.logged)
    const streak = weeklyStreak(planDates(workouts), p.daysPerWeek, todayISO())
    const prs = Object.entries(plan.progress.exercises)
      // Bloom lists holds only ("Your best holds").
      .filter(([id, e]) => e.best > 0 && (!isBloom || getExercise(id)?.measure === 'time'))
      .sort((a, b) => (b[1].lastDate ?? '').localeCompare(a[1].lastDate ?? ''))
      .slice(0, 10)
    return { p, imperial, raw, avg, latestAvg, monthAgo, perWeek, t, byDay, logged, streak, prs, toUnit }
  }, [plan, weights, workouts, foodRows, since])

  if (!plan || !data) return <PageHeader title="Progress" />
  const { p, imperial, raw, avg, latestAvg, monthAgo, perWeek, t, byDay, logged, streak, prs, toUnit } = data
  const unit = imperial ? 'lb' : 'kg'
  const goalW = p.goalWeightKg ? toUnit(p.goalWeightKg) : undefined
  const fmtW = (v: number) => `${v.toFixed(1)}`
  const avgKcal = logged.length ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length) : undefined
  const avgProtein = logged.length ? Math.round(logged.reduce((s, d) => s + d.protein, 0) / logged.length) : undefined
  const proteinHits = logged.filter((d) => d.protein >= t.protein * 0.95).length
  const due = retestDue(plan.progress, todayISO()) || plan.progress.tests.length === 0
  // Bloom with light-touch tracking never talks calories.
  const calm = isBloom && p.trackingMode === 'lite'
  const weightSection = (
    <>
      <SectionTitle
        action={
          <Button size="sm" variant="ghost" icon={<Scale size={15} />} onClick={() => setWeighOpen(true)}>
            Log weight
          </Button>
        }
      >
        Body weight
      </SectionTitle>
      <Card>
        {raw.length ? (
          <ChartFrame
            title={`Weight trend (${unit})`}
            subtitle="Daily weigh-ins bounce around; the 7-day average shows the real trend."
            legend={
              <>
                <LegendLine label="7-day average" tone="accent" />
                <LegendDot label="Weigh-ins" tone="deemph" />
              </>
            }
            table={{ head: ['Date', `Weigh-in (${unit})`, `7-day avg (${unit})`], rows: raw.map((r, i) => [formatShortDate(new Date(r.x).toISOString().slice(0, 10)), fmtW(r.y), fmtW(avg[i].y)]).reverse() }}
          >
            <TimeChart
              ariaLabel={`Weight trend: latest 7-day average ${latestAvg?.toFixed(1)} ${unit}`}
              series={[
                { id: 'raw', label: 'weigh-in', kind: 'dots', tone: 'deemph', points: raw },
                { id: 'avg', label: '7-day avg', kind: 'line', tone: 'accent', points: avg },
              ]}
              xLabel={(x) => formatShortDate(new Date(x).toISOString().slice(0, 10))}
              yFormat={fmtW}
              tickFormat={(v) => String(Math.round(v))}
              reference={goalW ? { y: goalW, label: `Goal ${fmtW(goalW)}` } : undefined}
            />
          </ChartFrame>
        ) : (
          <div className="py-6 text-center text-sm text-muted">
            Weigh in a few mornings a week (same time, after the bathroom) to see your trend.
            <div className="mt-3">
              <Button size="sm" icon={<Plus size={15} />} onClick={() => setWeighOpen(true)}>
                Add first weigh-in
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  )

  return (
    <>
      <PageHeader
        title="Progress"
        subtitle={isBloom ? 'Every practice and every breath adds up' : 'Every rep and every meal adds up'}
        right={
          <Link to="/more" viewTransition aria-label="Settings" className="pressable grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted">
            <Settings size={18} />
          </Link>
        }
      />
      <div className="px-4">
        {(workouts ?? []).some((w) => w.date < startOfWeek(todayISO())) ? (
          <Link to="/recap" viewTransition className="pressable mb-3 flex items-center gap-3 rounded-[var(--radius-card)] border border-violet/40 bg-gradient-to-r from-violet/20 via-surface to-surface p-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-tr from-ember via-amber to-violet p-[3px]">
              <span className="grid h-full w-full place-items-center rounded-full bg-surface text-xl">🎬</span>
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Last week in review</span>
              <span className="block text-sm text-muted">Your stats as a 30-second story</span>
            </span>
            <ChevronRight size={18} className="text-faint" />
          </Link>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          {isBloom ? (
            <StatTile label="Mindful minutes" value={String(mindful ?? 0)} footnote="Breathing and relaxing this week" />
          ) : (
            <StatTile
              label="Weight (7-day avg)"
              value={latestAvg !== undefined ? fmtW(latestAvg) : '—'}
              unit={latestAvg !== undefined ? unit : undefined}
              delta={latestAvg !== undefined && monthAgo !== undefined ? { value: latestAvg - monthAgo, text: `${latestAvg - monthAgo >= 0 ? '+' : ''}${(latestAvg - monthAgo).toFixed(1)} ${unit} vs 4 weeks ago` } : undefined}
              upIsGood={p.goal === 'build_muscle' ? true : p.goal === 'lose_fat' ? false : undefined}
              trend={avg.map((a) => a.y)}
              footnote={raw.length ? undefined : 'Log a weigh-in to start'}
            />
          )}
          <StatTile
            label={`${W.Workout}s this week`}
            value={`${streak.thisWeek}/${streak.target}`}
            footnote={streak.weeks ? `${streak.weeks}-week streak${streak.freezes ? ` · ${streak.freezes} freeze${streak.freezes > 1 ? 's' : ''}` : ''}` : `${isBloom ? 'Reach' : 'Hit'} your weekly goal to start a streak`}
          />
          <StatTile label="Level" value={level ? `${level.level} · ${levelTitle(level.level)}` : '—'} footnote={level ? `${level.into}/${level.span} XP to level ${level.level + 1}` : undefined} />
          <StatTile
            label={`${W.Workout}s done`}
            value={String((workouts ?? []).filter(countsAsSession).length)}
            footnote={`${Math.round((workouts ?? []).reduce((s, w) => s + (w.finishedAt - w.startedAt) / 60000, 0))} minutes in total`}
          />
        </div>

        {due ? (
          <Link to="/test">
            <Card className="mt-3 flex items-center gap-3 border-ember/40">
              <Trophy className="shrink-0 text-ember" size={22} />
              <div className="flex-1">
                <div className="font-semibold">{plan.progress.tests.length ? 'Time for your 4-week check-in' : isBloom ? 'Take the 2-minute check-in' : 'Take the 3-minute fitness test'}</div>
                <div className="text-sm text-muted">{isBloom ? 'A forward fold and a balance. See how you’ve grown.' : "Push-ups, squats and a plank — see how far you've come."}</div>
              </div>
              <ChevronRight className="text-faint" />
            </Card>
          </Link>
        ) : null}

        {isBloom ? null : weightSection}

        <SectionTitle>{isBloom ? 'Practice' : 'Training'}</SectionTitle>
        <Card>
          <ChartFrame title={`${W.Workout}s per week`} subtitle="Last 12 weeks · line shows your weekly goal" table={{ head: ['Week of', `${W.Workout}s`], rows: perWeek.map((w) => [w.label, w.value]).reverse() }}>
            <ColumnChart ariaLabel={`${W.Workout}s per week`} data={perWeek} reference={{ y: p.daysPerWeek, label: `Goal ${p.daysPerWeek}` }} />
          </ChartFrame>
        </Card>
        {prs.length ? (
          <Card className="mt-3 py-1">
            <div className="flex items-center justify-between py-2.5">
              <span className="font-semibold">{isBloom ? 'Your best holds' : 'Personal bests'}</span>
              <span className="text-xs text-muted">{isBloom ? 'longest single hold' : 'best single set'}</span>
            </div>
            <ul className="divide-y divide-line/60">
              {prs.map(([id, e]) => {
                const ex = getExercise(id)
                if (!ex) return null
                return (
                  <li key={id}>
                    <Link to={`/exercise/${id}`} className="flex items-center gap-3 py-2.5">
                      <span className="flex-1 truncate text-sm">{ex.name}</span>
                      <span className="text-sm font-semibold tabular">
                        {e.best}
                        {ex.measure === 'time' ? ' s' : ` ${isBloom ? repWord(id, e.best) : 'reps'}`}
                        {ex.perSide ? ' / side' : ''}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        ) : null}

        <SectionTitle>Nutrition</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {calm ? (
            <StatTile label="Days with food logged" value={`${logged.length}/14`} footnote="Last two weeks" />
          ) : (
            <StatTile label="Avg calories (logged days)" value={avgKcal ? avgKcal.toLocaleString() : '—'} footnote={`Target ${t.kcal.toLocaleString()}`} />
          )}
          <StatTile label="Protein target hit" value={logged.length ? `${proteinHits}/${logged.length} days` : '—'} footnote={avgProtein ? `Avg ${avgProtein} g of ${t.protein} g` : 'Log food to see this'} />
        </div>
        {logged.length && !calm ? (
          <Card className="mt-3">
            <ChartFrame
              title="Calories, last 14 days"
              subtitle="Days with nothing logged show as empty"
              table={{ head: ['Date', 'Calories', 'Protein (g)'], rows: byDay.filter((d) => d.logged).map((d) => [formatShortDate(d.date), Math.round(d.kcal), Math.round(d.protein)]).reverse() }}
            >
              <ColumnChart
                ariaLabel="Calories per day"
                data={byDay.map((d) => ({ key: d.date, label: String(parseISODate(d.date).getDate()), value: Math.round(d.kcal), note: d.logged ? `${Math.round(d.protein)} g protein` : 'nothing logged' }))}
                reference={{ y: t.kcal, label: `Target ${t.kcal.toLocaleString()}` }}
              />
            </ChartFrame>
          </Card>
        ) : null}

        {isBloom ? weightSection : null}

        <BodySection imperial={imperial} />

        <TrophyShelf plan={plan} unlocked={unlocked} />
        <div className="h-4" />
      </div>
      <WeighSheet open={weighOpen} onClose={() => setWeighOpen(false)} imperial={imperial} initialKg={weights?.[weights.length - 1]?.kg ?? p.weightKg} onSave={(kg) => void logWeight(kg, p)} />
    </>
  )
}

function WeighSheet({ open, onClose, imperial, initialKg, onSave }: { open: boolean; onClose: () => void; imperial: boolean; initialKg: number; onSave: (kg: number) => void }) {
  const [v, setV] = useState(() => Math.round((imperial ? kgToLb(initialKg) : initialKg) * 10) / 10)
  return (
    <Sheet open={open} onClose={onClose} title="Today's weigh-in">
      <p className="-mt-1 text-sm text-muted">Best first thing in the morning. Daily ups and downs are normal — the trend is what counts.</p>
      <div className="mt-5 flex justify-center">
        <Stepper value={v} onChange={setV} min={imperial ? 70 : 30} max={imperial ? 600 : 280} step={0.2} unit={imperial ? 'lb' : 'kg'} label="weight" size="lg" />
      </div>
      <Button
        block
        size="lg"
        className="mt-5"
        onClick={() => {
          onSave(imperial ? lbToKg(v) : v)
          onClose()
        }}
      >
        Save
      </Button>
    </Sheet>
  )
}
