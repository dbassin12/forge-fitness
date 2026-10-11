import { useState } from 'react'
import { Ban, Check, RotateCcw } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { APP, W } from '@/app/brand'
import { usePalette } from '@/app/theme'
import { EQUIP_LABEL, getExercise, motionFor } from '@/data/exercises'
import { alternativesFor, type PlanContext, type PlannedItem } from '@/engines/plan'
import { Button } from '@/ui/Button'
import { LevelDots } from '@/ui/Chip'
import { Sheet } from '@/ui/Sheet'
import { cx } from '@/ui/cx'

export interface SwapChoice {
  exerciseId: string | null
  always: boolean
}

/**
 * Pick an alternative for one exercise (just for this workout, or from now on), or leave it out of
 * every workout. `swappable: false` (warm-up and cool-down moves) offers only leaving it out.
 */
export function SwapSheet({
  item,
  ctx,
  open,
  swapped,
  swappable = true,
  onClose,
  onPick,
  onSkip,
}: {
  item: PlannedItem | null
  ctx: PlanContext
  open: boolean
  swapped: boolean
  swappable?: boolean
  onClose: () => void
  onPick: (c: SwapChoice) => void
  /** Leave this exercise out of every workout from now on. */
  onSkip?: (exerciseId: string) => void
}) {
  const palette = usePalette()
  const [sel, setSel] = useState<string | null>(null)
  const cur = item ? getExercise(item.exerciseId) : undefined
  const alts = item && swappable ? alternativesFor(item.exerciseId, ctx, item.ladder) : []
  const close = () => {
    setSel(null)
    onClose()
  }
  const skip = onSkip && cur ? (
    <div className={swappable ? 'mt-4 border-t border-line/60 pt-3' : ''}>
      <Button
        block
        variant={swappable ? 'ghost' : 'primary'}
        size={swappable ? 'md' : 'lg'}
        icon={<Ban size={16} />}
        onClick={() => {
          onSkip(cur.id)
          close()
        }}
      >
        {swappable ? `Never include ${cur.name}` : `Leave ${cur.name} out`}
      </Button>
      <p className="mt-1 text-center text-xs text-muted">
        {APP.name} uses {swappable ? 'the closest alternative' : `a different ${W.exercise}`} instead. Bring it back any time in Settings.
      </p>
    </div>
  ) : null
  if (!swappable) {
    return (
      <Sheet open={open && !!item} onClose={close} title={`Not a fan of this ${W.exercise}?`}>
        {cur ? (
          <p className="-mt-1 mb-4 text-sm text-muted">
            Leave <b className="text-ink">{cur.name}</b> out of your {W.workouts}, warm-ups and cool-downs.
          </p>
        ) : null}
        {skip}
      </Sheet>
    )
  }
  return (
    <Sheet open={open && !!item} onClose={close} title={`Swap ${W.exercise}`}>
      {cur ? (
        <p className="-mt-1 mb-3 text-sm text-muted">
          Instead of <b className="text-ink">{cur.name}</b>, do:
        </p>
      ) : null}
      {alts.length === 0 ? <p className="text-sm text-muted">No alternatives fit your equipment and aches right now.</p> : null}
      <ul className="space-y-2">
        {alts.map((ex) => (
          <li key={ex.id}>
            <button
              type="button"
              onClick={() => setSel(ex.id)}
              aria-pressed={sel === ex.id}
              className={cx('flex w-full items-center gap-3 rounded-2xl border p-2 text-left', sel === ex.id ? 'border-ember bg-ember/10' : 'border-line bg-surface')}
            >
              <div className="w-20 shrink-0 overflow-hidden rounded-xl bg-bg">
                <Mannequin motion={motionFor(ex)} playing={false} time={0.9} palette={palette} className="aspect-[4/3] w-full" title={ex.name} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{ex.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <LevelDots level={ex.level} />
                  <span className="truncate">{ex.equipment.length ? ex.equipment.map((e) => EQUIP_LABEL[e]).join(', ') : 'Bodyweight'}</span>
                </div>
              </div>
              {sel === ex.id ? <Check className="mr-1 shrink-0 text-ember" size={20} /> : null}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          disabled={!sel}
          onClick={() => {
            onPick({ exerciseId: sel, always: false })
            close()
          }}
        >
          Just this workout
        </Button>
        <Button
          disabled={!sel}
          onClick={() => {
            onPick({ exerciseId: sel, always: true })
            close()
          }}
        >
          From now on
        </Button>
      </div>
      {swapped ? (
        <Button
          block
          variant="ghost"
          className="mt-2"
          icon={<RotateCcw size={16} />}
          onClick={() => {
            onPick({ exerciseId: null, always: false })
            close()
          }}
        >
          Back to the planned {W.exercise}
        </Button>
      ) : null}
      {skip}
    </Sheet>
  )
}
