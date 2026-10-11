import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Ban, ChevronRight, Search } from 'lucide-react'
import { EXERCISES, MUSCLE_LABEL, PATTERN_LABEL, motionFor } from '@/data/exercises'
import { Mannequin } from '@/anim/Mannequin'
import { PageHeader } from '@/ui/PageHeader'
import { Chip, LevelDots } from '@/ui/Chip'
import { isBloom, W } from '@/app/brand'
import { usePalette } from '@/app/theme'
import { useSkipped } from '@/state/store'
import { cx } from '@/ui/cx'
import { GROUPS, PATTERN_ORDER as ORDER } from './groups'

type EquipFilter = 'any' | 'none' | 'db'

export default function LibraryPage() {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState(0)
  const [equip, setEquip] = useState<EquipFilter>('any')
  const palette = usePalette()
  const skipped = useSkipped()

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const pats = GROUPS[group].patterns
    return EXERCISES.filter((e) => {
      if (pats.length && !pats.includes(e.pattern)) return false
      if (equip === 'none' && e.equipment.some((x) => x.startsWith('db'))) return false
      if (equip === 'db' && !e.equipment.some((x) => x.startsWith('db'))) return false
      if (!needle) return true
      const hay = [e.name, PATTERN_LABEL[e.pattern], ...e.muscles.primary.map((m) => MUSCLE_LABEL[m])].join(' ').toLowerCase()
      return hay.includes(needle)
    }).sort((a, b) => ORDER.indexOf(a.pattern) - ORDER.indexOf(b.pattern) || a.level - b.level)
  }, [q, group, equip])

  return (
    <>
      <PageHeader title={isBloom ? 'Pose library' : 'Exercise library'} subtitle={`${EXERCISES.length} animated, voiced guides`} back="/train" />
      <div className="px-4">
        <label className="flex h-11 items-center gap-2 rounded-2xl border border-line bg-surface px-3 text-muted focus-within:border-ember">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            inputMode="search"
            enterKeyHint="search"
            autoCorrect="off"
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder={isBloom ? 'Search poses or body areas' : 'Search exercises or muscles'}
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
        {isBloom ? null : (
          <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
            <Chip active={equip === 'any'} onClick={() => setEquip('any')}>Any equipment</Chip>
            <Chip active={equip === 'none'} onClick={() => setEquip('none')}>No dumbbells</Chip>
            <Chip active={equip === 'db'} onClick={() => setEquip('db')}>Dumbbells</Chip>
          </div>
        )}
        <Link to="/train/skipped" className="mt-3 flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2.5 text-sm">
          <Ban size={16} className="shrink-0 text-muted" />
          <span className="flex-1">
            {skipped?.size
              ? `You skip ${skipped.size} ${skipped.size === 1 ? W.exercise : W.exercises}. Change which`
              : `Don’t like ${isBloom ? 'a pose' : 'an exercise'}? Leave it out of your ${W.workouts}`}
          </span>
          <ChevronRight size={16} className="shrink-0 text-faint" />
        </Link>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {list.map((e) => (
            <li key={e.id}>
              <Link to={`/exercise/${e.id}`} className="block rounded-2xl border border-line/70 bg-surface p-2 transition active:scale-[0.98]">
                <div className="relative overflow-hidden rounded-xl bg-bg">
                  <Mannequin motion={motionFor(e)} playing={false} time={0.9} palette={palette} className={cx('aspect-[4/3] w-full', skipped?.has(e.id) && 'opacity-40')} title={e.name} />
                  {skipped?.has(e.id) ? (
                    <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-bad px-2 py-0.5 text-[11px] font-semibold text-white">
                      <Ban size={11} /> Skipped
                    </span>
                  ) : null}
                </div>
                <div className="px-1 pt-2">
                  <div className="line-clamp-2 text-sm font-semibold leading-snug">{e.name}</div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted">
                    <span className="truncate">{MUSCLE_LABEL[e.muscles.primary[0]]}</span>
                    <LevelDots level={e.level} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {list.length === 0 ? <p className="mt-10 text-center text-muted">{isBloom ? 'No poses match.' : 'No exercises match.'}</p> : null}
      </div>
    </>
  )
}
