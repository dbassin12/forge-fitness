import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { BadgeMedal } from '@/app/CelebrationHost'
import { burst } from '@/app/confetti'
import { reducedMotion } from '@/app/prefs'
import { usePalette } from '@/app/theme'
import { kvSet } from '@/db/db'
import { getExercise, motionFor } from '@/data/exercises'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { addDays, formatShortDate, startOfWeek, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { spreadDays } from '@/lib/schedule'
import { usePlan } from '@/state/plan'
import { useRecap, type RecapData } from '@/state/recap'
import { updateProfile } from '@/state/store'
import { Button } from '@/ui/Button'
import { CountUp } from '@/ui/CountUp'
import { cx } from '@/ui/cx'
import { ProgressRing } from '@/ui/ProgressRing'
import { StreakIcon } from '../today/StreakCard'

const SLIDE_MS = 6000

interface Slide {
  id: string
  bg: string
  render: (d: RecapData, active: boolean) => ReactNode
}

function Big({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('font-display text-7xl font-black leading-none tabular', className)}>{children}</div>
}

function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={cx('animate-rise', className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

function TopMove({ d }: { d: RecapData }) {
  const palette = usePalette()
  const ex = d.topExercise ? getExercise(d.topExercise.id) : undefined
  if (!ex || !d.topExercise) return null
  return (
    <Rise delay={500} className="mt-8 w-full rounded-3xl bg-white/10 p-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-white/70">Your top move</div>
      <div className="mt-1 flex items-center gap-3">
        <div className="w-28 shrink-0 overflow-hidden rounded-2xl bg-black/30">
          <Mannequin motion={motionFor(ex)} palette={palette} className="aspect-[4/3] w-full" title={ex.name} />
        </div>
        <div>
          <div className="text-lg font-bold leading-tight">{ex.name}</div>
          <div className="text-white/75">
            <CountUp value={d.topExercise.reps} /> reps
          </div>
        </div>
      </div>
    </Rise>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/** "2 snacks and 1 game" (either part may be zero). */
function extrasText(snacks: number, games: number): string {
  return [snacks > 0 ? plural(snacks, 'snack') : '', games > 0 ? plural(games, 'game') : ''].filter(Boolean).join(' and ')
}

function slides(d: RecapData): Slide[] {
  const out: Slide[] = [
    {
      id: 'intro',
      bg: 'from-[#ff6a3d] via-[#d9480f] to-[#7c2d12]',
      render: () => (
        <>
          <Rise className="text-7xl">🎬</Rise>
          <Rise delay={150} className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-white/80">
            Your week in review
          </Rise>
          <Rise delay={250} className="mt-2 font-display text-4xl font-black leading-tight">
            {formatShortDate(d.weekOf)} – {formatShortDate(addDays(d.weekOf, 6))}
          </Rise>
          <Rise delay={400} className="mt-4 text-lg text-white/85">
            {d.review.headline}
          </Rise>
        </>
      ),
    },
    {
      id: 'workouts',
      bg: 'from-[#0f766e] via-[#115e59] to-[#042f2e]',
      render: (_, active) => (
        <>
          <Rise className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">Workouts</Rise>
          <Rise delay={150} className="mt-6">
            <ProgressRing progress={active ? Math.min(1, d.review.workouts / Math.max(1, d.review.target)) : 0} size={200} stroke={16} color="#5eead4" track="rgba(255,255,255,0.15)">
              <Big>
                <CountUp value={d.review.workouts} />
              </Big>
              <div className="mt-1 text-white/75">of {d.review.target} planned</div>
            </ProgressRing>
          </Rise>
          <Rise delay={350} className="mt-6 text-xl font-semibold">
            {d.review.workouts >= d.review.target ? 'Weekly goal smashed! 🎯' : d.review.workouts > 0 ? `${d.review.target - d.review.workouts} short of your goal. So close.` : 'Next week is a fresh start.'}
          </Rise>
          {d.workoutsAll > d.review.workouts ? (
            <Rise delay={450} className="mt-2 text-white/75">
              Plus {extrasText(d.workoutsAll - d.review.workouts - d.plays, d.plays)} on top.
            </Rise>
          ) : null}
        </>
      ),
    },
    {
      id: 'moved',
      bg: 'from-[#7c3aed] via-[#5b21b6] to-[#2e1065]',
      render: () => (
        <>
          <Rise className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">You moved</Rise>
          <Rise delay={150} className="mt-6">
            <Big>
              <CountUp value={d.review.minutes} duration={1200} />
            </Big>
            <div className="mt-1 text-xl text-white/80">minutes</div>
          </Rise>
          <Rise delay={300} className="mt-6">
            <Big className="text-6xl">
              <CountUp value={d.reps} duration={1400} />
            </Big>
            <div className="mt-1 text-xl text-white/80">reps</div>
          </Rise>
          <TopMove d={d} />
        </>
      ),
    },
    {
      id: 'streak',
      bg: 'from-[#b45309] via-[#92400e] to-[#451a03]',
      render: () => (
        <>
          <Rise className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">Streak & XP</Rise>
          <Rise delay={150} className="mt-6 grid place-items-center">
            <StreakIcon weeks={Math.max(1, d.streakWeeks)} size={120} />
          </Rise>
          <Rise delay={250} className="mt-2 font-display text-4xl font-black">
            {d.streakWeeks > 0 ? `${d.streakWeeks}-week streak` : 'Streak: ready to start'}
          </Rise>
          <Rise delay={400} className="mt-6 rounded-3xl bg-white/10 px-6 py-4">
            <div className="font-display text-5xl font-black text-[#ddd6fe]">
              +<CountUp value={d.xp} duration={1300} /> XP
            </div>
            <div className="mt-1 text-white/80">earned this week · now level {d.level}</div>
          </Rise>
          {d.questsDone ? (
            <Rise delay={550} className="mt-4 text-white/85">
              {d.questsDone} quest{d.questsDone === 1 ? '' : 's'} done{d.perfectDays ? ` · ${d.perfectDays} perfect day${d.perfectDays === 1 ? '' : 's'} 💎` : ''}
            </Rise>
          ) : null}
        </>
      ),
    },
  ]
  if (d.review.loggedDays > 0 || d.waterDays > 0) {
    const max = Math.max(d.proteinTarget, ...d.proteinByDay.map((x) => x.protein))
    out.push({
      id: 'food',
      bg: 'from-[#15803d] via-[#166534] to-[#052e16]',
      render: (_, active) => (
        <>
          <Rise className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">Fuel</Rise>
          <Rise delay={150} className="mt-6 font-display text-4xl font-black">
            Protein goal on {d.review.proteinDays} day{d.review.proteinDays === 1 ? '' : 's'}
          </Rise>
          <Rise delay={250} className="mt-6 flex h-40 w-full max-w-xs items-end justify-between gap-2">
            {d.proteinByDay.map((x, i) => (
              <div key={x.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-32 w-full items-end overflow-hidden rounded-lg bg-white/10">
                  <div
                    className={cx('w-full rounded-lg', x.protein >= d.proteinTarget * 0.95 ? 'bg-[#86efac]' : 'bg-white/45')}
                    style={{ height: active ? `${(x.protein / max) * 100}%` : '0%', transition: `height 900ms cubic-bezier(0.2,0.8,0.2,1) ${i * 70}ms` }}
                  />
                </div>
                <span className="text-xs text-white/70">{WEEKDAY_SHORT[i].slice(0, 1)}</span>
              </div>
            ))}
          </Rise>
          <Rise delay={400} className="mt-6 text-white/85">
            {d.review.avgKcal ? `${Math.round(d.review.avgKcal).toLocaleString()} kcal on an average logged day` : 'Log a few meals next week to see your averages'}
            {d.waterDays ? ` · water goal hit ${d.waterDays}×` : ''}
          </Rise>
        </>
      ),
    })
  }
  if (d.badges.length) {
    out.push({
      id: 'badges',
      bg: 'from-[#a16207] via-[#854d0e] to-[#422006]',
      render: () => (
        <>
          <Rise className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">New badges</Rise>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {d.badges.slice(0, 8).map((b, i) => (
              <BadgeMedal key={b.id} badge={b.badge} tier={b.tier} size="md" className="animate-bounce-in" style={{ animationDelay: `${150 + i * 120}ms` }} />
            ))}
          </div>
          <Rise delay={400} className="mt-6 font-display text-3xl font-black">
            {d.badges.length} unlocked
          </Rise>
          <Rise delay={500} className="mt-2 text-white/80">
            {d.badges.map((b) => b.title).join(' · ')}
          </Rise>
        </>
      ),
    })
  }
  return out
}

function NextWeek({ d, onDone }: { d: RecapData; onDone: () => void }) {
  const plan = usePlan()
  const [picked, setPicked] = useState<string | null>(null)
  return (
    <>
      <Rise className="text-7xl">🚀</Rise>
      <Rise delay={150} className="mt-6 text-sm font-bold uppercase tracking-[0.3em] text-white/80">
        Next week
      </Rise>
      <Rise delay={250} className="mt-2 font-display text-3xl font-black leading-tight">
        {d.review.suggestion ? 'A tweak to consider' : 'Same plan, a little stronger'}
      </Rise>
      <Rise delay={350} className="mt-4 text-white/85">
        {d.review.suggestion?.text ?? 'Your reps and levels already adjusted from last week. Show up, and Forge does the rest.'}
      </Rise>
      {d.review.suggestion && plan ? (
        <Rise delay={450} className="mt-5 flex flex-wrap justify-center gap-2">
          {d.review.suggestion.options.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={async (e) => {
                e.stopPropagation()
                const p = plan.profile
                await updateProfile({ ...(o.daysPerWeek ? { daysPerWeek: o.daysPerWeek, trainingDays: spreadDays(o.daysPerWeek, p.trainingDays) } : {}), ...(o.sessionMinutes ? { sessionMinutes: o.sessionMinutes } : {}) })
                setPicked(o.label)
                haptic('success')
                sfx.success()
              }}
              className={cx('rounded-full border px-4 py-2 text-sm font-semibold', picked === o.label ? 'border-white bg-white text-black' : 'border-white/40 bg-white/10')}
            >
              {picked === o.label ? '✓ ' : ''}
              {o.label}
            </button>
          ))}
        </Rise>
      ) : null}
      <Rise delay={550} className="mt-8 w-full max-w-xs">
        <Button
          block
          size="lg"
          className="bg-white text-black hover:bg-white/90"
          onClick={(e) => {
            e.stopPropagation()
            onDone()
          }}
        >
          Let’s go
        </Button>
      </Rise>
    </>
  )
}

/** Weekly recap as tap-through stories (tap right for next, left for back, hold to pause). */
export default function RecapPage() {
  const plan = usePlan()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const weekOf = params.get('week') ?? addDays(startOfWeek(todayISO()), -7)
  const data = useRecap(plan, weekOf)
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const held = useRef(false)
  const holdTimer = useRef<number | undefined>(undefined)
  const list = data ? slides(data) : []
  const total = list.length + 1
  const last = i === total - 1

  const close = useCallback(async () => {
    await kvSet('review.dismissed', weekOf)
    navigate('/today', { replace: true })
  }, [navigate, weekOf])

  const go = useCallback(
    (to: number) => {
      const n = Math.max(0, Math.min(total - 1, to))
      if (n !== i) {
        setI(n)
        setElapsed(0)
        sfx.click()
        if (n === total - 1) {
          burst('sides')
          sfx.levelUp()
        }
      }
    },
    [i, total],
  )

  useEffect(() => {
    if (!data || paused || last || reducedMotion()) return
    const t0 = performance.now() - elapsed
    let raf = 0
    const tick = (now: number) => {
      const e = now - t0
      if (e >= SLIDE_MS) go(i + 1)
      else {
        setElapsed(e)
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // `elapsed` only seeds the resume point; re-running on every frame would restart the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, paused, last, i, go])

  if (!data) return <div className="grid h-dvh place-items-center bg-black text-white/70 animate-pulse-soft">Loading your week…</div>
  const slide = list[i]

  return (
    <div
      className={cx('no-callout fixed inset-0 z-40 overflow-hidden bg-gradient-to-b text-white transition-colors duration-500', slide ? slide.bg : 'from-[#1e293b] via-[#0f172a] to-black')}
      onPointerDown={() => {
        held.current = false
        window.clearTimeout(holdTimer.current)
        holdTimer.current = window.setTimeout(() => {
          held.current = true
        }, 250)
        setPaused(true)
      }}
      onPointerUp={(e) => {
        window.clearTimeout(holdTimer.current)
        setPaused(false)
        if (held.current || last) return
        const x = e.clientX / window.innerWidth
        go(x < 0.3 ? i - 1 : i + 1)
      }}
      onPointerCancel={() => {
        window.clearTimeout(holdTimer.current)
        setPaused(false)
      }}
      role="dialog"
      aria-label="Weekly recap"
    >
      <div className="absolute inset-x-0 top-0 z-10 px-3" style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, k) => (
            <div key={k} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full bg-white" style={{ width: `${k < i ? 100 : k === i ? (last ? 100 : (elapsed / SLIDE_MS) * 100) : 0}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-white/90">🔥 Forge recap</span>
          <button
            type="button"
            aria-label="Close recap"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={() => void close()}
            className="grid h-10 w-10 place-items-center rounded-full bg-black/20"
          >
            <X size={22} />
          </button>
        </div>
      </div>
      <div key={i} className="flex h-full flex-col items-center justify-center px-8 text-center" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
        {slide ? slide.render(data, true) : <NextWeek d={data} onDone={() => void close()} />}
      </div>
      {!last ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-6 text-center text-xs text-white/60" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          Tap to continue · hold to pause
        </div>
      ) : null}
    </div>
  )
}
