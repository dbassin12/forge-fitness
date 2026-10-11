import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Check, ChevronsRight, CircleHelp, Lightbulb, Pause, Play, PlayCircle, Plus, SkipBack, ThumbsDown, Volume2, VolumeX, Wind, X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, highlightFor, motionFor, type Exercise } from '@/data/exercises'
import { isBloom, W } from '@/app/brand'
import { TIPS } from '@/data/tips'
import { repSeconds, repWord, type PlannedSession } from '@/engines/plan'
import { Button } from '@/ui/Button'
import { Sheet } from '@/ui/Sheet'
import { Stepper } from '@/ui/Stepper'
import { cx } from '@/ui/cx'
import { chime, go, tick } from '@/voice/beeps'
import { useCaption } from '@/voice/captions'
import { useVoiceSettings } from '@/voice/settings'
import { speech } from '@/voice/speech'
import { haptic, vibrate } from '@/device/haptics'
import { coachLine } from '@/voice/coachLines'
import { TutorialPlayer } from '../train/TutorialPlayer'
import { holdsForIntro, restLines } from './announce'
import { howToSteps, introLines, type HowToDepth } from './howto'
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

/** Once the coach has finished introducing the next exercise, the countdown runs from here. */
const HOLD_SEC = 4

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

/** Gentle reminders for long yoga holds (Bloom). */
const HOLD_BREATHS = [
  'Breathe in slowly, and let the breath out even more slowly.',
  'Soften your face and your jaw. Keep breathing.',
  'With each breath out, let go a little more, only if it feels good.',
  'Notice your breath. Let it be smooth and easy.',
  'Relax your shoulders. Stay with your breath.',
]

function fmt(sec: number) {
  const s = Math.max(0, Math.ceil(sec))
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : String(s)
}

function Ring({ progress, children, tone = 'ember', className, burstKey }: { progress: number; children: React.ReactNode; tone?: 'ember' | 'teal'; className?: string; burstKey?: number | string }) {
  const C = 2 * Math.PI * 46
  return (
    <div className={cx('relative grid shrink-0 place-items-center', tone === 'ember' ? 'text-ember' : 'text-teal', className ?? 'h-44 w-44')}>
      {burstKey !== undefined ? <span key={burstKey} aria-hidden className="pointer-events-none absolute inset-2 rounded-full bg-current opacity-0 animate-burst" /> : null}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${Math.max(0, Math.min(1, progress)) * C} ${C}`}
          style={{ transition: 'stroke-dasharray 300ms ease-out', filter: 'drop-shadow(0 0 6px currentColor)' }}
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

/** Round/set dots: done, current, to come. */
function SetDots({ round, rounds }: { round: number; rounds: number }) {
  if (rounds <= 1) return null
  return (
    <span className="flex items-center gap-1" aria-label={`Set ${round} of ${rounds}`}>
      {Array.from({ length: rounds }, (_, i) => (
        <span key={i} className={cx('h-2 rounded-full transition-all', i + 1 < round ? 'w-2 bg-ember' : i + 1 === round ? 'w-5 bg-ember' : 'w-2 bg-white/25')} />
      ))}
    </span>
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
  /** How much the coach explains an exercise before its first set (default: just its name). */
  depthOf?: (exerciseId: string) => HowToDepth
  /** The coach just explained this exercise in full. */
  onExplained?: (exerciseId: string) => void
  /** Leave the rest of an exercise out of this workout (and with `forever`, out of every workout). */
  onSkipExercise?: (exerciseId: string, forever: boolean) => void
}

type Overlay = 'howto' | 'skip' | 'tutorial' | null

export function RunView({ session, steps, cursor, values, onCursor, onValues, onComplete, onQuit, depthOf, onExplained, onSkipExercise }: RunViewProps) {
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

  // Decided once per step (and what follows it): how much to explain, and which screen to show.
  // Explaining a move bumps its count, which must not flip the screen mid-explanation.
  const nextOf = step.kind === 'rest' ? step.next?.item.exerciseId : undefined
  const planKey = `${step.id}>${nextOf ?? ''}`
  const stepPlan = useRef<{ key: string; depth: HowToDepth; howTo: boolean } | null>(null)
  if (stepPlan.current?.key !== planKey) {
    const depth: HowToDepth = nextOf && depthOf ? depthOf(nextOf) : 'name'
    stepPlan.current = { key: planKey, depth, howTo: step.kind === 'rest' && !!step.first && depth === 'full' }
  }

  // What the coach is saying to bring in the next exercise, and how far it has got.
  const intro = useRef<{ lines: string[]; at: number }>({ lines: [], at: 0 })
  const [line, setLine] = useState(0)
  // While true, a rest can't count down past HOLD_SEC: the coach is still explaining.
  const hold = useRef(false)
  const [holding, setHolding] = useState(false)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const resumeAfterOverlay = useRef<'no' | 'yes' | 'now'>('no')
  const speakToken = useRef(0)
  const explainedRef = useRef(onExplained)
  explainedRef.current = onExplained

  /** Stop talking and forget any explanation in progress. */
  const hush = useCallback(() => {
    speakToken.current++
    speech.cancel()
  }, [])

  const setValue = useCallback(
    (id: string, v: number) => {
      const next = { ...valuesRef.current, [id]: v }
      valuesRef.current = next
      onValues(next)
    },
    [onValues],
  )

  const advance = useCallback(() => {
    speakToken.current++
    if (cursor + 1 >= steps.length) onComplete(valuesRef.current)
    else onCursor(cursor + 1, valuesRef.current)
  }, [cursor, steps.length, onComplete, onCursor])

  /** Let the countdown finish: at least HOLD_SEC more, so "3, 2, 1" comes after the coach. */
  const release = useCallback(() => {
    if (!hold.current) return
    hold.current = false
    setHolding(false)
    const st = steps[cursor]
    if (st?.kind === 'rest') {
      const now = clock.now()
      setExtra((x) => Math.max(x, now + HOLD_SEC - st.seconds))
    }
  }, [steps, cursor, clock])

  /** Speak the intro lines from `from` on, tracking the current line; release the hold at the end. */
  const speakIntro = useCallback(
    (from: number) => {
      const token = ++speakToken.current
      speech.cancel()
      const { lines } = intro.current
      intro.current.at = from
      setLine(from)
      let last: Promise<void> = Promise.resolve()
      for (let k = from; k < lines.length; k++) {
        last = speech.speak(lines[k], { priority: 'cue' }).then(() => {
          if (speakToken.current !== token) return
          intro.current.at = k + 1
          setLine(k + 1)
        })
      }
      void last.then(() => {
        if (speakToken.current === token) release()
      })
    },
    [release],
  )

  // New step: reset the clock and announce what's coming (explaining it the first time).
  useEffect(() => {
    clock.reset()
    flags.current.clear()
    lastCount.current = 0
    finishingAt.current = null
    setExtra(0)
    setOverlay(null)
    const st = steps[cursor]
    if (st?.kind === 'rest') {
      const id = st.next?.item.exerciseId
      const depth = stepPlan.current?.depth ?? 'name'
      intro.current = { lines: restLines(st, steps[cursor - 1], depth), at: 0 }
      hold.current = holdsForIntro(st, depth)
      setHolding(hold.current)
      if (id && st.first && depth === 'full') explainedRef.current?.(id)
      speakIntro(0)
    } else {
      intro.current = { lines: [], at: 0 }
      hold.current = false
      setHolding(false)
    }
    force()
  }, [cursor, steps, clock, speakIntro])

  // The heartbeat: timers, counting, cues.
  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      const now = clock.now()
      const st = steps[cursor]
      const once = (k: string) => (flags.current.has(k) ? false : (flags.current.add(k), true))
      if (st.kind === 'rest') {
        const left = st.seconds + extra - now
        if (hold.current && left <= HOLD_SEC) {
          force()
          return
        }
        for (const n of [3, 2, 1]) if (left <= n && left > n - 1 && once(`b${n}`)) tick()
        if (left <= 0) {
          go()
          vibrate(40)
          speakToken.current++
          if (st.next) say(isBloom ? 'Begin.' : st.reason === 'side' ? 'Go.' : 'Go!', true)
          advance()
          return
        }
      } else if (st.seconds !== undefined) {
        const left = st.seconds - now
        const ex = getExercise(st.item.exerciseId)
        if (isBloom) {
          // Yoga holds: one alignment cue, a breath reminder in long holds, and quiet otherwise.
          if (st.seconds >= 20 && now >= Math.min(8, st.seconds / 4) && once('cue') && ex?.copy.cues.length) say(ex.copy.cues[st.setIndex % ex.copy.cues.length])
          if (st.seconds >= 40 && now >= st.seconds * 0.6 && once('breath')) say(HOLD_BREATHS[(st.setIndex + cursor) % HOLD_BREATHS.length])
          if (st.seconds >= 60 && left <= 10 && left > 9 && once('ten')) say(coachLine('tenLeft'))
        } else {
          if (st.seconds >= 20 && now >= st.seconds / 3 && once('cue') && ex?.copy.cues.length) say(ex.copy.cues[st.setIndex % ex.copy.cues.length])
          if (st.seconds >= 30 && left <= 10 && left > 9 && once('ten')) say(coachLine('tenLeft'))
          else if (st.seconds >= 20 && now >= st.seconds / 2 && once('half') && !flags.current.has('ten')) say(coachLine('half'))
        }
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
          haptic('light')
          if (done >= reps) {
            say(String(done), true)
            say(coachLine('setDone'))
            chime()
            vibrate([60, 40, 60])
            if (valuesRef.current[st.id] === undefined) setValue(st.id, reps)
            finishingAt.current = now
          } else {
            say(String(done))
            if (reps >= 6 && done === Math.ceil(reps / 2) && ex?.copy.cues.length) say(ex.copy.cues[st.setIndex % ex.copy.cues.length])
            if (reps >= 4 && done === reps - 1) say(coachLine('oneMore'))
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

  const resume = useCallback(() => {
    clock.resume()
    setPaused(false)
    // Pick the explanation up where it stopped.
    if (hold.current) speakIntro(intro.current.at)
    else say('Resume.', true)
  }, [clock, speakIntro])

  const togglePause = () => {
    if (paused) resume()
    else {
      clock.pause()
      setPaused(true)
      hush()
    }
  }

  // Overlays (how-to, skip, tutorial) pause the workout and resume it when they close.
  const openOverlay = (o: Exclude<Overlay, null>) => {
    if (!overlay) {
      resumeAfterOverlay.current = paused ? 'no' : 'yes'
      if (!paused) {
        clock.pause()
        setPaused(true)
      }
    }
    hush()
    setOverlay(o)
  }
  const closeOverlay = () => {
    if (resumeAfterOverlay.current === 'yes') resumeAfterOverlay.current = 'now'
    setOverlay(null)
  }
  // Resume after the overlay is gone (the tutorial silences speech as it unmounts).
  useEffect(() => {
    if (overlay || resumeAfterOverlay.current !== 'now') return
    resumeAfterOverlay.current = 'no'
    resume()
  }, [overlay, resume])

  /** Read the full how-to now (from a rest screen that only named the next exercise). */
  const explainNow = () => {
    if (step.kind !== 'rest' || !step.next) return
    const ex = getExercise(step.next.item.exerciseId)
    if (!ex) return
    if (stepPlan.current) stepPlan.current.howTo = true
    intro.current = { lines: introLines(ex, step.next, 'full', cursor === 0 ? 'first' : 'next'), at: 0 }
    hold.current = true
    setHolding(true)
    explainedRef.current?.(ex.id)
    if (paused) {
      clock.resume()
      setPaused(false)
    }
    speakIntro(0)
  }

  const subject = step.kind === 'work' ? getExercise(step.item.exerciseId) : step.next ? getExercise(step.next.item.exerciseId) : undefined

  const skipExercise = (forever: boolean) => {
    if (!subject || !onSkipExercise) return
    resumeAfterOverlay.current = 'no'
    setOverlay(null)
    hush()
    clock.resume()
    setPaused(false)
    onSkipExercise(subject.id, forever)
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
    hush()
    useCaption.getState().clear()
    advance()
  }

  /** Done listening: start the exercise now, with the same beep and "Go!" as the countdown. */
  const startNow = () => {
    hush()
    go()
    vibrate(40)
    say(isBloom ? 'Begin.' : 'Go!', true)
    advance()
  }

  const back = () => {
    hush()
    onCursor(prevWork(steps, cursor), valuesRef.current)
  }

  const workIdx = steps.slice(0, cursor + 1).filter((s) => s.kind === 'work').length
  const workTotal = steps.filter((s) => s.kind === 'work').length

  // Header (shared).
  const header = (
    <div className="safe-top px-4 pt-2">
      <div className="flex items-center gap-2">
        <button type="button" aria-label={isBloom ? 'End practice' : 'End workout'} onClick={onQuit} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
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
            if (!voiceOn) return updateVoice({ enabled: true })
            hush()
            updateVoice({ enabled: false })
            // Mid-explanation: carry on from the same step, as captions.
            if (hold.current && !paused) speakIntro(intro.current.at)
          }}
          className="-mr-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2"
        >
          {voiceOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={workIdx} aria-valuemax={workTotal} aria-label={isBloom ? 'Practice progress' : 'Workout progress'}>
        <div className="h-full rounded-full bg-gradient-to-r from-ember to-amber transition-[width] duration-500" style={{ width: `${(workIdx / Math.max(1, workTotal)) * 100}%` }} />
      </div>
    </div>
  )

  const captionBar = (
    <div className="line-clamp-2 min-h-[2.75rem] px-6 pt-2 text-center text-[15px] leading-snug text-muted" aria-live="polite">
      {caption}
    </div>
  )

  const overlays = subject ? (
    <>
      <HowToSheet
        open={overlay === 'howto'}
        ex={subject}
        onClose={closeOverlay}
        onTutorial={() => setOverlay('tutorial')}
        onSkip={onSkipExercise ? () => setOverlay('skip') : undefined}
      />
      <SkipSheet open={overlay === 'skip'} ex={subject} onClose={closeOverlay} onSkip={skipExercise} />
      {overlay === 'tutorial' ? <TutorialPlayer exercise={subject} onClose={closeOverlay} /> : null}
    </>
  ) : null

  if (step.kind === 'rest') {
    const nextEx = step.next ? getExercise(step.next.item.exerciseId) : undefined
    // Which how-to step is being read out (the intro opens with the rest and the exercise name).
    const offset = nextEx ? intro.current.lines.indexOf(howToSteps(nextEx)[0]) : -1
    return (
      <>
        {stepPlan.current?.howTo && nextEx && step.next ? (
          <HowToScreen
            key={step.id}
            {...{ step, ex: nextEx, next: step.next, holding, extra, setExtra, t, paused, togglePause, header, palette }}
            skip={startNow}
            active={holding && offset >= 0 ? line - offset : undefined}
            first={cursor === 0}
            onTutorial={() => openOverlay('tutorial')}
            onSkipMove={onSkipExercise ? () => openOverlay('skip') : undefined}
          />
        ) : (
          <RestScreen key={step.id} {...{ step, steps, cursor, values, setValue, extra, setExtra, t, paused, holding, togglePause, skip, header, captionBar, palette }} onHowTo={explainNow} />
        )}
        {overlays}
      </>
    )
  }

  const ex = getExercise(step.item.exerciseId)!
  const motion = motionFor(ex)
  const hl = highlightFor(ex)
  const per = step.seconds === undefined ? secondsPerRep(step) : 0
  const motionClock = () => {
    const now = clock.now()
    return step.seconds === undefined && per > 0 ? (now / per) * (repSeconds(ex.id) * step.cyclesPerRep) : now
  }
  const count = step.seconds === undefined ? (guided ? Math.min(step.reps ?? 0, Math.floor(t / per)) : null) : null

  const target = step.seconds === undefined ? (step.reps ?? 0) : 0
  const showCount = count !== null ? count : target
  return (
    <div className="flex h-dvh flex-col overflow-y-auto overscroll-contain">
      {header}
      <div className="relative mx-4 mt-3 min-h-[150px] flex-1 overflow-hidden rounded-3xl border border-line bg-surface">
        <Mannequin motion={motion} clock={motionClock} palette={palette} pulse={hl.primary} className="h-full w-full" title={`${ex.name} demonstration`} />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {step.rounds > 1 ? <SetDots round={step.round} rounds={step.rounds} /> : step.blockTitle}
          </span>
          <span className="flex items-center gap-1.5">
            {step.item.loadLb ? <span className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{step.item.loadLb} lb</span> : null}
            <button
              type="button"
              onClick={() => openOverlay('howto')}
              className="pointer-events-auto flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur active:scale-95"
            >
              <CircleHelp size={14} /> How to
            </button>
          </span>
        </div>
        {paused && !overlay ? (
          <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-[2px]">
            <span className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 font-semibold text-white">
              <Pause size={18} /> Paused
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 px-4 pt-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[26px] font-bold leading-tight">{ex.name}</h1>
          <div className="mt-0.5 text-muted">{describeWork(step)}</div>
          {step.item.notes.length ? <div className="mt-1 line-clamp-2 text-sm text-amber">{step.item.notes[0]}</div> : null}
        </div>
        {step.seconds !== undefined ? (
          <Ring progress={1 - t / step.seconds} className="h-[min(36vw,19vh)] w-[min(36vw,19vh)] min-h-28 min-w-28">
            <div className="font-display text-5xl font-bold tabular leading-none">{fmt(step.seconds - t)}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{paused ? 'paused' : 'seconds'}</div>
          </Ring>
        ) : (
          <Ring progress={count !== null ? count / Math.max(1, target) : 0} className="h-[min(36vw,19vh)] w-[min(36vw,19vh)] min-h-28 min-w-28" burstKey={count ?? undefined}>
            <div key={showCount} className="font-display text-5xl font-bold tabular leading-none animate-count-pop">
              {showCount}
            </div>
            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{paused ? 'paused' : count !== null ? (isBloom && repWord(ex.id, target) !== 'rounds' ? `of ${target}` : `of ${target} ${repWord(ex.id, target)}`) : 'your pace'}</div>
          </Ring>
        )}
      </div>
      {captionBar}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pt-2 min-[360px]:gap-3 min-[360px]:px-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 14px)' }}>
        <button type="button" aria-label={isBloom ? 'Previous pose' : 'Previous exercise'} onClick={back} className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface-2 text-muted active:scale-90 min-[360px]:h-14 min-[360px]:w-14">
          <SkipBack size={22} />
        </button>
        <div className="grid min-w-0 grid-cols-[auto_1fr] gap-2">
          <Button size="lg" variant="secondary" className="w-12 px-0 min-[360px]:w-14" onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'} icon={paused ? <Play size={20} /> : <Pause size={20} />} />
          <Button size="lg" className="min-w-0 px-3" onClick={doneSet} icon={<Check size={22} strokeWidth={3} />}>
            Done
          </Button>
        </div>
        <button type="button" aria-label="Skip" onClick={skip} className="grid h-12 w-12 place-items-center rounded-full border border-line bg-surface-2 text-muted active:scale-90 min-[360px]:h-14 min-[360px]:w-14">
          <ChevronsRight size={22} />
        </button>
      </div>
      {overlays}
    </div>
  )
}

/** Numbered setup and movement steps; `active` is highlighted (the one being read out). */
function StepList({ steps, active, className }: { steps: string[]; active?: number; className?: string }) {
  const refs = useRef<(HTMLLIElement | null)[]>([])
  useEffect(() => {
    if (active === undefined || active < 0) return
    refs.current[active]?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [active])
  return (
    <ol className={cx('space-y-1.5', className)}>
      {steps.map((s, i) => {
        const on = i === active
        return (
          <li
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            className={cx('flex gap-2.5 rounded-xl px-2 py-1.5 transition-colors', on ? 'bg-ember/12 text-ink' : active !== undefined && active >= 0 && i > active ? 'text-muted' : 'text-ink')}
          >
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold', on ? 'bg-ember text-on-accent' : 'bg-surface-2 text-ember')}>{i + 1}</span>
            <span className="text-[15px] leading-snug">{s}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** Before an exercise's first set: what it is, how to do it (read out step by step), then go. */
function HowToScreen({
  step,
  ex,
  next,
  first,
  active,
  holding,
  extra,
  setExtra,
  t,
  paused,
  togglePause,
  skip,
  header,
  palette,
  onTutorial,
  onSkipMove,
}: {
  step: RestStep
  ex: Exercise
  next: WorkStep
  first: boolean
  /** Index of the how-to step being read out. */
  active?: number
  holding: boolean
  extra: number
  setExtra: (fn: (x: number) => number) => void
  t: number
  paused: boolean
  togglePause: () => void
  skip: () => void
  header: React.ReactNode
  palette: ReturnType<typeof usePalette>
  onTutorial: () => void
  onSkipMove?: () => void
}) {
  const hl = highlightFor(ex)
  const list = howToSteps(ex)
  const total = step.seconds + extra
  const left = holding ? Math.max(HOLD_SEC, total - t) : total - t
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {header}
      <div className="mt-3 flex min-h-0 flex-1 flex-col px-4">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface">
          <Mannequin motion={motionFor(ex)} speed={0.75} palette={palette} pulse={hl.primary} className="aspect-[16/9] max-h-[30vh] w-full" title={`${ex.name} demonstration`} />
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {first ? 'First up' : 'Up next'} · how to do it
          </span>
          {paused ? (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
              <Pause size={12} /> Paused
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold leading-tight">{ex.name}</h1>
            <div className="text-muted">
              {describeWork(next)}
              {next.item.loadLb ? ` · ${next.item.loadLb} lb` : ''}
            </div>
          </div>
          <Ring progress={holding ? 1 : 1 - t / total} tone="teal" className="h-16 w-16">
            <div className="font-display text-xl font-bold tabular leading-none" aria-label={holding ? 'Starts when the coach finishes' : `${fmt(left)} seconds`}>
              {holding ? <Volume2 size={18} className="text-teal" /> : fmt(left)}
            </div>
          </Ring>
        </div>
        <div className="no-scrollbar -mx-1 mt-2 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
          <StepList steps={list} active={active} />
          <div className="mt-2 flex gap-2 rounded-xl bg-surface-2 p-2.5 text-sm text-muted">
            <Wind size={16} className="mt-0.5 shrink-0 text-sky" />
            <span>{ex.copy.breathing}</span>
          </div>
        </div>
        <div className="flex justify-center gap-6 py-1.5 text-sm font-medium text-muted">
          <button type="button" onClick={onTutorial} className="flex items-center gap-1.5 py-1.5 hover:text-ink">
            <PlayCircle size={16} /> Full tutorial
          </button>
          {onSkipMove ? (
            <button type="button" onClick={onSkipMove} className="flex items-center gap-1.5 py-1.5 hover:text-ink">
              <ThumbsDown size={16} /> Not for me
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-[auto_auto_1fr] gap-2 px-4 pt-1" style={{ paddingBottom: 'calc(var(--safe-bottom) + 14px)' }}>
        <Button size="lg" variant="secondary" className="w-14 px-0" onClick={togglePause} aria-label={paused ? 'Resume' : 'Pause'} icon={paused ? <Play size={20} /> : <Pause size={20} />} />
        <Button size="lg" variant="secondary" className="px-3" onClick={() => setExtra((x) => x + 15)} aria-label="15 more seconds" icon={<Plus size={18} />}>
          15 s
        </Button>
        <Button size="lg" className="min-w-0 px-3" onClick={skip} icon={<Play size={20} fill="currentColor" />}>
          {holding ? 'Start now' : `Start · ${fmt(left)}`}
        </Button>
      </div>
    </div>
  )
}

/** Mid-set help: the steps, read aloud on request, plus the full tutorial and a way out. */
function HowToSheet({ open, ex, onClose, onTutorial, onSkip }: { open: boolean; ex: Exercise; onClose: () => void; onTutorial: () => void; onSkip?: () => void }) {
  const [reading, setReading] = useState(-1)
  const token = useRef(0)
  const list = howToSteps(ex)
  const stop = () => {
    token.current++
    speech.cancel()
    setReading(-1)
  }
  const read = () => {
    stop()
    const mine = token.current
    setReading(0)
    list.forEach((s, k) => {
      void speech.speak(s, { priority: 'narration' }).then(() => {
        if (token.current === mine) setReading(k + 1 < list.length ? k + 1 : -1)
      })
    })
  }
  const close = () => {
    stop()
    onClose()
  }
  return (
    <Sheet open={open} onClose={close} title={ex.name}>
      <p className="-mt-1 mb-3 text-sm text-muted">{ex.copy.summary}</p>
      <StepList steps={list} active={reading >= 0 ? reading : undefined} />
      <div className="mt-2 flex gap-2 rounded-xl bg-surface-2 p-2.5 text-sm text-muted">
        <Wind size={16} className="mt-0.5 shrink-0 text-sky" />
        <span>{ex.copy.breathing}</span>
      </div>
      {ex.copy.cues.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ex.copy.cues.map((c) => (
            <span key={c} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs">
              {c}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" icon={<Volume2 size={16} />} onClick={read}>
          Read it to me
        </Button>
        <Button
          variant="secondary"
          icon={<PlayCircle size={16} />}
          onClick={() => {
            stop()
            onTutorial()
          }}
        >
          Full tutorial
        </Button>
      </div>
      <Button block size="lg" className="mt-2" icon={<Play size={18} />} onClick={close}>
        Back to it
      </Button>
      {onSkip ? (
        <button
          type="button"
          onClick={() => {
            stop()
            onSkip()
          }}
          className="mt-1 flex w-full items-center justify-center gap-2 py-2.5 text-sm text-muted hover:text-ink"
        >
          <ThumbsDown size={15} /> Not for me: skip this {W.exercise}
        </button>
      ) : null}
    </Sheet>
  )
}

/** Skip an exercise for the rest of this workout, or for good. */
function SkipSheet({ open, ex, onClose, onSkip }: { open: boolean; ex: Exercise; onClose: () => void; onSkip: (forever: boolean) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={`Skip ${ex.name}?`}>
      <p className="-mt-1 mb-4 text-sm text-muted">Its remaining sets come out of this {W.workout}. Sets you already did still count.</p>
      <div className="grid gap-2">
        <Button block size="lg" onClick={() => onSkip(false)}>
          Skip it today
        </Button>
        <Button block variant="secondary" onClick={() => onSkip(true)}>
          Skip it and leave it out for good
        </Button>
        <p className="text-center text-xs text-muted">Changed your mind later? Settings › {isBloom ? 'Poses' : 'Exercises'} I skip.</p>
        <Button block variant="ghost" onClick={onClose}>
          Keep it
        </Button>
      </div>
    </Sheet>
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
  holding,
  togglePause,
  skip,
  header,
  captionBar,
  palette,
  onHowTo,
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
  holding: boolean
  togglePause: () => void
  skip: () => void
  header: React.ReactNode
  captionBar: React.ReactNode
  palette: ReturnType<typeof usePalette>
  onHowTo: () => void
}) {
  const prev = steps[cursor - 1]
  const last = prev?.kind === 'work' ? prev : undefined
  const lastEx = last ? getExercise(last.item.exerciseId) : undefined
  const next = step.next
  const nextEx = next ? getExercise(next.item.exerciseId) : undefined
  const total = step.seconds + extra
  const tip = useMemo(() => (REST_TIPS.length ? REST_TIPS[(cursor * 7) % REST_TIPS.length] : undefined), [cursor])
  const short = step.reason === 'switch' || step.reason === 'side'
  const left = holding ? Math.max(HOLD_SEC, total - t) : total - t
  const ready = step.reason === 'ready'
  // Box-ish breathing: 4 s in, 4 s out, synced to the breathe animation.
  const inhale = Math.floor(t / 4) % 2 === 0
  return (
    <div className="flex h-dvh flex-col overflow-y-auto overscroll-contain">
      {header}
      <div className="mt-3 flex flex-col items-center">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">{step.label}</div>
        <div className="relative mt-2 grid place-items-center">
          {!short && !ready && !paused ? <span aria-hidden className="absolute h-[min(52vw,30vh)] w-[min(52vw,30vh)] rounded-full bg-teal/10 animate-breathe" /> : null}
          {ready && !holding && left <= 3 && left > 0 && !paused ? (
            <div key={Math.ceil(left)} className="grid h-[min(44vw,25vh)] w-[min(44vw,25vh)] place-items-center font-display text-[110px] font-black leading-none text-teal animate-zoom-out">
              {Math.ceil(left)}
            </div>
          ) : (
            <Ring progress={1 - t / total} tone="teal" className="h-[min(44vw,25vh)] w-[min(44vw,25vh)] min-h-28 min-w-28">
              <div className="font-display text-6xl font-bold tabular">{fmt(left)}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted">{paused ? 'paused' : 'seconds'}</div>
            </Ring>
          )}
        </div>
        {!short && !ready ? (
          <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-teal" aria-hidden>
            <Wind size={15} /> {inhale ? 'Breathe in…' : 'Breathe out…'}
          </div>
        ) : null}
        <div className="mt-3 flex gap-2">
          {!short ? (
            <Button variant="secondary" size="sm" icon={<Plus size={16} />} onClick={() => setExtra((x) => x + 15)}>
              15 s
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={togglePause} icon={paused ? <Play size={16} /> : <Pause size={16} />}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button size="sm" onClick={skip} icon={<ChevronsRight size={16} />}>
            {short ? (isBloom ? 'Begin' : 'Go') : 'Skip rest'}
          </Button>
        </div>
      </div>
      {captionBar}
      <div className="mt-auto space-y-2.5 px-4 pt-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 14px)' }}>
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
              unit={last.seconds !== undefined ? 's' : isBloom ? repWord(last.item.exerciseId, 2) : 'reps'}
              label={`${lastEx.name} result`}
            />
          </div>
        ) : null}
        {next && nextEx ? (
          <div className="flex items-center gap-3 rounded-2xl border border-ember/30 bg-surface p-2">
            <div className="w-24 shrink-0 overflow-hidden rounded-xl bg-bg min-[360px]:w-28">
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
            <button
              type="button"
              onClick={onHowTo}
              aria-label={`How to do ${nextEx.name}`}
              className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-ember hover:bg-ember/10"
            >
              <CircleHelp size={20} /> How to
            </button>
          </div>
        ) : null}
        {tip && !short && !ready ? (
          <div className="flex gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-muted [@media(max-height:720px)]:hidden">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber" />
            <span className="line-clamp-3">
              <b className="text-ink">{tip.title}.</b> {tip.text}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
