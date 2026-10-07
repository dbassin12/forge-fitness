import { useEffect, useRef, useState } from 'react'
import { Hand, Pause, Play, SkipForward, Timer } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, highlightFor, motionFor } from '@/data/exercises'
import type { FitnessTest as TestResult } from '@/engines/plan/types'
import { todayISO } from '@/lib/dates'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Stepper } from '@/ui/Stepper'
import { chime, go, tick, unlockAudio } from '@/voice/beeps'
import { speech } from '@/voice/speech'
import { vibrate } from '@/device/haptics'

type Part = 'pushups' | 'squats' | 'plank'

const PARTS: { id: Part; exercise: string; title: string; how: string }[] = [
  {
    id: 'pushups',
    exercise: 'pushup',
    title: 'Max push-ups',
    how: 'Do as many full push-ups as you can with a straight body. Stop when your form breaks. If you can’t do one yet, enter zero — that’s a perfectly good starting point.',
  },
  {
    id: 'squats',
    exercise: 'bodyweight-squat',
    title: 'Squats in 60 seconds',
    how: 'Squat until your thighs are about parallel, then stand tall. Keep a steady pace for one minute and tap the big button for every rep.',
  },
  {
    id: 'plank',
    exercise: 'forearm-plank',
    title: 'Plank hold',
    how: 'Hold a forearm plank with your body in a straight line. Tap stop as soon as your hips sag or pike.',
  },
]

function useNow(active: boolean) {
  const [now, setNow] = useState(() => performance.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(performance.now()), 200)
    return () => window.clearInterval(id)
  }, [active])
  return now
}

/** Countdown "3, 2, 1, go" then start. */
function useCountdown(onGo: () => void) {
  const [count, setCount] = useState<number | null>(null)
  const goRef = useRef(onGo)
  goRef.current = onGo
  useEffect(() => {
    if (count === null) return
    if (count === 0) {
      go()
      void speech.speak('Go!', { priority: 'cue', interrupt: true })
      setCount(null)
      goRef.current()
      return
    }
    tick()
    const id = window.setTimeout(() => setCount((c) => (c === null ? null : c - 1)), 1000)
    return () => window.clearTimeout(id)
  }, [count])
  return { count, start: () => setCount(3) }
}

function PushupPart({ onDone }: { onDone: (v: number | undefined) => void }) {
  const [n, setN] = useState(0)
  const tap = () => {
    unlockAudio()
    vibrate(15)
    setN((x) => {
      const next = x + 1
      void speech.speak(String(next), { priority: 'count', interrupt: true })
      return next
    })
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={tap}
        className="grid h-40 w-40 place-items-center rounded-full border-4 border-ember/40 bg-ember/10 text-ember active:scale-95"
        aria-label="Count one push-up"
      >
        <span className="flex flex-col items-center">
          <span className="font-display text-6xl font-bold tabular">{n}</span>
          <span className="flex items-center gap-1 text-sm font-medium">
            <Hand size={14} /> tap each rep
          </span>
        </span>
      </button>
      <Stepper value={n} onChange={setN} min={0} max={150} label="push-ups" />
      <div className="flex w-full gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => onDone(undefined)} icon={<SkipForward size={18} />}>
          Skip
        </Button>
        <Button className="flex-[2]" onClick={() => onDone(n)}>
          Save {n} push-ups
        </Button>
      </div>
    </div>
  )
}

function SquatPart({ onDone }: { onDone: (v: number | undefined) => void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [n, setN] = useState(0)
  const now = useNow(startedAt !== null && !finished)
  const elapsed = startedAt === null ? 0 : Math.min(60, (now - startedAt) / 1000)
  const left = Math.ceil(60 - elapsed)
  const said = useRef(new Set<number>())
  const cd = useCountdown(() => setStartedAt(performance.now()))

  useEffect(() => {
    if (startedAt === null || finished) return
    for (const mark of [30, 10]) {
      if (left === mark && !said.current.has(mark)) {
        said.current.add(mark)
        void speech.speak(`${mark} seconds left`, { priority: 'cue' })
      }
    }
    if (left <= 3 && left > 0 && !said.current.has(-left)) {
      said.current.add(-left)
      tick()
    }
    if (elapsed >= 60) {
      setFinished(true)
      chime()
      vibrate([60, 40, 60])
      void speech.speak('Stop! Nice work.', { priority: 'cue', interrupt: true })
    }
  }, [left, elapsed, startedAt, finished])

  const running = startedAt !== null && !finished
  return (
    <div className="flex flex-col items-center gap-4">
      {cd.count !== null ? (
        <div className="grid h-40 w-40 place-items-center rounded-full bg-surface-2 font-display text-7xl font-bold text-ember">{cd.count}</div>
      ) : running ? (
        <button
          type="button"
          onClick={() => {
            vibrate(12)
            setN((x) => x + 1)
          }}
          className="relative grid h-44 w-44 place-items-center rounded-full border-4 border-ember/40 bg-ember/10 text-ember active:scale-95"
          aria-label="Count one squat"
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="4" />
            <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${(elapsed / 60) * 295.3} 295.3`} strokeLinecap="round" />
          </svg>
          <span className="flex flex-col items-center">
            <span className="font-display text-6xl font-bold tabular">{n}</span>
            <span className="text-sm font-medium tabular">{left}s left</span>
          </span>
        </button>
      ) : finished ? (
        <>
          <div className="text-center text-muted">How many squats did you do?</div>
          <Stepper value={n} onChange={setN} min={0} max={120} label="squats" size="lg" />
        </>
      ) : (
        <Button
          size="lg"
          icon={<Play size={20} />}
          onClick={() => {
            unlockAudio()
            speech.unlock()
            cd.start()
          }}
        >
          Start the 60-second timer
        </Button>
      )}
      <div className="flex w-full gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => onDone(undefined)} icon={<SkipForward size={18} />}>
          Skip
        </Button>
        {finished ? (
          <Button className="flex-[2]" onClick={() => onDone(n)}>
            Save {n} squats
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function PlankPart({ onDone }: { onDone: (v: number | undefined) => void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [stoppedSec, setStoppedSec] = useState<number | null>(null)
  const now = useNow(startedAt !== null && stoppedSec === null)
  const sec = startedAt === null ? 0 : Math.floor((now - startedAt) / 1000)
  const said = useRef(new Set<number>())
  const cd = useCountdown(() => setStartedAt(performance.now()))

  useEffect(() => {
    if (startedAt === null || stoppedSec !== null) return
    if (sec > 0 && sec % 15 === 0 && !said.current.has(sec)) {
      said.current.add(sec)
      void speech.speak(`${sec} seconds`, { priority: 'count' })
    }
  }, [sec, startedAt, stoppedSec])

  const running = startedAt !== null && stoppedSec === null
  return (
    <div className="flex flex-col items-center gap-4">
      {cd.count !== null ? (
        <div className="grid h-40 w-40 place-items-center rounded-full bg-surface-2 font-display text-7xl font-bold text-ember">{cd.count}</div>
      ) : running ? (
        <button
          type="button"
          onClick={() => {
            setStoppedSec(sec)
            chime()
            void speech.speak(`${sec} seconds. Well done.`, { priority: 'cue', interrupt: true })
          }}
          className="grid h-44 w-44 place-items-center rounded-full border-4 border-teal/40 bg-teal/10 text-teal active:scale-95"
          aria-label="Stop the plank timer"
        >
          <span className="flex flex-col items-center">
            <span className="font-display text-6xl font-bold tabular">{sec}</span>
            <span className="flex items-center gap-1 text-sm font-medium">
              <Pause size={14} /> tap to stop
            </span>
          </span>
        </button>
      ) : stoppedSec !== null ? (
        <>
          <div className="text-center text-muted">Your plank time</div>
          <Stepper value={stoppedSec} onChange={setStoppedSec} min={0} max={600} step={1} unit="s" label="plank seconds" size="lg" />
        </>
      ) : (
        <Button
          size="lg"
          icon={<Timer size={20} />}
          onClick={() => {
            unlockAudio()
            speech.unlock()
            cd.start()
          }}
        >
          Start the stopwatch
        </Button>
      )}
      <div className="flex w-full gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => onDone(undefined)} icon={<SkipForward size={18} />}>
          Skip
        </Button>
        {stoppedSec !== null ? (
          <Button className="flex-[2]" onClick={() => onDone(stoppedSec)}>
            Save {stoppedSec} seconds
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/** The 3-minute fitness test: push-ups, 60-second squats, plank. Any part can be skipped. */
export function FitnessTest({ onDone }: { onDone: (r: TestResult) => void }) {
  const [i, setI] = useState(0)
  const [result, setResult] = useState<TestResult>({ date: todayISO() })
  const palette = usePalette()
  const part = PARTS[i]
  const ex = getExercise(part.exercise)!
  const hl = highlightFor(ex)

  const finish = (value: number | undefined) => {
    const key = part.id === 'pushups' ? 'pushups' : part.id === 'squats' ? 'squats60' : 'plankSec'
    const next = { ...result, [key]: value }
    setResult(next)
    if (i < PARTS.length - 1) setI(i + 1)
    else onDone(next)
  }

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-ember">
        Test {i + 1} of {PARTS.length}
      </div>
      <h2 className="font-display text-2xl font-bold">{part.title}</h2>
      <Card className="mt-3 overflow-hidden p-0">
        <Mannequin motion={motionFor(ex)} palette={palette} pulse={hl.primary} className="h-[min(24vh,220px)] w-full bg-bg" title={ex.name} />
      </Card>
      <p className="mt-3 text-[15px] leading-relaxed text-muted [@media(max-height:700px)]:text-sm">{part.how}</p>
      <div className="mt-4" key={part.id}>
        {part.id === 'pushups' ? <PushupPart onDone={finish} /> : part.id === 'squats' ? <SquatPart onDone={finish} /> : <PlankPart onDone={finish} />}
      </div>
    </div>
  )
}
