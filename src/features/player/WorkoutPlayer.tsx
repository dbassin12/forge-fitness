import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import confetti from 'canvas-confetti'
import { ArrowDown, ArrowUp, Award, Clock, Flame, Frown, Meh, Play, RotateCcw, Smile, Sparkles, Star, Zap } from 'lucide-react'
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
    void speech.speak('Workout complete. Amazing job!', { priority: 'cue', interrupt: true })
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
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      void confetti({ particleCount: 140, spread: 75, origin: { y: 0.35 }, colors: ['#ff6a3d', '#ffb547', '#2dd4bf', '#a78bfa'] })
    }
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
    const opts: { r: Rating; label: string; text: string; Icon: typeof Smile; tone: string }[] = [
      { r: 'easy', label: 'Too easy', text: 'I had plenty left', Icon: Smile, tone: 'text-good' },
      { r: 'right', label: 'Just right', text: 'Challenging but doable', Icon: Meh, tone: 'text-amber' },
      { r: 'hard', label: 'Too hard', text: 'I struggled to finish', Icon: Frown, tone: 'text-bad' },
    ]
    return (
      <div className="flex min-h-dvh flex-col px-4 safe-top">
        <div className="mt-10 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-3 font-display text-3xl font-bold">Workout done!</h1>
          <p className="mt-1 text-muted">How did that feel? Your next workout adapts to your answer.</p>
        </div>
        <div className="mt-8 space-y-3">
          {opts.map(({ r, label, text, Icon, tone }) => (
            <button
              key={r}
              type="button"
              disabled={phase === 'saving'}
              onClick={() => void save(r)}
              className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left active:scale-[0.99] disabled:opacity-50"
            >
              <Icon size={28} className={tone} />
              <span>
                <span className="block font-semibold">{label}</span>
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
      <div className="mt-4 space-y-1 rounded-2xl bg-surface-2 p-3 text-sm">
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
        <Button block size="lg" icon={<Play size={22} />} onClick={() => start(null)} className={cx(resumable && 'opacity-90')}>
          {resumable ? 'Start fresh' : "Let's go"}
        </Button>
      </div>
    </div>
  )
}

function Summary({ result, onDone }: { result: FinishResult; onDone: () => void }) {
  const plan = usePlan()
  const streak = useLiveQuery(async () => {
    if (!plan) return null
    const ws = await db.workouts.toArray()
    return weeklyStreak(planDates(ws), plan.profile.daysPerWeek, todayISO())
  }, [plan])
  const sets = result.log.exercises.filter((e) => e.block === 'main' || e.block === 'finisher').reduce((n, e) => n + e.sets.length, 0)
  const changes = result.changes.filter((c) => c.kind !== 'goal_down' || result.changes.length < 6)
  return (
    <div className="flex min-h-dvh flex-col px-4 safe-top">
      <div className="mt-8 text-center">
        <Award size={48} className="mx-auto text-ember" />
        <h1 className="mt-2 font-display text-3xl font-bold">Nice work!</h1>
        <p className="text-muted">{result.log.title}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {[
          { k: 'Time', v: `${result.minutes} min` },
          { k: 'Calories', v: `~${result.log.calories}` },
          { k: 'Sets', v: String(sets) },
          { k: 'XP earned', v: `+${result.xp}` },
        ].map((x) => (
          <Card key={x.k} className="py-3 text-center">
            <div className="font-display text-2xl font-bold tabular">{x.v}</div>
            <div className="text-xs uppercase tracking-wider text-muted">{x.k}</div>
          </Card>
        ))}
      </div>
      {streak ? (
        <Card className="mt-3 flex items-center gap-3">
          <Flame className="text-ember" size={26} />
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
      <div className="mt-auto pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <Button block size="lg" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
