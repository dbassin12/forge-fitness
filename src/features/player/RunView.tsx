import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Check, ChevronsRight, Lightbulb, Pause, Play, Plus, SkipBack, Volume2, VolumeX, X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, highlightFor, motionFor } from '@/data/exercises'
import { TIPS } from '@/data/tips'
import { repSeconds, type PlannedSession } from '@/engines/plan'
import { Button } from '@/ui/Button'
import { Stepper } from '@/ui/Stepper'
import { cx } from '@/ui/cx'
import { chime, go, tick } from '@/voice/beeps'
import { useCaption } from '@/voice/captions'
import { useVoiceSettings } from '@/voice/settings'
import { speech } from '@/voice/speech'
import { vibrate } from '@/device/haptics'
import { describeWork, prevWork, type RestStep, type Step, type WorkStep } from './steps'
import type { StepValues } from './finish'

const MOD_EXTRA: Record<string, (r: number) => number> = {
  tempo: (r) => r + 2,
  pause: (r) => r + 2,
  one_and_half: (r) => r * 1.6,
}

/** Seconds per counted rep for a work step (animation tempo, modifiers, alternating sides). */
export function secondsPerRep(w: WorkStep): number {
  const base = repSeconds(w.item.exerciseId)
  const mod = w.item.modifier ? MOD_EXTRA[w.item.modifier] : undefined
  return (mod ? mod(base) : base) * w.cyclesPerRep
}

/** Pausable stopwatch in seconds. */
function useClock() {
  const r = useRef({ base: 0, since: performance.now(), running: true })
  return useMemo(
    () => ({
      now: () => (r.current.running ? r.current.base + (performance.now() - r.current.since) / 1000 : r.current.base),
      reset: () => {
        r.current = { base: 0, since: performance.now(), running: r.current.running }
      },
      pause: () => {
        if (!r.current.running) return
        r.current = { base: r.current.base + (performance.now() - r.current.since) / 1000, since: performance.now(), running: false }
      },
      resume: () => {
        if (r.current.running) return
        r.current = { ...r.current, since: performance.now(), running: true }
      },
    }),
    [],
  )
}

const say = (text: string, interrupt = false) => void speech.speak(text, { priority: 'cue', interrupt })

function nameOf(w?: WorkStep) {
  return w ? (getExercise(w.item.exerciseId)?.name ?? '') : ''
}

function announce(st: Step, steps: Step[], i: number) {
  if (st.kind === 'work') return
  const n = st.next
  const what = n ? `${nameOf(n)}, ${describeWork(n)}` : ''
  const prev = steps[i - 1]
  const sameEx = prev?.kind === 'work' && n && prev.item.exerciseId === n.item.exerciseId
  switch (st.reason) {
    case 'ready':
      say(`Get ready. First up: ${what}.`, true)
      break
    case 'side':
      say('Switch sides.', true)
      break
    case 'switch':
      say(`Next: ${what}.`, true)
      break
    case 'set':
      say(sameEx ? `Rest ${st.seconds} seconds. Then set ${n!.round} of ${n!.rounds}.` : `Rest ${st.seconds} seconds. Next: ${what}.`, true)
      break
    case 'round':
      say(`Round done. Rest ${st.seconds} seconds. Next: ${what}.`, true)
      break
    case 'block': {
      const needsDb = n ? getExercise(n.item.exerciseId)?.equipment.some((e) => e.startsWith('db')) : false
      say(`Nice work. Next: ${what}.${needsDb ? ' Grab your dumbbells.' : ''}`, true)
      break
    }
  }
}

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : String(s)
}

function Ring({ progress, children, tone = 'ember' }: { progress: number; children: React.ReactNode; tone?: 'ember' | 'teal' }) {
  const C = 2 * Math.PI * 46
  return (
    <div className={cx('relative grid h-44 w-44 place-items-center', tone === 'ember' ? 'text-ember' : 'text-teal')}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="5" />
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${Math.max(0, Math.min(1, progress)) * C} ${C}`} />
      </svg>
      <div className="text-center">{children}</div>
    </div>
  )
}

export interface RunViewProps {
  session: PlannedSession
  steps: Step[]
  cursor: number
  values: StepValues
  onCursor: (i: number, values: StepValues) => void
  onValues: (v: StepValues) => void
  onComplete: (values: StepValues) => void
  onQuit: () => void
}

export function RunView({ session, steps, cursor, values, onCursor, onValues, onComplete, onQuit }: RunViewProps) {
  const palette = usePalette()
  const clock = useClock()
  const [paused, setPaused] = useState(false)
  const [extra, setExtra] = useState(0)
  const [, force] = useReducer((x: number) => x + 1, 0)
  const flags = useRef(new Set<string>())
  const lastCount = useRef(0)
  const finishingAt = useRef<number | null>(null)
  const valuesRef = useRef(values)
  valuesRef.current = values
  const caption = useCaption((s) => s.text)
  const voiceOn = useVoiceSettings((s) => s.enabled)
  const guided = useVoiceSettings((s) => s.countReps)
  const updateVoice = useVoiceSettings((s) => s.update)
  const step = steps[cursor]
  const t = clock.now()

  const setValue = useCallback(
    (id: string, v: number) => {
      const next = { ...valuesRef.current, [id]: v }
      valuesRef.current = next
      onValues(next)
    },
    [onValues],
  )

  const advance = useCallback(() => {
    if (cursor + 1 >= steps.length) onComplete(valuesRef.current)
    else onCursor(cursor + 1, valuesRef.current)
  }, [cursor, steps.length, onComplete, onCursor])

  // New step: reset the clock and announce what's coming.
  useEffect(() => {
    clock.reset()
    flags.current.clear()
    lastCount.current = 0
    finishingAt.current = null
    setExtra(0)
    announce(steps[cursor], steps, cursor)
    force()
  }, [cursor, steps, clock])

  // The heartbeat: timers, counting, cues.
  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      const now = clock.now()
      const st = steps[cursor]
      const once = (k: string) => (flags.current.has(k) ? false : (flags.current.add(k), true))
      if (st.kind === 'rest') {
        const left = st.seconds + extra - now
        for (const n of [3, 2, 1]) if (left <= n && left > n - 1 && once(`b${n}`)) tick()
        if (left <= 0) {
          go()
          vibrate(40)
          if (st.next) say(st.reason === 'side' ? 'Go.' : 'Go!', true)
          advance()
          return
        }
      } else if (st.seconds !== undefined) {
        const left = st.seconds - now
        const ex = getExercise(st.item.exerciseId)
        if (st.seconds >= 20 && now >= st.seconds / 3 && once('cue') && ex?.copy.cues.length) say(ex.copy.cues[st.setIndex % ex.copy.cues.length])
        if (st.seconds >= 30 && left <= 10 && left > 9 && once('ten')) say('Ten seconds.')
        else if (st.seconds >= 20 && now >= st.seconds / 2 && once('half') && !flags.current.has('ten')) say('Halfway.')
        for (const n of [3, 2, 1]) if (left <= n && left > n - 1 && once(`b${n}`)) tick()
        if (left <= 0) {
          chime()
          vibrate([60, 40, 60])
          if (valuesRef.current[st.id] === undefined) setValue(st.id, st.seconds)
          advance()
          return
        }
      } else if (guided) {
        const reps = st.reps ?? 0
        const per = secondsPerRep(st)
        const done = Math.min(reps, Math.floor(now / per))
        if (done > lastCount.current) {
          lastCount.current = done
          const ex = getExercise(st.item.exerciseId)
          if (done >= reps) {
            say(String(done), true)
            say('Nice!')
            chime()
            vibrate([60, 40, 60])
            if (valuesRef.current[st.id] === undefined) setValue(st.id, reps)
            finishingAt.current = now
          } else {
            say(String(done))
            if (reps >= 6 && done === Math.ceil(reps / 2) && ex?.copy.cues.length) say(ex.copy.cues[st.setIndex % ex.copy.cues.length])
            if (reps >= 4 && done === reps - 1) say('One more!')
          }
        }
        if (finishingAt.current !== null && now - finishingAt.current > 1.2) {
          finishingAt.current = null
          advance()
          return
        }
      }
      force()
    }, 100)
    return () => window.clearInterval(id)
  }, [cursor, steps, paused, extra, guided, clock, advance, setValue])

  const togglePause = () => {
    if (paused) {
      clock.resume()
      setPaused(false)
      say('Resume.', true)
    } else {
      clock.pause()
      setPaused(true)
      speech.cancel()
    }
  }

  const doneSet = () => {
    if (step.kind !== 'work') return
    if (valuesRef.current[step.id] === undefined) {
      const v = step.seconds !== undefined ? Math.round(Math.min(step.seconds, t)) : guided ? Math.max(lastCount.current, 0) || (step.reps ?? 0) : (step.reps ?? 0)
      setValue(step.id, v)
    }
    chime()
    advance()
  }

  const skip = () => {
    speech.cancel()
    advance()
  }

  const back = () => {
    speech.cancel()
    onCursor(prevWork(steps, cursor), valuesRef.current)
  }

  const workIdx = steps.slice(0, cursor + 1).filter((s) => s.kind === 'work').length
  const workTotal = steps.filter((s) => s.kind === 'work').length

  // Header (shared).
  const header = (
    <div className="safe-top px-4 pt-2">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="End workout" onClick={onQuit} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
          <X size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-semibold">{step.kind === 'work' ? step.blockTitle : step.next?.blockTitle}</div>
          <div className="text-xs text-muted tabular">
            {step.kind === 'work' || step.next
              ? (() => {
                  const w = step.kind === 'work' ? step : step.next!
                  return w.rounds > 1 ? `Round ${w.round} of ${w.rounds}` : session.title
                })()
              : session.title}
          </div>
        </div>
        <button
          type="button"
          aria-label={voiceOn ? 'Mute voice' : 'Turn voice on'}
          onClick={() => {
            if (voiceOn) speech.cancel()
            updateVoice({ enabled: !voiceOn })
          }}
          className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2"
        >
          {voiceOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={workIdx} aria-valuemax={workTotal}>
        <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${(workIdx / Math.max(1, workTotal)) * 100}%` }} />
      </div>
    </div>
  )

  const captionBar = (
    <div className="mt-3 min-h-[3rem] px-6 text-center text-[15px] leading-snug text-muted" aria-live="polite">
      {caption}
    </div>
  )

  if (step.kind === 'rest') return <RestScreen key={step.id} {...{ step, steps, cursor, values, setValue, extra, setExtra, t, paused, togglePause, skip, header, captionBar, palette }} />

  const ex = getExercise(step.item.exerciseId)!
  const motion = motionFor(ex)
  const hl = highlightFor(ex)
  const per = step.seconds === undefined ? secondsPerRep(step) : 0
  const motionClock = () => {
    const now = clock.now()
    return step.seconds === undefined && per > 0 ? (now / per) * (repSeconds(ex.id) * step.cyclesPerRep) : now
  }
  const count = step.seconds === undefined ? (guided ? Math.min(step.reps ?? 0, Math.floor(t / per)) : null) : null

  return (
    <div className="flex min-h-dvh flex-col">
      {header}
      <div className="mx-4 mt-3 overflow-hidden rounded-3xl border border-line bg-surface">
        <Mannequin motion={motion} clock={motionClock} palette={palette} pulse={hl.primary} className="aspect-[4/3] w-full" title={`${ex.name} demonstration`} />
      </div>
      <div className="mt-4 px-4 text-center">
        <h1 className="font-display text-[28px] font-bold leading-tight">{ex.name}</h1>
        <div className="mt-1 text-muted">
          {describeWork(step)}
          {step.item.loadLb ? ` · ${step.item.loadLb} lb` : ''}
        </div>
        {step.item.notes.length ? <div className="mt-1 text-sm text-amber">{step.item.notes[0]}</div> : null}
      </div>
      <div className="mt-3 flex justify-center">
        {step.seconds !== undefined ? (
          <Ring progress={1 - t / step.seconds}>
            <div className="font-display text-6xl font-bold tabular">{fmt(step.seconds - t)}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">{paused ? 'paused' : 'seconds'}</div>
          </Ring>
        ) : (
          <Ring progress={count !== null ? count / Math.max(1, step.reps ?? 1) : 0}>
            <div className="font-display text-6xl font-bold tabular">{count !== null ? count : (step.reps ?? 0)}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">{paused ? 'paused' : count !== null ? `of ${step.reps} reps` : 'reps — your pace'}</div>
          </Ring>
        )}
      </div>
      {captionBar}
      <div className="mt-auto grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <button type="button" aria-label="Previous exercise" onClick={back} className="grid h-14 w-14 place-items-center rounded-full border border-line bg-surface-2 text-muted">
          <SkipBack size={22} />
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" variant="secondary" onClick={togglePause} icon={paused ? <Play size={20} /> : <Pause size={20} />}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button size="lg" onClick={doneSet} icon={<Check size={20} />}>
            Done
          </Button>
        </div>
        <button type="button" aria-label="Skip" onClick={skip} className="grid h-14 w-14 place-items-center rounded-full border border-line bg-surface-2 text-muted">
          <ChevronsRight size={22} />
        </button>
      </div>
    </div>
  )
}

const REST_TIPS = TIPS.filter((x) => x.contexts.includes('rest-between-sets'))

function RestScreen({
  step,
  steps,
  cursor,
  values,
  setValue,
  extra,
  setExtra,
  t,
  paused,
  togglePause,
  skip,
  header,
  captionBar,
  palette,
}: {
  step: RestStep
  steps: Step[]
  cursor: number
  values: StepValues
  setValue: (id: string, v: number) => void
  extra: number
  setExtra: (fn: (x: number) => number) => void
  t: number
  paused: boolean
  togglePause: () => void
  skip: () => void
  header: React.ReactNode
  captionBar: React.ReactNode
  palette: ReturnType<typeof usePalette>
}) {
  const prev = steps[cursor - 1]
  const last = prev?.kind === 'work' ? prev : undefined
  const lastEx = last ? getExercise(last.item.exerciseId) : undefined
  const next = step.next
  const nextEx = next ? getExercise(next.item.exerciseId) : undefined
  const total = step.seconds + extra
  const tip = useMemo(() => (REST_TIPS.length ? REST_TIPS[(cursor * 7) % REST_TIPS.length] : undefined), [cursor])
  const short = step.reason === 'switch' || step.reason === 'side'
  return (
    <div className="flex min-h-dvh flex-col">
      {header}
      <div className="mt-6 flex flex-col items-center">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">{step.label}</div>
        <div className="mt-3">
          <Ring progress={1 - t / total} tone="teal">
            <div className="font-display text-6xl font-bold tabular">{fmt(total - t)}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">{paused ? 'paused' : 'seconds'}</div>
          </Ring>
        </div>
        <div className="mt-4 flex gap-2">
          {!short ? (
            <Button variant="secondary" size="sm" icon={<Plus size={16} />} onClick={() => setExtra((x) => x + 15)}>
              15 s
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={togglePause} icon={paused ? <Play size={16} /> : <Pause size={16} />}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button size="sm" onClick={skip} icon={<ChevronsRight size={16} />}>
            {short ? 'Go' : 'Skip rest'}
          </Button>
        </div>
      </div>
      {captionBar}
      <div className="mt-auto space-y-3 px-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        {last && lastEx && values[last.id] !== undefined ? (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted">Just did</div>
              <div className="truncate font-semibold">{lastEx.name}</div>
            </div>
            <Stepper
              value={values[last.id]}
              onChange={(v) => setValue(last.id, v)}
              min={0}
              max={last.seconds !== undefined ? 600 : 100}
              step={last.seconds !== undefined ? 5 : 1}
              unit={last.seconds !== undefined ? 's' : 'reps'}
              label={`${lastEx.name} result`}
            />
          </div>
        ) : null}
        {next && nextEx ? (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2">
            <div className="w-24 shrink-0 overflow-hidden rounded-xl bg-bg">
              <Mannequin motion={motionFor(nextEx)} speed={0.7} palette={palette} className="aspect-[4/3] w-full" title={nextEx.name} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-ember">Next up</div>
              <div className="truncate font-semibold">{nextEx.name}</div>
              <div className="text-sm text-muted">
                {describeWork(next)}
                {next.item.loadLb ? ` · ${next.item.loadLb} lb` : ''}
              </div>
            </div>
          </div>
        ) : null}
        {tip && !short ? (
          <div className="flex gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-muted">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber" />
            <span>
              <b className="text-ink">{tip.title}.</b> {tip.text}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
