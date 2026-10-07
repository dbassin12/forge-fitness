import { Link } from 'react-router'
import { Check, ChevronRight, Gem } from 'lucide-react'
import { PERFECT_DAY_XP } from '@/engines/quests'
import type { QuestBoard } from '@/state/quests'
import { Card } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { ProgressRing } from '@/ui/ProgressRing'

function fmt(n: number, unit: string) {
  const v = unit.trim() === 'L' ? n.toFixed(1) : String(Math.round(n))
  return `${v}${unit}`
}

/** Today's three quests with live progress. */
export function QuestCard({ board }: { board: QuestBoard }) {
  const { items, perfect, doneCount } = board
  return (
    <Card className="mt-3 overflow-hidden p-0">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-violet">Daily quests</div>
          <div className="font-display text-lg font-bold">{perfect ? 'Perfect day! 💎' : doneCount === 0 ? 'Three wins for today' : `${doneCount} of 3 done`}</div>
        </div>
        <ProgressRing progress={doneCount / 3} size={44} stroke={5} color="var(--color-violet)" label={`${doneCount} of 3 quests done`}>
          <span className="text-xs font-bold tabular">{doneCount}/3</span>
        </ProgressRing>
      </div>
      <ul>
        {items.map(({ def, title, progress, claimed }) => {
          const done = claimed || progress.done
          const partial = !done && progress.target > 1
          return (
            <li key={def.id}>
              <Link
                to={def.to}
                viewTransition
                className={cx('pressable flex items-center gap-3 px-4 py-2.5', done ? 'opacity-80' : 'hover:bg-surface-2')}
                aria-label={`${title}${done ? ', done' : ''}`}
              >
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl', done ? 'bg-good/15' : 'bg-surface-2')}>
                  {done ? <Check size={20} strokeWidth={3} className="animate-bounce-in text-good" /> : def.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cx('block text-[15px] font-medium leading-snug', done && 'text-muted line-through decoration-good/60')}>{title}</span>
                  {partial ? (
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <span className="block h-full rounded-full bg-violet transition-[width] duration-700" style={{ width: `${Math.min(1, progress.value / Math.max(0.0001, progress.target)) * 100}%` }} />
                      </span>
                      <span className="shrink-0 text-xs text-muted tabular">
                        {fmt(progress.value, progress.unit)}/{fmt(progress.target, progress.unit)}
                      </span>
                    </span>
                  ) : null}
                </span>
                <span className={cx('shrink-0 rounded-full px-2 py-0.5 text-xs font-bold', done ? 'bg-good/15 text-good' : 'bg-violet/15 text-violet')}>+{def.xp} XP</span>
                {!done ? <ChevronRight size={16} className="shrink-0 text-faint" /> : null}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className={cx('flex items-center gap-2 border-t border-line/60 px-4 py-2.5 text-xs', perfect ? 'text-amber' : 'text-muted')}>
        <Gem size={14} className={perfect ? 'text-amber' : 'text-violet'} />
        {perfect ? `Bonus earned: +${PERFECT_DAY_XP} XP. See you tomorrow!` : `Finish all 3 for a +${PERFECT_DAY_XP} XP bonus`}
        <span className="ml-auto flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cx('h-2 w-2 rotate-45 rounded-[2px] transition', i < doneCount ? 'bg-violet' : 'bg-surface-3')} />
          ))}
        </span>
      </div>
    </Card>
  )
}
