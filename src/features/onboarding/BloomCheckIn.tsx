import { useEffect, useState } from 'react'
import { Check, Timer } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, motionFor } from '@/data/exercises'
import type { FitnessTest as TestResult } from '@/engines/plan/types'
import { todayISO } from '@/lib/dates'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Chip } from '@/ui/Chip'
import { chime, unlockAudio } from '@/voice/beeps'
import { FOLD_REACH } from './choices'

const BALANCE_CHIPS = [5, 10, 15, 20, 30, 45, 60]

function Demo({ id }: { id: string }) {
  const palette = usePalette()
  const ex = getExercise(id)
  if (!ex) return null
  return (
    <div className="w-28 shrink-0 overflow-hidden rounded-2xl border border-line/70 bg-bg/50">
      <Mannequin motion={motionFor(ex)} palette={palette} speed={0.7} className="aspect-[4/3] w-full" title={`${ex.name} demonstration`} />
    </div>
  )
}

/**
 * Bloom's gentle check-in (instead of Forge's push-up test): where a soft-kneed forward fold
 * reaches, and how long she stays steady on one foot. Both are optional.
 */
export function BloomCheckIn({ onDone }: { onDone: (r: TestResult) => void }) {
  const [fold, setFold] = useState<number>()
  const [balance, setBalance] = useState<number>()
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [startedAt])

  const elapsed = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-display text-3xl font-bold">Gentle check-in</h1>
        <p className="mt-1 text-muted">Two quick moments of noticing. No warm-up needed, and there’s no wrong answer.</p>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Forward fold</div>
            <p className="mt-0.5 text-sm text-muted">Stand tall, bend your knees softly and fold forward slowly. Where do your fingertips reach without straining?</p>
          </div>
          <Demo id="standing-forward-fold" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FOLD_REACH.map((label, k) => (
            <Chip key={label} active={fold === k} onClick={() => setFold(fold === k ? undefined : k)}>
              {label}
            </Chip>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Balance on one foot</div>
            <p className="mt-0.5 text-sm text-muted">Stand near a wall, lift one foot to your ankle or calf, and find a still point ahead. Time how long you stay steady.</p>
          </div>
          <Demo id="tree-pose-kickstand" />
        </div>
        {startedAt === null ? (
          <Button
            variant="secondary"
            className="mt-3"
            icon={<Timer size={18} />}
            onClick={() => {
              unlockAudio()
              setNow(Date.now())
              setStartedAt(Date.now())
            }}
          >
            {balance !== undefined ? 'Time it again' : 'Start the timer'}
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => {
              chime()
              setBalance(Math.max(1, elapsed))
              setStartedAt(null)
            }}
            className="pressable mt-3 grid h-28 w-full place-items-center rounded-2xl border border-ember/40 bg-ember/10"
            aria-label={`Stop the timer at ${elapsed} seconds`}
          >
            <span className="font-display text-5xl font-bold tabular text-ember">{elapsed}s</span>
            <span className="text-sm text-muted">Tap when you wobble or put your foot down</span>
          </button>
        )}
        <div className="mt-3 text-xs text-faint">Or pick roughly:</div>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {BALANCE_CHIPS.map((sec) => (
            <Chip key={sec} active={balance === sec} onClick={() => setBalance(balance === sec ? undefined : sec)}>
              {sec === 60 ? '60 s or more' : `${sec} s`}
            </Chip>
          ))}
          {balance !== undefined && !BALANCE_CHIPS.includes(balance) ? (
            <Chip active onClick={() => setBalance(undefined)}>
              {balance} s
            </Chip>
          ) : null}
        </div>
      </Card>

      <Button block size="lg" icon={<Check size={20} />} disabled={fold === undefined && balance === undefined} onClick={() => onDone({ date: todayISO(), foldReach: fold, balanceSec: balance })}>
        Save check-in
      </Button>
    </div>
  )
}
