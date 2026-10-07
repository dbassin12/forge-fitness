import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Lightbulb, Play, Square, Trophy } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { useCelebrate } from '@/app/celebrate'
import { burst } from '@/app/confetti'
import { usePalette } from '@/app/theme'
import { highlightFor, motionFor } from '@/data/exercises'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { planContext } from '@/engines/plan'
import { CHALLENGES, challengeXp, type ChallengeDef } from '@/engines/play'
import { todayISO } from '@/lib/dates'
import { usePlan } from '@/state/plan'
import { logPlay, saveChallenge, useChallengeRecords } from '@/state/play'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Stepper } from '@/ui/Stepper'
import { chime, tick, unlockAudio } from '@/voice/beeps'
import { coachLine } from '@/voice/coachLines'
import { speech } from '@/voice/speech'
import { formatValue } from './format'
import { LeadIn } from './MoveRunner'

const say = (t: string, interrupt = false) => void speech.speak(t, { priority: 'cue', interrupt })

type Stage = 'intro' | 'lead' | 'go' | 'result'

export default function ChallengePage() {
  const { id = '' } = useParams()
  const def = CHALLENGES.find((c) => c.id === id)
  const plan = usePlan()
  const records = useChallengeRecords()
  const navigate = useNavigate()
  const palette = usePalette()
  const ex = useMemo(() => (plan && def ? def.exercise(plan.progress, planContext(plan.inputs)) : undefined), [plan, def])
  const [stage, setStage] = useState<Stage>('intro')
  const [t, setT] = useState(0)
  const [taps, setTaps] = useState(0)
  const [value, setValue] = useState(0)
  const [saved, setSaved] = useState<{ isBest: boolean; xp: number } | null>(null)
  const startedAt = useRef(0)
  const gameStart = useRef(Date.now())
  const flags = useRef(new Set<string>())

  const best = ex && records ? records[def!.id]?.best[ex.id] : undefined
  const history = ex && records ? (records[def!.id]?.history ?? []).filter((h) => h.exerciseId === ex.id).slice(-6) : []

  useEffect(() => {
    if (stage !== 'go' || !def) return
    startedAt.current = performance.now()
    const id = window.setInterval(() => {
      const now = (performance.now() - startedAt.current) / 1000
      setT(now)
      const once = (k: string) => (flags.current.has(k) ? false : (flags.current.add(k), true))
      if (def.kind === 'hold') {
        const s = Math.floor(now)
        if (s > 0 && s % 15 === 0 && once(`q${s}`)) say(s % 60 === 0 ? `${s / 60} minute${s === 60 ? '' : 's'}!` : `${s} seconds`)
        if (best && now > best && once('record')) {
          sfx.levelUp()
          haptic('celebrate')
          say(coachLine('record'), true)
        }
      } else {
        const left = (def.seconds ?? 60) - now
        if (left <= 30 && left > 29 && once('30')) say('Thirty seconds!')
        if (left <= 10 && left > 9 && once('10')) say(coachLine('tenLeft'))
        for (const n of [3, 2, 1]) if (left <= n && left > n - 1 && once(`b${n}`)) tick()
        if (left <= 0) {
          window.clearInterval(id)
          chime()
          haptic('success')
          say('Time!', true)
          setStage('result')
        }
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [stage, def, best])

  useEffect(() => () => speech.cancel(), [])

  if (!def) {
    return (
      <>
        <PageHeader title="Not found" back="/play" />
        <p className="px-4 text-muted">That challenge doesn’t exist.</p>
      </>
    )
  }
  if (!plan) return <div className="grid h-dvh place-items-center text-muted animate-pulse-soft">Loading…</div>
  if (!ex) {
    return (
      <>
        <PageHeader title={def.name} back="/play" />
        <p className="px-4 text-muted">This one doesn’t fit your equipment or aches right now. Try another challenge.</p>
      </>
    )
  }

  const begin = () => {
    unlockAudio()
    speech.unlock()
    flags.current.clear()
    setTaps(0)
    setT(0)
    setSaved(null)
    gameStart.current = Date.now()
    setStage('lead')
  }

  const stopHold = () => {
    const v = Math.round(t)
    setValue(v)
    chime()
    haptic('success')
    setStage('result')
  }

  const tap = () => {
    setTaps((n) => n + 1)
    sfx.pop()
    haptic('light')
  }

  const save = async () => {
    const v = def.kind === 'hold' ? value : value || taps
    const { isBest } = await saveChallenge(def.id, { date: todayISO(), value: v, exerciseId: ex.id })
    const xp = challengeXp(def, v, isBest)
    await logPlay({
      key: `challenge:${def.id}`,
      title: def.name,
      startedAt: gameStart.current,
      profile: plan.profile,
      exercises: [{ exerciseId: ex.id, sets: [def.kind === 'hold' ? { seconds: v } : { reps: v }] }],
      xp,
    })
    setSaved({ isBest, xp })
    if (isBest && v > 0) {
      burst('big')
      useCelebrate.getState().push({ kind: 'pb', emoji: def.emoji, title: `${def.name}: ${formatValue(def.kind, v)}`, text: best ? `Your old best was ${formatValue(def.kind, best)}.` : 'Your first record. Now go beat it!' })
    } else {
      sfx.success()
      burst('small')
    }
  }

  // ---- Intro ----
  if (stage === 'intro') {
    return (
      <div className="flex min-h-dvh flex-col">
        <PageHeader title={def.name} subtitle={def.kind === 'hold' ? 'Hold for time' : `Max reps in ${def.seconds} seconds`} back="/play" />
        <div className="flex flex-1 flex-col px-4">
          <div className="overflow-hidden rounded-3xl border border-line bg-surface">
            <Mannequin motion={motionFor(ex)} palette={palette} pulse={highlightFor(ex).primary} className="aspect-[4/3] w-full" title={`${ex.name} demonstration`} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-3xl">{def.emoji}</span>
            <div>
              <div className="font-semibold">{ex.name}</div>
              <p className="text-sm text-muted">{def.blurb}</p>
            </div>
          </div>
          <Card className="mt-3 flex items-center gap-3">
            <Trophy size={22} className={best ? 'text-amber' : 'text-faint'} />
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted">Your best</div>
              <div className="font-display text-2xl font-bold tabular">{best ? formatValue(def.kind, best) : '—'}</div>
            </div>
            {history.length > 1 ? (
              <div className="flex h-10 items-end gap-1" aria-label="Recent results">
                {history.map((h, k) => (
                  <span key={k} className="w-2 rounded-t bg-ember/70" style={{ height: `${Math.max(12, (h.value / Math.max(...history.map((x) => x.value), 1)) * 100)}%` }} />
                ))}
              </div>
            ) : null}
          </Card>
          <div className="mt-3 flex gap-2 rounded-2xl bg-surface-2 p-3 text-sm text-muted">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-amber" />
            <span>{def.tip}</span>
          </div>
          <div className="mt-auto pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
            <Button block size="lg" icon={<Play size={20} fill="currentColor" />} onClick={begin}>
              {best ? 'Beat my record' : 'Start'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---- 3-2-1 ----
  if (stage === 'lead') {
    return (
      <div className="grid h-dvh place-items-center safe-top">
        <LeadIn label={def.name} onGo={() => setStage('go')} />
      </div>
    )
  }

  // ---- Running ----
  if (stage === 'go') {
    return <Running def={def} t={t} taps={taps} best={best} onTap={tap} onStop={stopHold} exName={ex.name} />
  }

  // ---- Result ----
  const v = def.kind === 'hold' ? value : value || taps
  const beat = best === undefined ? v > 0 : v > best
  return (
    <div className="flex min-h-dvh flex-col px-4 safe-top">
      <div className="mt-10 text-center">
        <div className="text-6xl animate-bounce-in">{beat ? '🏆' : def.emoji}</div>
        <h1 className="mt-3 font-display text-3xl font-bold">{beat ? (best === undefined ? 'First record set!' : 'New record!') : 'Nice effort!'}</h1>
        <div className="mt-2 font-display text-6xl font-black tabular text-gradient">{formatValue(def.kind, v)}</div>
        {best !== undefined ? <p className="mt-1 text-muted">Best before: {formatValue(def.kind, best)}</p> : null}
      </div>
      {def.kind === 'amrap' && !saved ? (
        <Card className="mt-6 flex items-center justify-between gap-3">
          <div>
            <div className="font-medium">Reps counted</div>
            <div className="text-xs text-muted">Fix it if you missed some taps</div>
          </div>
          <Stepper value={v} onChange={setValue} min={0} max={300} step={1} unit="reps" label="Reps" />
        </Card>
      ) : null}
      {saved ? <div className="mt-6 text-center text-lg font-semibold text-violet animate-pop">+{saved.xp} XP</div> : null}
      <div className="mt-auto grid gap-2 pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        {saved ? (
          <>
            <Button block size="lg" onClick={() => navigate('/play', { replace: true })}>
              Done
            </Button>
            <Button block variant="ghost" onClick={() => setStage('intro')}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <Button block size="lg" onClick={() => void save()}>
              Save result
            </Button>
            <Button block variant="ghost" onClick={() => setStage('intro')}>
              Discard
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function Running({ def, t, taps, best, onTap, onStop, exName }: { def: ChallengeDef; t: number; taps: number; best?: number; onTap: () => void; onStop: () => void; exName: string }) {
  const C = 2 * Math.PI * 46
  if (def.kind === 'hold') {
    const goal = best ?? 60
    const beat = best !== undefined && t > best
    const progress = Math.min(1, t / Math.max(1, goal))
    return (
      <div className={cx('flex h-dvh flex-col items-center px-4 safe-top transition-colors duration-500', beat && 'bg-amber/10')}>
        <div className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-muted">{exName}</div>
        <div className={cx('relative mt-8 grid h-64 w-64 place-items-center', beat ? 'text-amber' : 'text-ember')}>
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="5" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${progress * C} ${C}`} />
          </svg>
          <div className="text-center">
            <div className="font-display text-7xl font-black tabular text-ink">{formatValue('hold', t)}</div>
            <div className="mt-1 text-sm text-muted">{beat ? '🏆 New record — keep going!' : best ? `Best: ${formatValue('hold', best)}` : 'Hold it!'}</div>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted">Tap Stop the moment your form breaks.</p>
        <div className="mt-auto w-full pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          <Button block size="lg" variant="danger" className="h-20 text-xl" icon={<Square size={22} fill="currentColor" />} onClick={onStop}>
            Stop
          </Button>
        </div>
      </div>
    )
  }
  const total = def.seconds ?? 60
  const left = Math.max(0, total - t)
  return (
    <div className="flex h-dvh flex-col px-4 safe-top">
      <div className="flex items-center justify-between pt-3">
        <div className="text-sm font-semibold">{exName}</div>
        <div className={cx('font-display text-3xl font-black tabular', left <= 10 ? 'text-bad' : 'text-ink')}>{Math.ceil(left)}s</div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-ember" style={{ width: `${(left / total) * 100}%` }} />
      </div>
      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault()
          onTap()
        }}
        aria-label={`Count a rep. ${taps} so far`}
        className="no-callout relative mt-4 mb-4 flex flex-1 touch-manipulation flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-dashed border-ember/50 bg-ember/5 active:bg-ember/15"
        style={{ marginBottom: 'calc(var(--safe-bottom) + 16px)' }}
      >
        <span key={taps} className="pointer-events-none absolute h-48 w-48 rounded-full bg-ember/30 animate-burst" aria-hidden />
        <span key={`n${taps}`} className="font-display text-[120px] font-black leading-none tabular animate-count-pop">
          {taps}
        </span>
        <span className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-muted">Tap each rep</span>
        {best ? <span className="mt-1 text-xs text-faint">Best: {best}</span> : null}
      </button>
    </div>
  )
}
