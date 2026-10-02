import { useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
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

/** Pick an alternative for one exercise: just for this workout, or from now on. */
export function SwapSheet({
  item,
  ctx,
  open,
  swapped,
  onClose,
  onPick,
}: {
  item: PlannedItem | null
  ctx: PlanContext
  open: boolean
  swapped: boolean
  onClose: () => void
  onPick: (c: SwapChoice) => void
}) {
  const palette = usePalette()
  const [sel, setSel] = useState<string | null>(null)
  const cur = item ? getExercise(item.exerciseId) : undefined
  const alts = item ? alternativesFor(item.exerciseId, ctx, item.ladder) : []
  const close = () => {
    setSel(null)
    onClose()
  }
  return (
    <Sheet open={open && !!item} onClose={close} title="Swap exercise">
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
          Back to the planned exercise
        </Button>
      ) : null}
    </Sheet>
  )
}
