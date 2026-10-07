import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Flame, Play, RotateCw, X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { useCelebrate } from '@/app/celebrate'
import { reducedMotion } from '@/app/prefs'
import { usePalette } from '@/app/theme'
import { getExercise, motionFor } from '@/data/exercises'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { planContext } from '@/engines/plan'
import { wheelSlices, wheelXp, type WheelSlice } from '@/engines/play'
import { todayISO } from '@/lib/dates'
import { usePlan } from '@/state/plan'
import { logPlay } from '@/state/play'
import { Button } from '@/ui/Button'
import { unlockAudio } from '@/voice/beeps'
import { speech } from '@/voice/speech'
import { MoveRunner } from './MoveRunner'
import { Wheel, WheelPointer } from './Wheel'

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4)

export default function WheelPage() {
  const plan = usePlan()
  const navigate = useNavigate()
  const palette = usePalette()
  const slices = useMemo(() => (plan ? wheelSlices(plan.progress, planContext(plan.inputs), todayISO()) : []), [plan])
  const wheelRef = useRef<SVGGElement | null>(null)
  const angle = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<WheelSlice | null>(null)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState<{ slice: WheelSlice; value: number }[]>([])
  const [saving, setSaving] = useState(false)
  const startedAt = useRef(Date.now())

  if (!plan || !slices.length) return <div className="grid h-dvh place-items-center text-muted animate-pulse-soft">Loading…</div>
  const n = slices.length
  const seg = 360 / n
  const nextXp = wheelXp(done.length + 1) - wheelXp(done.length)

  const spin = () => {
    if (spinning) return
    unlockAudio()
    speech.unlock()
    setResult(null)
    setSpinning(true)
    sfx.whoosh()
    haptic('medium')
    const pick = Math.floor(Math.random() * n)
    const center = pick * seg + seg / 2
    const jitter = (Math.random() - 0.5) * seg * 0.6
    const from = angle.current
    const base = from - (from % 360)
    let to = base + 360 * 5 + ((360 - center + jitter) % 360)
    if (to - from < 360 * 4) to += 360
    const land = () => {
      angle.current = to
      setSpinning(false)
      const s = slices[pick]
      setResult(s)
      sfx.pop()
      haptic('success')
      void speech.speak(`${s.label}!`, { priority: 'cue', interrupt: true })
    }
    if (reducedMotion()) {
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${to}deg)`
      land()
      return
    }
    const dur = 4200
    const t0 = performance.now()
    let lastSlot = Math.floor(from / seg)
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / dur)
      const a = from + (to - from) * easeOut(t)
      if (wheelRef.current) wheelRef.current.style.transform = `rotate(${a}deg)`
      const slot = Math.floor(a / seg)
      if (slot !== lastSlot) {
        lastSlot = slot
        sfx.click()
      }
      if (t < 1) requestAnimationFrame(frame)
      else land()
    }
    requestAnimationFrame(frame)
  }

  const finish = async () => {
    if (!done.length) {
      navigate('/play')
      return
    }
    setSaving(true)
    const byEx = new Map<string, { exerciseId: string; sets: { reps?: number; seconds?: number }[] }>()
    for (const d of done) {
      const e = byEx.get(d.slice.exerciseId) ?? { exerciseId: d.slice.exerciseId, sets: [] }
      e.sets.push(d.slice.measure === 'time' ? { seconds: d.value } : { reps: d.value })
      byEx.set(d.slice.exerciseId, e)
    }
    const xp = wheelXp(done.length)
    await logPlay({ key: 'wheel', title: 'Spin the wheel', startedAt: startedAt.current, profile: plan.profile, exercises: [...byEx.values()], xp })
    useCelebrate.getState().toast({ tone: 'info', title: 'Wheel session saved', text: `${done.length} spin${done.length === 1 ? '' : 's'} done`, xp, emoji: '🎡' })
    navigate('/play', { replace: true })
  }

  const ex = result ? getExercise(result.exerciseId) : undefined

  return (
    <div className="flex min-h-dvh flex-col px-4 safe-top">
      <div className="flex items-center gap-2 pt-2">
        <button type="button" aria-label="Close" onClick={() => void finish()} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
          <X size={22} />
        </button>
        <h1 className="min-w-0 flex-1 text-center font-display text-lg font-bold">Spin the wheel</h1>
        <span className="flex h-8 items-center gap-1 rounded-full bg-ember/15 px-2.5 text-xs font-bold text-ember" aria-label={`Combo ${done.length}`}>
          <Flame size={13} /> ×{done.length}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="relative z-10 -mb-4">
          <WheelPointer />
        </div>
        <Wheel
          ref={wheelRef}
          labels={slices.map((s) => s.emoji)}
          size={Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 48 : 300)}
          hub={
            <button
              type="button"
              onClick={spin}
              disabled={spinning || running}
              aria-label="Spin"
              className="grid h-20 w-20 place-items-center rounded-full border-4 border-surface bg-ink font-display text-lg font-black text-bg shadow-xl transition active:scale-90 disabled:opacity-80"
            >
              {spinning ? <RotateCw className="animate-spin" /> : 'SPIN'}
            </button>
          }
        />
      </div>

      {result && ex ? (
        <div className="mt-5 animate-rise rounded-3xl border border-ember/40 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="w-28 shrink-0 overflow-hidden rounded-2xl bg-bg">
              <Mannequin motion={motionFor(ex)} palette={palette} className="aspect-[4/3] w-full" title={ex.name} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-3xl">{result.emoji}</div>
              <div className="font-display text-xl font-bold leading-tight">{result.measure === 'time' ? `${result.amount} seconds` : `${result.amount}${ex.perSide ? ' / side' : ''}`}</div>
              <div className="truncate text-muted">{ex.name}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
            <Button variant="secondary" icon={<RotateCw size={16} />} onClick={spin}>
              Re-spin
            </Button>
            <Button icon={<Play size={18} fill="currentColor" />} onClick={() => setRunning(true)}>
              Let’s do it · +{nextXp} XP
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-center text-sm text-muted">
          {spinning ? 'Round and round…' : done.length ? `Nice! Spin again for +${nextXp} XP. The combo grows with every spin.` : 'Tap SPIN. Do whatever it lands on. Every spin in a row is worth more XP.'}
        </p>
      )}

      {done.length ? (
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {done.map((d, i) => (
            <span key={i} className="animate-pop rounded-full bg-surface-2 px-2.5 py-1 text-xs">
              {d.slice.emoji} {d.slice.measure === 'time' ? `${d.value}s` : d.value}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        {done.length ? (
          <Button block size="lg" variant="secondary" disabled={saving || spinning} onClick={() => void finish()}>
            Finish & save · +{wheelXp(done.length)} XP
          </Button>
        ) : (
          <Button block size="lg" disabled={spinning} onClick={spin} icon={<RotateCw size={20} />}>
            Spin
          </Button>
        )}
      </div>

      {running && result ? (
        <MoveRunner
          move={result}
          title={`${result.emoji} Spin ${done.length + 1}`}
          onCancel={() => setRunning(false)}
          onDone={(value) => {
            setDone((d) => [...d, { slice: result, value }])
            setRunning(false)
            setResult(null)
          }}
        />
      ) : null}
    </div>
  )
}
