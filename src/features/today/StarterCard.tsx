import { useEffect } from 'react'
import { Link } from 'react-router'
import { BookOpen, Check, ChevronRight, X } from 'lucide-react'
import { APP } from '@/app/brand'
import { useCelebrate } from '@/app/celebrate'
import { dismissStarter, rewardStarter, STARTER_XP, type Starter } from '@/state/starter'
import { Card } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { ProgressRing } from '@/ui/ProgressRing'

/** "Get started" checklist: the first things worth doing in the app, with a bonus for finishing. */
export function StarterCard({ starter }: { starter: Starter }) {
  const all = starter.done === starter.items.length
  useEffect(() => {
    if (!all || starter.rewarded) return
    void rewardStarter().then((first) => {
      if (first) useCelebrate.getState().toast({ tone: 'perfect', title: 'You’re all set!', text: 'Getting started: complete', xp: STARTER_XP, emoji: APP.id === 'bloom' ? '🌸' : '🚀' })
    })
  }, [all, starter.rewarded])
  if (starter.dismissed || (all && starter.rewarded)) return null
  return (
    <Card className="mt-3 overflow-hidden p-0">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <ProgressRing progress={starter.done / starter.items.length} size={44} stroke={5} color="var(--color-teal)" label={`${starter.done} of ${starter.items.length} done`}>
          <span className="text-xs font-bold tabular">
            {starter.done}/{starter.items.length}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal">Get started</div>
          <div className="font-display text-lg font-bold leading-tight">Six quick wins · +{STARTER_XP} XP</div>
        </div>
        <button type="button" aria-label="Hide the getting-started list" onClick={() => void dismissStarter()} className="grid h-9 w-9 place-items-center rounded-full text-faint hover:bg-surface-2">
          <X size={18} />
        </button>
      </div>
      <ul>
        {starter.items.map((it) => (
          <li key={it.id}>
            <Link to={it.to} viewTransition aria-label={`${it.title}${it.done ? ', done' : ''}`} className={cx('pressable flex items-center gap-3 px-4 py-2', !it.done && 'hover:bg-surface-2')}>
              <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg', it.done ? 'bg-good/15' : 'bg-surface-2')}>
                {it.done ? <Check size={18} strokeWidth={3} className="text-good" /> : it.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx('block text-[15px] font-medium leading-snug', it.done && 'text-muted line-through decoration-good/60')}>{it.title}</span>
                {!it.done ? <span className="block text-xs text-muted">{it.text}</span> : null}
              </span>
              {!it.done ? <ChevronRight size={16} className="shrink-0 text-faint" /> : null}
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/guide" viewTransition className="flex items-center gap-2 border-t border-line/60 px-4 py-2.5 text-sm font-medium text-teal">
        <BookOpen size={16} /> New here? See how {APP.name} works
        <ChevronRight size={16} className="ml-auto" />
      </Link>
    </Card>
  )
}
