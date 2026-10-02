import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeftRight, Clock, Flame, Info, Play } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, motionFor } from '@/data/exercises'
import { describeTarget, planContext, type PlannedItem } from '@/engines/plan'
import { swapsFor, usePlan } from '@/state/plan'
import { saveProgress, setSessionSwap } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Tag } from '@/ui/Chip'
import { PageHeader } from '@/ui/PageHeader'
import { blockSummary, gearFor } from './sessionMeta'
import { SwapSheet } from './SwapSheet'
import { useSessionFromParams } from './useSessionParams'

function ItemRow({ it, onSwap, swapped }: { it: PlannedItem; onSwap?: () => void; swapped?: boolean }) {
  const palette = usePalette()
  const ex = getExercise(it.exerciseId)
  if (!ex) return null
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Link to={`/exercise/${ex.id}`} className="w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-bg" aria-label={`${ex.name} guide`}>
        <Mannequin motion={motionFor(ex)} playing={false} time={0.9} palette={palette} className="aspect-[4/3] w-full" title={ex.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/exercise/${ex.id}`} className="block truncate font-semibold">
          {ex.name}
        </Link>
        <div className="text-sm text-muted">
          {describeTarget(it)}
          {it.loadLb ? ` · ${it.loadLb} lb` : ''}
          {swapped ? <span className="ml-1.5 text-sky">· swapped</span> : null}
        </div>
        {it.notes.length ? <div className="mt-0.5 line-clamp-2 text-xs text-amber">{it.notes.join(' · ')}</div> : null}
      </div>
      {onSwap ? (
        <button type="button" onClick={onSwap} aria-label={`Swap ${ex.name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
          <ArrowLeftRight size={18} />
        </button>
      ) : null}
    </li>
  )
}

export default function SessionPage() {
  const plan = usePlan()
  const data = useSessionFromParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [swapItem, setSwapItem] = useState<PlannedItem | null>(null)
  const ctx = useMemo(() => (plan ? planContext(plan.inputs) : null), [plan])

  if (!plan || !data || !ctx) return <PageHeader title="Workout" back="/train" />
  const { session: s, index, snack } = data
  const swaps = swapsFor(plan, index) ?? {}
  const gear = gearFor(s)
  const weekLabel = snack ? 'Snack' : s.deload ? 'Deload week' : `Week ${s.mesoWeek + 1} of 4`

  return (
    <>
      <PageHeader title={s.title} subtitle={snack ? 'Quick movement break' : `Workout ${index + 1} · ${weekLabel}`} back="/train" />
      <div className="px-4">
        <div className="flex flex-wrap gap-2">
          <Tag tone="ember">
            <Clock size={13} /> {s.minutes} min
          </Tag>
          <Tag tone="amber">
            <Flame size={13} /> ~{s.estKcal} kcal
          </Tag>
          {s.express ? <Tag tone="sky">Express</Tag> : null}
          {s.deload ? <Tag tone="teal">Lighter week</Tag> : null}
        </div>
        {gear.length ? (
          <Card className="mt-3 flex items-start gap-2.5 py-3 text-sm">
            <Info size={18} className="mt-0.5 shrink-0 text-sky" />
            <span>
              <b>Have ready:</b> {gear.join(', ')}.
            </span>
          </Card>
        ) : null}
        {s.blocks.map((b) => (
          <section key={b.id} className="mt-5">
            <div className="mb-1 flex items-baseline justify-between gap-2 px-1">
              <h2 className="font-display text-lg font-bold">{b.title}</h2>
              <span className="text-xs text-muted">{blockSummary(b)}</span>
            </div>
            <Card className="py-1">
              <ul className="divide-y divide-line/60">
                {b.items.map((it) => (
                  <ItemRow
                    key={`${b.id}-${it.exerciseId}`}
                    it={it}
                    swapped={it.slot !== undefined && swaps[it.slot] === it.exerciseId}
                    onSwap={!snack && b.kind === 'main' && it.slot !== undefined ? () => setSwapItem(it) : undefined}
                  />
                ))}
              </ul>
            </Card>
          </section>
        ))}
        {s.deload ? (
          <p className="mt-4 text-sm text-muted">Every fourth week is lighter so your body can catch up and come back stronger. Enjoy the shorter sessions.</p>
        ) : null}
        <div className="sticky bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+12px)] mt-6">
          <Button block size="lg" icon={<Play size={20} />} onClick={() => navigate(`/workout?${params.toString()}`)}>
            Start workout
          </Button>
        </div>
      </div>
      <SwapSheet
        item={swapItem}
        ctx={ctx}
        open={!!swapItem}
        swapped={!!swapItem && swapItem.slot !== undefined && swaps[swapItem.slot] !== undefined}
        onClose={() => setSwapItem(null)}
        onPick={async ({ exerciseId, always }) => {
          const it = swapItem
          if (!it || it.slot === undefined) return
          if (always && exerciseId && it.ladder) {
            await saveProgress({ ...plan.progress, preferred: { ...plan.progress.preferred, [it.ladder]: exerciseId } })
            await setSessionSwap(index, it.slot, null)
          } else {
            if (!exerciseId && it.ladder && plan.progress.preferred[it.ladder]) {
              const preferred = { ...plan.progress.preferred }
              delete preferred[it.ladder]
              await saveProgress({ ...plan.progress, preferred })
            }
            await setSessionSwap(index, it.slot, exerciseId)
          }
        }}
      />
    </>
  )
}
