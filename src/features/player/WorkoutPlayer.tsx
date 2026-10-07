import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Clock, Flame, Play, RotateCcw, Share2, Sparkles, Star, Zap } from 'lucide-react'
import { burst } from '@/app/confetti'
import { COACH_STYLES, usePrefs } from '@/app/prefs'
import { accentInfo, usePalette, useTheme } from '@/app/theme'
import { getExercise as exById, motionFor } from '@/data/exercises'
import { levelForXp } from '@/engines/gamification'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { useTotalXp } from '@/state/gamification'
import { CountUp } from '@/ui/CountUp'
import { coachLine } from '@/voice/coachLines'
import { makeShareCard, shareImage } from './shareCard'
import { db, kvSet } from '@/db/db'
import { getExercise } from '@/data/exercises'
import { weeklyStreak } from '@/engines/gamification'
import type { PlannedSession } from '@/engines/plan'
import type { ProgressChange, Rating } from '@/engines/progression/progress'
import { todayISO } from '@/lib/dates'
import { keepAwake, releaseAwake } from '@/device/wakeLock'
import { usePlan } from '@/state/plan'
import { planDates } from '@/state/gamification'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Sheet } from '@/ui/Sheet'
import { cx } from '@/ui/cx'
import { unlockAudio } from '@/voice/beeps'
import { useVoiceSettings } from '@/voice/settings'
import { speech } from '@/voice/speech'
import { blockSummary, gearFor } from '../train/sessionMeta'
import { useSessionFromParams } from '../train/useSessionParams'
import { finishWorkout, type FinishResult, type StepValues } from './finish'
import { RunView } from './RunView'
import { buildSteps } from './steps'

const SAVE_KEY = 'player.run'
const RESUME_WINDOW_MS = 12 * 60 * 60 * 1000

interface SavedRun {
  v: 1
  search: string
  session: PlannedSession
  snack: boolean
  cursor: number
  values: StepValues
  startedAt: number
  activeMs: number
  savedAt: number
}

type Phase = 'intro' | 'run' | 'feedback' | 'saving' | 'summary'

function changeIcon(c: ProgressChange) {
  switch (c.kind) {
    case 'advance':
      return <Sparkles size={18} className="text-ember" />
    case 'pr':
      return <Star size={18} className="text-amber" />
    case 'goal_up':
      return <ArrowUp size={18} className="text-good" />
    case 'modifier_on':
      return <Zap size={18} className="text-violet" />
    default:
      return <ArrowDown size={18} className="text-sky" />
  }
}

export default function WorkoutPlayer() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const plan = usePlan()
  const fresh = useSessionFromParams()
  const saved = useLiveQuery(async () => ((await db.kv.get(SAVE_KEY))?.value as SavedRun | undefined) ?? null, [])
  const [run, setRun] = useState<SavedRun | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [quitOpen, setQuitOpen] = useState(false)
  const [result, setResult] = useState<FinishResult | null>(null)
  const activeSince = useRef<number | null>(null)
  const voice = useVoiceSettings()

  const resumable = saved && Date.now() - saved.savedAt < RESUME_WINDOW_MS && (saved.search === search || !search) ? saved : null
  const session = run?.session ?? fresh?.session
  const steps = useMemo(() => (session ? buildSteps(session) : []), [session])

  // Keep the screen on and silence speech when leaving.
  useEffect(() => {
    return () => {
      speech.cancel()
      void releaseAwake()
    }
  }, [])

  const persist = useCallback((r: SavedRun) => {
    const now = Date.now()
    const activeMs = r.activeMs + (activeSince.current ? now - activeSince.current : 0)
    if (activeSince.current) activeSince.current = now
    const next = { ...r, activeMs, savedAt: now }
    setRun(next)
    void kvSet(SAVE_KEY, next)
    return next
  }, [])

  const start = (from: SavedRun | null) => {
    unlockAudio()
    speech.unlock()
    void keepAwake()
    const r: SavedRun =
      from ??
      ({
        v: 1,
        search,
        session: fresh!.session,
        snack: fresh!.snack,
        cursor: 0,
        values: {},
        startedAt: Date.now(),
        activeMs: 0,
        savedAt: Date.now(),
      } satisfies SavedRun)
    activeSince.current = Date.now()
    persist(r)
    setPhase('run')
  }

  const complete = (values: StepValues) => {
    if (!run) return
    const r = persist({ ...run, values })
    activeSince.current = null
    speech.cancel()
    sfx.levelUp()
    haptic('celebrate')
    void speech.speak(coachLine('workoutDone'), { priority: 'cue', interrupt: true })
    setRun(r)
    setPhase('feedback')
  }

  const save = async (feedback?: Rating) => {
    if (!run || !plan) return
    setPhase('saving')
    const res = await finishWorkout({
      profile: plan.profile,
      progress: plan.progress,
      session: run.session,
      steps,
      values: run.values,
      startedAt: run.startedAt,
      activeSec: run.activeMs / 1000,
      feedback,
      snack: run.snack,
    })
    await db.kv.delete(SAVE_KEY)
    void releaseAwake()
    setResult(res)
    setPhase('summary')
    burst('big')
  }

  if (!plan || !fresh || saved === undefined) {
    return <div className="grid h-dvh place-items-center text-muted animate-pulse-soft">Loading…</div>
  }

  if (phase === 'run' && run && session) {
    return (
      <>
        <RunView
          session={session}
          steps={steps}
          cursor={run.cursor}
          values={run.values}
          onCursor={(cursor, values) => persist({ ...run, cursor, values })}
          onValues={(values) => setRun((r) => (r ? { ...r, values } : r))}
          onComplete={complete}
          onQuit={() => setQuitOpen(true)}
        />
        <Sheet open={quitOpen} onClose={() => setQuitOpen(false)} title="End workout?">
          <p className="text-sm text-muted">Save what you've done so far, or keep going. Even a few sets count.</p>
          <div className="mt-4 grid gap-2">
            <Button size="lg" onClick={() => setQuitOpen(false)}>
              Keep going
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setQuitOpen(false)
                complete(run.values)
              }}
            >
              Finish and save
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await db.kv.delete(SAVE_KEY)
                setQuitOpen(false)
                navigate(-1)
              }}
            >
              Discard workout
            </Button>
          </div>
        </Sheet>
      </>
    )
  }

  if ((phase === 'feedback' || phase === 'saving') && run) {
    const opts: { r: Rating; label: string; text: string; emoji: string; tone: string }[] = [
      { r: 'easy', label: 'Too easy', text: 'I had plenty left — level me up', emoji: '😎', tone: 'border-good/40 hover:bg-good/10' },
      { r: 'right', label: 'Just right', text: 'Challenging but doable', emoji: '💪', tone: 'border-amber/40 hover:bg-amber/10' },
      { r: 'hard', label: 'Too hard', text: 'I struggled to finish', emoji: '🥵', tone: 'border-bad/40 hover:bg-bad/10' },
    ]
    return (
      <div className="flex min-h-dvh flex-col px-4 safe-top">
        <div className="mt-10 text-center">
          <div className="text-6xl animate-bounce-in">🎉</div>
          <h1 className="mt-3 font-display text-3xl font-bold animate-fade-up">Workout done!</h1>
          <p className="mt-1 text-muted animate-fade-up [animation-delay:120ms]">How did that feel? Your next workout adapts to your answer.</p>
        </div>
        <div className="mt-8 space-y-3">
          {opts.map(({ r, label, text, emoji, tone }, i) => (
            <button
              key={r}
              type="button"
              disabled={phase === 'saving'}
              onClick={() => {
                sfx.pop()
                haptic('medium')
                void save(r)
              }}
              className={cx('pressable flex w-full animate-rise items-center gap-4 rounded-2xl border bg-surface p-4 text-left disabled:opacity-50', tone)}
              style={{ animationDelay: `${200 + i * 90}ms` }}
            >
              <span className="text-4xl">{emoji}</span>
              <span>
                <span className="block text-lg font-semibold">{label}</span>
                <span className="block text-sm text-muted">{text}</span>
              </span>
            </button>
          ))}
        </div>
        <Button variant="ghost" className="mt-3" disabled={phase === 'saving'} onClick={() => void save(undefined)}>
          Skip
        </Button>
      </div>
    )
  }

  if (phase === 'summary' && result) {
    return <Summary result={result} onDone={() => navigate('/today', { replace: true })} />
  }

  // Intro (with resume offer).
  const s = fresh.session
  const gear = gearFor(s)
  return (
    <div className="flex min-h-dvh flex-col px-4 safe-top">
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={() => navigate(-1)} className="-ml-2 rounded-full px-2 py-2 text-sm font-medium text-muted hover:text-ink">
          Cancel
        </button>
      </div>
      {resumable ? (
        <Card className="mt-2 border-ember/40">
          <div className="font-semibold">Pick up where you left off?</div>
          <p className="mt-1 text-sm text-muted">
            {resumable.session.title} — {Math.round((resumable.cursor / Math.max(1, buildSteps(resumable.session).length)) * 100)}% done.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button icon={<Play size={18} />} onClick={() => start(resumable)}>
              Resume
            </Button>
            <Button
              variant="secondary"
              icon={<RotateCcw size={18} />}
              onClick={async () => {
                await db.kv.delete(SAVE_KEY)
              }}
            >
              Start over
            </Button>
          </div>
        </Card>
      ) : null}
      <div className="mt-6">
        <div className="text-sm font-semibold uppercase tracking-wider text-ember">{fresh.snack ? 'Movement snack' : `Workout ${fresh.index + 1}`}</div>
        <h1 className="mt-1 font-display text-3xl font-bold">{s.title}</h1>
        <div className="mt-1 flex gap-4 text-muted">
          <span className="flex items-center gap-1">
            <Clock size={16} /> {s.minutes} min
          </span>
          <span className="flex items-center gap-1">
            <Flame size={16} /> ~{s.estKcal} kcal
          </span>
        </div>
      </div>
      <Card className="mt-5 divide-y divide-line/60 py-1">
        {s.blocks.map((b) => (
          <div key={b.id} className="py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{b.title}</span>
              <span className="text-xs text-muted">{blockSummary(b)}</span>
            </div>
            <div className="mt-0.5 truncate text-sm text-muted">{b.items.map((it) => getExercise(it.exerciseId)?.name).join(' · ')}</div>
          </div>
        ))}
      </Card>
      {gear.length ? <p className="mt-3 text-sm text-muted">Have ready: {gear.join(', ')}.</p> : null}
      <CoachPicker />
      <div className="mt-3 space-y-1 rounded-2xl bg-surface-2 p-3 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span>Voice coach</span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-ember)]" checked={voice.enabled} onChange={(e) => voice.update({ enabled: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>Count my reps in tempo</span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-ember)]" checked={voice.countReps} onChange={(e) => voice.update({ countReps: e.target.checked })} />
        </label>
      </div>
      <div className="mt-auto pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <Button block size="lg" icon={<Play size={22} fill="currentColor" />} onClick={() => start(null)} className={cx('h-16 text-lg', resumable ? 'opacity-90' : 'animate-glow')}>
          {resumable ? 'Start fresh' : "Let's go"}
        </Button>
      </div>
    </div>
  )
}

function CoachPicker() {
  const coach = usePrefs((s) => s.coach)
  const update = usePrefs((s) => s.update)
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Your coach today</div>
      <div className="grid grid-cols-4 gap-1.5">
        {COACH_STYLES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={coach === c.id}
            onClick={() => {
              update({ coach: c.id })
              haptic('light')
              unlockAudio()
              speech.unlock()
              void speech.speak(c.sample, { priority: 'cue', interrupt: true })
            }}
            className={cx('pressable flex flex-col items-center rounded-2xl border px-1 py-2 text-xs font-medium', coach === c.id ? 'border-ember bg-ember/10 text-ember' : 'border-line bg-surface text-muted')}
          >
            <span className="text-2xl">{c.emoji}</span>
            <span className="mt-0.5 truncate">{c.id === 'drill' ? 'Drill' : c.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function XpBar({ gained }: { gained: number }) {
  const total = useTotalXp()
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), 650)
    return () => window.clearTimeout(id)
  }, [])
  if (total === undefined) return null
  const before = levelForXp(Math.max(0, total - gained))
  const after = levelForXp(total)
  const leveled = after.level > before.level
  const from = leveled ? 0 : before.progress
  const to = after.progress
  return (
    <Card className="mt-3 animate-fade-up [animation-delay:500ms]">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold">
          Level {after.level}
          {leveled ? <span className="ml-2 rounded-full bg-violet/20 px-2 py-0.5 text-xs font-bold text-violet animate-pop">LEVEL UP!</span> : null}
        </span>
        <span className="text-sm font-bold text-violet">
          +<CountUp value={gained} duration={1200} /> XP
        </span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet to-ember"
          style={{ width: `${(shown ? to : from) * 100}%`, transition: 'width 1300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}
        />
      </div>
      <div className="mt-1 text-xs text-muted tabular">
        {after.into}/{after.span} XP to level {after.level + 1}
      </div>
    </Card>
  )
}

function Summary({ result, onDone }: { result: FinishResult; onDone: () => void }) {
  const plan = usePlan()
  const palette = usePalette()
  const accent = useTheme((s) => s.accent)
  const theme = useTheme((s) => s.theme)
  const [sharing, setSharing] = useState<string | null>(null)
  const streak = useLiveQuery(async () => {
    if (!plan) return null
    const ws = await db.workouts.toArray()
    return weeklyStreak(planDates(ws), plan.profile.daysPerWeek, todayISO())
  }, [plan])
  const sets = result.log.exercises.filter((e) => e.block === 'main' || e.block === 'finisher').reduce((n, e) => n + e.sets.length, 0)
  const changes = result.changes.filter((c) => c.kind !== 'goal_down' || result.changes.length < 6)
  const firstMain = result.log.exercises.find((e) => e.block === 'main')
  const stats = [
    { k: 'Minutes', v: result.minutes, prefix: '' },
    { k: 'Calories', v: result.log.calories, prefix: '~' },
    { k: 'Sets', v: sets, prefix: '' },
    { k: 'XP earned', v: result.xp, prefix: '+' },
  ]

  const share = async () => {
    setSharing('Making your card…')
    const ex = firstMain ? exById(firstMain.exerciseId) : undefined
    const a = accentInfo(accent)
    const blob = await makeShareCard({
      title: result.log.title,
      dateLabel: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
      minutes: result.minutes,
      kcal: result.log.calories,
      sets,
      xp: result.xp,
      streakWeeks: streak?.weeks ?? 0,
      motion: ex ? motionFor(ex) : undefined,
      palette,
      accent: theme === 'light' ? a.light : a.dark,
    })
    if (!blob) {
      setSharing('Couldn’t make the image on this phone.')
      return
    }
    const how = await shareImage(blob, 'forge-workout.png', `Just finished ${result.log.title} with Forge 💪`)
    setSharing(how === 'downloaded' ? 'Saved the image.' : null)
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 safe-top">
      <div className="mt-8 text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <span aria-hidden className="absolute inset-0 rounded-full bg-amber/25 animate-ping [animation-duration:2.2s] [animation-iteration-count:2]" />
          <span className="relative text-6xl animate-bounce-in">🏆</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold animate-fade-up">Nice work!</h1>
        <p className="text-muted animate-fade-up [animation-delay:100ms]">{result.log.title}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {stats.map((x, i) => (
          <Card key={x.k} className="animate-rise py-3 text-center" style={{ animationDelay: `${150 + i * 90}ms` }}>
            <div className={cx('font-display text-3xl font-bold tabular', x.k === 'XP earned' && 'text-violet')}>
              {x.prefix}
              <CountUp value={x.v} duration={900 + i * 150} />
            </div>
            <div className="text-xs uppercase tracking-wider text-muted">{x.k}</div>
          </Card>
        ))}
      </div>
      <XpBar gained={result.xp} />
      {streak ? (
        <Card className="mt-3 flex items-center gap-3 animate-fade-up [animation-delay:650ms]">
          <Flame className="animate-flame text-ember" size={28} />
          <div>
            <div className="font-semibold">
              {streak.weeks > 0 ? `${streak.weeks}-week streak` : 'Streak building'} · {Math.min(streak.thisWeek, streak.target)}/{streak.target} this week
            </div>
            <div className="text-sm text-muted">
              {streak.thisWeek >= streak.target ? 'Weekly goal hit — anything more is a bonus.' : `${streak.target - streak.thisWeek} more to hit this week's goal.`}
            </div>
          </div>
        </Card>
      ) : null}
      {result.achievements.length ? (
        <>
          <h2 className="mt-6 mb-2 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted">Unlocked</h2>
          <div className="space-y-2">
            {result.achievements.map((a) => (
              <Card key={a.id} className="flex items-center gap-3 border-amber/40 bg-amber/10">
                <span className="text-3xl">{a.badge}</span>
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-muted">{a.description}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : null}
      {changes.length ? (
        <>
          <h2 className="mt-6 mb-2 px-1 text-[13px] font-semibold uppercase tracking-wider text-muted">Next time</h2>
          <Card className="divide-y divide-line/60 py-1">
            {changes.map((c, k) => (
              <div key={k} className="flex items-center gap-3 py-2.5 text-sm">
                {changeIcon(c)}
                <span className="flex-1">{c.message}</span>
              </div>
            ))}
          </Card>
        </>
      ) : null}
      {sharing ? <p className="mt-3 text-center text-sm text-muted">{sharing}</p> : null}
      <div className="mt-auto grid grid-cols-[auto_1fr] gap-2 pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <Button size="lg" variant="secondary" icon={<Share2 size={20} />} onClick={() => void share()}>
          Share
        </Button>
        <Button block size="lg" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
