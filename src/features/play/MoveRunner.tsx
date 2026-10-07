import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, highlightFor, motionFor } from '@/data/exercises'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { repSeconds } from '@/engines/plan'
import type { PlayMove } from '@/engines/play'
import { Button } from '@/ui/Button'
import { cx } from '@/ui/cx'
import { chime, go, tick } from '@/voice/beeps'
import { useCaption } from '@/voice/captions'
import { useVoiceSettings } from '@/voice/settings'
import { speech } from '@/voice/speech'
import { coachLine } from '@/voice/coachLines'

const say = (t: string, interrupt = false) => void speech.speak(t, { priority: 'cue', interrupt })

/** Big 3-2-1 countdown that zooms in. Calls onGo after 3 seconds. */
export function LeadIn({ onGo, label }: { onGo: () => void; label?: string }) {
  const [n, setN] = useState(3)
  const done = useRef(onGo)
  done.current = onGo
  useEffect(() => {
    tick()
    haptic('light')
    const id = window.setInterval(() => {
      setN((x) => {
        const next = x - 1
        if (next > 0) {
          tick()
          haptic('light')
        } else if (next === 0) {
          go()
          sfx.thump()
          haptic('medium')
        } else {
          window.clearInterval(id)
          window.setTimeout(() => done.current(), 0)
        }
        return next
      })
    }, 800)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="grid place-items-center text-center" aria-live="assertive">
      {label ? <div className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-muted">{label}</div> : null}
      <div key={n} className={cx('font-display font-black tabular animate-zoom-out', n > 0 ? 'text-[120px] leading-none text-ink' : 'text-[88px] leading-none text-gradient')}>
        {n > 0 ? n : 'GO!'}
      </div>
    </div>
  )
}

/**
 * Do one move: 3-2-1, then a timer (holds) or rep counting in tempo (reps; self-paced when rep
 * counting is off). Reports what was done.
 */
export function MoveRunner({ move, title, onDone, onCancel }: { move: PlayMove; title?: string; onDone: (value: number) => void; onCancel: () => void }) {
  const ex = getExercise(move.exerciseId)!
  const palette = usePalette()
  const countReps = useVoiceSettings((s) => s.countReps)
  const caption = useCaption((s) => s.text)
  const [stage, setStage] = useState<'lead' | 'go' | 'done'>('lead')
  const [t, setT] = useState(0)
  const startedAt = useRef(0)
  const flags = useRef(new Set<string>())
  const perSide = !!ex.perSide && move.measure === 'reps'
  const totalReps = perSide ? move.amount * 2 : move.amount
  const per = repSeconds(ex.id)
  const count = move.measure === 'reps' && countReps ? Math.min(totalReps, Math.floor(t / per)) : null
  const lastCount = useRef(0)

  useEffect(() => {
    say(`${move.measure === 'time' ? `${move.amount} seconds` : `${move.amount}${perSide ? ' each side' : ''}`}: ${ex.name}.`, true)
    return () => speech.cancel()
  }, [ex.name, move.amount, move.measure, perSide])

  const finish = (value: number) => {
    if (stage === 'done') return
    setStage('done')
    chime()
    sfx.success()
    haptic('success')
    say(coachLine('setDone'), true)
    window.setTimeout(() => onDone(value), 700)
  }

  useEffect(() => {
    if (stage !== 'go') return
    startedAt.current = performance.now()
    const id = window.setInterval(() => {
      const now = (performance.now() - startedAt.current) / 1000
      setT(now)
      const once = (k: string) => (flags.current.has(k) ? false : (flags.current.add(k), true))
      if (move.measure === 'time') {
        const left = move.amount - now
        if (move.amount >= 20 && now >= move.amount / 2 && once('half')) say(coachLine('half'))
        for (const n of [3, 2, 1]) if (left <= n && left > n - 1 && once(`b${n}`)) tick()
        if (left <= 0) {
          window.clearInterval(id)
          finish(move.amount)
        }
      } else if (countReps) {
        const done = Math.min(totalReps, Math.floor(now / per))
        if (done > lastCount.current) {
          lastCount.current = done
          haptic('light')
          if (done >= totalReps) {
            say(String(perSide ? move.amount : done), true)
            window.clearInterval(id)
            finish(move.amount)
          } else {
            const shown = perSide && done > move.amount ? done - move.amount : done
            say(String(shown))
            if (perSide && done === move.amount) say('Switch sides!')
            else if (totalReps >= 6 && done === totalReps - 1) say(coachLine('oneMore'))
          }
        }
      }
    }, 100)
    return () => window.clearInterval(id)
    // finish is stable enough for this one-shot timer; re-running would restart the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage])

  const hl = highlightFor(ex)
  const timeLeft = Math.max(0, move.amount - t)
  const progress = move.measure === 'time' ? t / move.amount : count !== null ? count / totalReps : 0
  const C = 2 * Math.PI * 46

  return createPortal(
    <div className="fixed inset-0 z-[65] flex flex-col overflow-y-auto overscroll-contain bg-bg animate-fade-in" role="dialog" aria-modal="true" aria-label={ex.name}>
      <div className="flex items-center gap-2 px-4" style={{ paddingTop: 'calc(var(--safe-top) + 8px)' }}>
        <button type="button" aria-label="Stop" onClick={onCancel} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
          <X size={22} />
        </button>
        <div className="min-w-0 flex-1 truncate text-center text-sm font-semibold">{title ?? 'Go!'}</div>
        <span className="w-10" />
      </div>
      <div className="mx-4 mt-2 min-h-0 flex-1 overflow-hidden rounded-3xl border border-line bg-surface">
        <Mannequin motion={motionFor(ex)} palette={palette} pulse={hl.primary} clock={stage === 'go' && move.measure === 'reps' && countReps ? () => (performance.now() - startedAt.current) / 1000 : undefined} className="h-full w-full" title={`${ex.name} demonstration`} />
      </div>
      <div className="px-4 pt-3 text-center">
        <h1 className="font-display text-2xl font-bold">{ex.name}</h1>
        <div className="text-muted">{move.measure === 'time' ? `${move.amount} seconds` : `${move.amount} reps${perSide ? ' each side' : ''}`}</div>
      </div>
      <div className="grid h-[min(220px,32vh)] shrink-0 place-items-center">
        {stage === 'lead' ? (
          <LeadIn onGo={() => setStage('go')} />
        ) : (
          <div className="relative grid h-[min(176px,27vh)] w-[min(176px,27vh)] place-items-center text-ember">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="6" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${Math.min(1, progress) * C} ${C}`} />
            </svg>
            <div className="text-center">
              {stage === 'done' ? (
                <Check size={64} strokeWidth={3} className="animate-bounce-in text-good" />
              ) : move.measure === 'time' ? (
                <div className="font-display text-6xl font-bold tabular text-ink">{Math.ceil(timeLeft)}</div>
              ) : count !== null ? (
                <div key={count} className="font-display text-6xl font-bold tabular text-ink animate-count-pop">
                  {perSide && count > move.amount ? count - move.amount : count}
                </div>
              ) : (
                <div className="font-display text-6xl font-bold tabular text-ink">{move.amount}</div>
              )}
              <div className="text-xs font-medium uppercase tracking-wider text-muted">{move.measure === 'time' ? 'seconds' : count !== null ? 'reps' : 'your pace'}</div>
            </div>
          </div>
        )}
      </div>
      <div className="min-h-[2.5rem] px-6 text-center text-sm text-muted" aria-live="polite">
        {caption}
      </div>
      <div className="px-4 pt-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <Button block size="lg" icon={<Check size={20} />} disabled={stage !== 'go'} onClick={() => finish(move.measure === 'time' ? Math.round(Math.min(t, move.amount)) : move.amount)}>
          Done
        </Button>
      </div>
    </div>,
    document.body,
  )
}
