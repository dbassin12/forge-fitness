import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Ban, ChevronRight, Search, X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { APP, isBloom, W } from '@/app/brand'
import { usePalette } from '@/app/theme'
import { EXERCISES, MUSCLE_LABEL, PATTERN_LABEL, getExercise, motionFor } from '@/data/exercises'
import { haptic } from '@/device/haptics'
import { LADDERS, planContext, resolveSlot, rotationFor, TEMPLATES, type LadderId } from '@/engines/plan'
import { usePlan } from '@/state/plan'
import { setExerciseSkipped, useSkipped } from '@/state/store'
import { Card } from '@/ui/Card'
import { Chip, LevelDots } from '@/ui/Chip'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { GROUPS, PATTERN_ORDER } from './groups'

/** Pick the exercises you don't like; the plan leaves them out and uses the closest alternative. */
export default function SkipListPage() {
  const plan = usePlan()
  const skipped = useSkipped()
  const palette = usePalette()
  const [q, setQ] = useState('')
  const [group, setGroup] = useState(0)

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const pats = GROUPS[group].patterns
    return EXERCISES.filter((e) => {
      if (pats.length && !pats.includes(e.pattern)) return false
      if (!needle) return true
      return [e.name, PATTERN_LABEL[e.pattern], ...e.muscles.primary.map((m) => MUSCLE_LABEL[m])].join(' ').toLowerCase().includes(needle)
    }).sort((a, b) => PATTERN_ORDER.indexOf(a.pattern) - PATTERN_ORDER.indexOf(b.pattern) || a.level - b.level)
  }, [q, group])

  // Movements with nothing left to plan (everything skipped or ruled out by equipment and aches).
  const gaps = useMemo(() => {
    if (!plan) return []
    const ctx = planContext(plan.inputs)
    const ladders = [...new Set(rotationFor(plan.inputs).flatMap((t) => TEMPLATES[t].slots.map((s) => s.ladder)))] as LadderId[]
    return ladders.filter((l) => !resolveSlot(l, plan.progress.ladders[l]?.rung ?? 0, ctx)).map((l) => LADDERS[l].name.toLowerCase())
  }, [plan])

  if (!skipped) return <PageHeader title={isBloom ? 'Poses I skip' : 'Exercises I skip'} back />
  const chosen = [...skipped].map((id) => getExercise(id)).filter((e) => !!e)
  const toggle = (id: string, on: boolean) => {
    haptic('light')
    void setExerciseSkipped(id, on)
  }

  return (
    <>
      <PageHeader
        title={isBloom ? 'Poses I skip' : 'Exercises I skip'}
        subtitle={chosen.length ? `${chosen.length} left out of your ${W.workouts}` : `Tap any ${W.exercise} you’d rather not do`}
        back
      />
      <div className="px-4">
        <p className="text-sm text-muted">
          {APP.name} leaves skipped {W.exercises} out of your {W.workouts}
          {isBloom ? ' and mini flows' : ', warm-ups, snacks and games'}, and uses the closest alternative instead. They stay in the library if you want to look one up.
        </p>
        {gaps.length ? (
          <Card className="mt-3 flex gap-2.5 border-amber/40 bg-amber/5 py-3 text-sm">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber" />
            <span>
              Nothing is left for <b>{gaps.join(', ')}</b>, so your {W.workouts} will leave {gaps.length === 1 ? 'that movement' : 'those movements'} out.
            </span>
          </Card>
        ) : null}
        {chosen.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`Skipped ${W.exercises}`}>
            {chosen.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => toggle(e.id, false)}
                aria-label={`Bring back ${e.name}`}
                className="pressable flex items-center gap-1 rounded-full border border-bad/40 bg-bad/10 py-1 pl-3 pr-2 text-sm font-medium"
              >
                {e.name} <X size={14} className="text-muted" />
              </button>
            ))}
          </div>
        ) : null}
        <label className="mt-3 flex h-11 items-center gap-2 rounded-2xl border border-line bg-surface px-3 text-muted focus-within:border-ember">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
            enterKeyHint="search"
            autoCorrect="off"
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder={isBloom ? 'Search poses' : 'Search exercises or muscles'}
            className="h-full flex-1 bg-transparent text-ink outline-none placeholder:text-faint"
          />
        </label>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {GROUPS.map((g, i) => (
            <Chip key={g.label} active={group === i} onClick={() => setGroup(i)}>
              {g.label}
            </Chip>
          ))}
        </div>
        <Card className="mt-3 py-1">
          <ul className="divide-y divide-line/60">
            {list.map((e) => {
              const on = skipped.has(e.id)
              return (
                <li key={e.id} className="flex items-center gap-3 py-2">
                  <Link to={`/exercise/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3" aria-label={`${e.name} guide`}>
                    <span className={cx('w-16 shrink-0 overflow-hidden rounded-xl bg-bg', on && 'opacity-50')}>
                      <Mannequin motion={motionFor(e)} playing={false} time={0.9} palette={palette} className="aspect-[4/3] w-full" title={e.name} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('line-clamp-2 block font-semibold leading-snug', on && 'text-muted line-through decoration-bad/60')}>{e.name}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <LevelDots level={e.level} />
                        <span className="truncate">{PATTERN_LABEL[e.pattern]}</span>
                        <ChevronRight size={12} className="shrink-0 text-faint" />
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`Skip ${e.name}`}
                    onClick={() => toggle(e.id, !on)}
                    className={cx(
                      'pressable flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold',
                      on ? 'border-bad bg-bad text-white' : 'border-line bg-surface-2 text-muted',
                    )}
                  >
                    <Ban size={15} /> {on ? 'Skipped' : 'Skip'}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
        {list.length === 0 ? <p className="mt-10 text-center text-muted">{isBloom ? 'No poses match.' : 'No exercises match.'}</p> : null}
        <div className="h-4" />
      </div>
    </>
  )
}
