import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router'
import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { burst } from '@/app/confetti'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { keepAwake, releaseAwake } from '@/device/wakeLock'
import { breathAt, cyclesFor, cycleSec, getBreath, getRelaxation, PHASE_WORD, type BreathPhaseKind } from '@/engines/breath'
import { logBreath } from '@/state/breathe'
import { usePlan } from '@/state/plan'
import { markActivity } from '@/state/quests'
import { Button } from '@/ui/Button'
import { Chip } from '@/ui/Chip'
import { CountUp } from '@/ui/CountUp'
import { cx } from '@/ui/cx'
import { beep, unlockAudio } from '@/voice/beeps'
import { useCaption } from '@/voice/captions'
import { useVoiceSettings } from '@/voice/settings'
import { speech } from '@/voice/speech'

/** Short spoken cues, varied so a long session doesn't sound like a metronome. */
const CUE: Record<BreathPhaseKind, string[]> = {
  in: ['Breathe in', 'And in', 'Breathe in slowly'],
  holdIn: ['Hold', 'Gently hold'],
  out: ['Breathe out', 'And out', 'Slowly let it go'],
  holdOut: ['Hold', 'Rest'],
}

/** Pausable seconds clock. */
function useClock() {
  const r = useRef({ base: 0, since: 0, running: false })
  return useMemo(
    () => ({
      now: () => (r.current.running ? r.current.base + (performance.now() - r.current.since) / 1000 : r.current.base),
      start: () => {
        r.current = { base: r.current.base, since: performance.now(), running: true }
      },
      pause: () => {
        if (!r.current.running) return
        r.current = { base: r.current.base + (performance.now() - r.current.since) / 1000, since: 0, running: false }
      },
      running: () => r.current.running,
    }),
    [],
  )
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** A full-screen breathing or relaxation session. */
export default function BreathSession() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const plan = usePlan()
  const pattern = getBreath(id)
  const relax = getRelaxation(id)
  const [minutes, setMinutes] = useState(() => {
    const m = Number(params.get('min'))
    return pattern ? (pattern.minutes.includes(m) ? m : pattern.defaultMinutes) : (relax?.minutes ?? 3)
  })
  const [stage, setStage] = useState<'setup' | 'run' | 'done'>('setup')
  const [paused, setPaused] = useState(false)
  const [result, setResult] = useState<{ minutes: number; xp: number } | null>(null)
  const [, force] = useReducer((x: number) => x + 1, 0)
  const clock = useClock()
  const startedAt = useRef(0)
  const lastKey = useRef('')
  const spoken = useRef(new Set<number>())
  const voiceOn = useVoiceSettings((s) => s.enabled)
  const updateVoice = useVoiceSettings((s) => s.update)
  const caption = useCaption((s) => s.text)

  const cycles = pattern ? cyclesFor(pattern, minutes) : 0
  // The spoken intro gets a few quiet seconds before the first breath.
  const introSec = pattern ? Math.min(9, 1.5 + pattern.intro.split(' ').length * 0.34) : 0
  const total = pattern ? introSec + cycles * cycleSec(pattern) : (relax?.minutes ?? 0) * 60 + 8

  useEffect(
    () => () => {
      speech.cancel()
      void releaseAwake()
    },
    [],
  )

  const finish = async () => {
    clock.pause()
    speech.cancel()
    void releaseAwake()
    setStage('done')
    if (!plan) return
    const r = await logBreath({ id, title: pattern?.name ?? relax?.name ?? 'Breathing', startedAt: startedAt.current, profile: plan.profile })
    void markActivity('breathe')
    setResult(r)
    sfx.success()
    burst('small')
  }

  // The heartbeat: move the orb, speak cues and lines, finish at the end.
  useEffect(() => {
    if (stage !== 'run' || paused) return
    const tick = window.setInterval(() => {
      const t = clock.now()
      if (pattern) {
        if (t < introSec) {
          force()
          return
        }
        const m = breathAt(pattern, cycles, t - introSec)
        if (m.done) {
          void finish()
          return
        }
        const key = `${m.cycle}:${m.phaseIndex}`
        if (key !== lastKey.current) {
          lastKey.current = key
          haptic('light')
          if (m.phase.kind === 'in') beep(523, 180, 0.06)
          else if (m.phase.kind === 'out') beep(392, 220, 0.06)
          // Full cues for the first few breaths, then only the start of each breath in.
          if (m.cycle < 3 || m.phase.kind === 'in') {
            const list = CUE[m.phase.kind]
            void speech.speak(list[(m.cycle + m.phaseIndex) % list.length], { priority: 'cue', interrupt: true })
          }
        }
      } else if (relax) {
        relax.lines.forEach((line, i) => {
          if (t >= line.at + 2 && !spoken.current.has(i)) {
            spoken.current.add(i)
            void speech.speak(line.text, { priority: 'narration' })
          }
        })
        if (t >= total) {
          void finish()
          return
        }
      }
      force()
    }, 80)
    return () => window.clearInterval(tick)
    // finish is stable enough for the interval's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, paused, pattern, relax, cycles, total, introSec, clock])

  if (!pattern && !relax) return <Navigate to="/breathe" replace />
  const name = pattern?.name ?? relax!.name
  const emoji = pattern?.emoji ?? relax!.emoji

  const begin = () => {
    unlockAudio()
    speech.unlock()
    void keepAwake()
    startedAt.current = Date.now()
    setStage('run')
    clock.start()
    void speech.speak(pattern ? pattern.intro : `${relax!.name}.`, { priority: 'narration', interrupt: true })
  }

  const togglePause = () => {
    if (paused) {
      clock.start()
      setPaused(false)
    } else {
      clock.pause()
      speech.cancel()
      setPaused(true)
    }
  }

  if (stage === 'setup') {
    return (
      <div className="flex min-h-dvh flex-col px-4 safe-top">
        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => navigate(-1)} className="-ml-2 rounded-full px-2 py-2 text-sm font-medium text-muted hover:text-ink">
            Cancel
          </button>
        </div>
        <div className="mt-8 text-center">
          <div className="text-6xl" aria-hidden>
            {emoji}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold">{name}</h1>
          <p className="mt-1 text-muted">{pattern?.purpose ?? relax!.purpose}</p>
          {pattern ? <p className="mt-1 text-sm font-medium text-teal tabular">{pattern.rhythm}</p> : null}
        </div>
        <p className="mx-auto mt-6 max-w-sm text-center text-[15px] text-muted">{pattern?.intro ?? 'Find somewhere comfortable to sit or lie down. Close your eyes and let the voice guide you.'}</p>
        {pattern ? (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {pattern.minutes.map((m) => (
              <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>
                {m} min
              </Chip>
            ))}
          </div>
        ) : null}
        <div className="mt-auto space-y-2 pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          <button
            type="button"
            onClick={() => updateVoice({ enabled: !voiceOn })}
            className="mx-auto flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted hover:text-ink"
          >
            {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />} Voice guide {voiceOn ? 'on' : 'off'}
          </button>
          <Button block size="lg" icon={<Play size={20} fill="currentColor" />} onClick={begin} className="h-16 text-lg">
            Begin
          </Button>
        </div>
      </div>
    )
  }

  if (stage === 'done') {
    return (
      <div className="flex min-h-dvh flex-col px-4 safe-top">
        <div className="mt-16 text-center">
          <div className="text-6xl animate-bounce-in" aria-hidden>
            🌸
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold animate-fade-up">Lovely</h1>
          <p className="mt-1 text-muted animate-fade-up [animation-delay:100ms]">Notice how you feel right now. That calm is yours to come back to.</p>
        </div>
        {result ? (
          <div className="mx-auto mt-8 grid w-full max-w-xs grid-cols-2 gap-2 animate-rise">
            <div className="rounded-[var(--radius-card)] border border-line/70 bg-surface p-3 text-center">
              <div className="font-display text-3xl font-bold tabular">
                <CountUp value={Math.max(1, Math.round(result.minutes))} duration={900} />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted">Mindful min</div>
            </div>
            <div className="rounded-[var(--radius-card)] border border-line/70 bg-surface p-3 text-center">
              <div className="font-display text-3xl font-bold text-violet tabular">
                +<CountUp value={result.xp} duration={900} />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted">XP</div>
            </div>
          </div>
        ) : null}
        <div className="mt-auto pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          <Button block size="lg" onClick={() => navigate('/breathe', { replace: true })}>
            Done
          </Button>
        </div>
      </div>
    )
  }

  // Running.
  const t = clock.now()
  const settling = !!pattern && t < introSec
  const m = pattern && !settling ? breathAt(pattern, cycles, t - introSec) : null
  const fill = m ? m.fill : settling ? 0.35 : 0.5 + 0.5 * Math.sin((t / 10) * Math.PI * 2 - Math.PI / 2)
  const scale = 0.55 + 0.45 * fill
  const label = m ? PHASE_WORD[m.phase.kind] : settling ? 'Settle in' : 'Breathe softly'
  return (
    <div className="flex h-dvh flex-col overflow-hidden safe-top">
      <div className="flex items-center gap-2 px-4 pt-2">
        <button type="button" aria-label="End session" onClick={() => void finish()} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
          <X size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-semibold">{name}</div>
          <div className="text-xs text-muted tabular">{fmt(total - t)} left</div>
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
      <div className="relative grid flex-1 place-items-center">
        <div className="relative grid h-[min(78vw,46vh)] w-[min(78vw,46vh)] place-items-center" role="img" aria-label={`${label}`}>
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-teal/15 blur-2xl"
            style={{ transform: `scale(${0.75 + 0.35 * fill})`, transition: 'transform 120ms linear' }}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full border border-teal/30 bg-gradient-to-br from-teal/50 via-teal/25 to-ember/20 shadow-[0_0_80px_-20px_var(--color-teal)]"
            style={{ transform: `scale(${scale})`, transition: 'transform 120ms linear' }}
          />
          <span aria-hidden className="absolute inset-[38%] rounded-full bg-surface/50" style={{ transform: `scale(${0.8 + 0.4 * fill})`, transition: 'transform 120ms linear' }} />
          <div className="relative text-center">
            <div className={cx('font-display text-2xl font-bold', paused && 'text-muted')}>{paused ? 'Paused' : label}</div>
            {m ? <div className="mt-1 font-display text-4xl font-bold tabular text-teal">{Math.max(1, Math.ceil(m.phaseLeft))}</div> : null}
          </div>
        </div>
      </div>
      <div className="line-clamp-3 min-h-[4rem] px-8 text-center text-[15px] leading-snug text-muted" aria-live="polite">
        {caption}
      </div>
      <div className="flex justify-center gap-3 px-4 pt-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 18px)' }}>
        <Button variant="secondary" size="lg" className="w-40" onClick={togglePause} icon={paused ? <Play size={20} /> : <Pause size={20} />}>
          {paused ? 'Resume' : 'Pause'}
        </Button>
      </div>
    </div>
  )
}
