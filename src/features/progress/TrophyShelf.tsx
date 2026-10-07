import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Lock, Trophy } from 'lucide-react'
import { BadgeMedal } from '@/app/CelebrationHost'
import { ACHIEVEMENTS, achievementProgress, type Achievement } from '@/engines/gamification'
import { computeStats } from '@/state/gamification'
import type { PlanState } from '@/state/plan'
import { Card, SectionTitle } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { Sheet } from '@/ui/Sheet'

const TIER_LABEL = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' } as const

function Bar({ value, target, className }: { value: number; target: number; className?: string }) {
  return (
    <div className={cx('h-1.5 overflow-hidden rounded-full bg-surface-3', className)}>
      <div className="h-full rounded-full bg-gradient-to-r from-amber to-ember transition-[width] duration-700" style={{ width: `${Math.min(1, value / Math.max(1, target)) * 100}%` }} />
    </div>
  )
}

/** Every achievement as a medal, the ones you're closest to, and a detail sheet. */
export function TrophyShelf({ plan, unlocked }: { plan: PlanState; unlocked: Map<string, number> | undefined }) {
  const stats = useLiveQuery(() => computeStats(plan.profile, plan.progress), [plan])
  const [open, setOpen] = useState<Achievement | null>(null)
  const got = unlocked?.size ?? 0

  const closest = useMemo(() => {
    if (!stats || !unlocked) return []
    return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id))
      .map((a) => ({ a, p: achievementProgress(a.id, stats) }))
      .filter((x): x is { a: Achievement; p: { value: number; target: number } } => !!x.p && x.p.value > 0)
      .sort((x, y) => y.p.value / y.p.target - x.p.value / x.p.target)
      .slice(0, 3)
  }, [stats, unlocked])

  const detail = open && stats ? achievementProgress(open.id, stats) : null
  const when = open ? unlocked?.get(open.id) : undefined

  return (
    <>
      <SectionTitle>Achievements</SectionTitle>
      <Card>
        <div className="flex items-center gap-3">
          <Trophy size={22} className="text-amber" />
          <div className="flex-1">
            <div className="font-semibold">
              {got} of {ACHIEVEMENTS.length} unlocked
            </div>
            <Bar value={got} target={ACHIEVEMENTS.length} className="mt-1.5" />
          </div>
        </div>
        {closest.length ? (
          <div className="mt-4 space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Almost there</div>
            {closest.map(({ a, p }) => (
              <button key={a.id} type="button" onClick={() => setOpen(a)} className="pressable flex w-full items-center gap-3 text-left">
                <BadgeMedal badge={a.badge} tier={a.tier} size="sm" locked />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{a.title}</span>
                    <span className="shrink-0 text-xs text-muted tabular">
                      {Math.round(p.value)}/{p.target}
                    </span>
                  </div>
                  <Bar value={p.value} target={p.target} className="mt-1" />
                </div>
              </button>
            ))}
          </div>
        ) : null}
        <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3">
          {ACHIEVEMENTS.map((a) => {
            const has = unlocked?.has(a.id)
            return (
              <li key={a.id}>
                <button type="button" onClick={() => setOpen(a)} className="pressable flex w-full flex-col items-center text-center" aria-label={`${a.title}: ${has ? 'unlocked' : 'locked'}. ${a.description}`}>
                  <BadgeMedal badge={a.badge} tier={a.tier} size="sm" locked={!has} />
                  <span className={cx('mt-1 line-clamp-2 text-[10px] leading-tight', has ? 'text-ink' : 'text-faint')}>{a.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open ? (
          <div className="flex flex-col items-center pb-2 text-center">
            <BadgeMedal badge={open.badge} tier={open.tier} size="lg" locked={!when} className={when ? 'animate-bounce-in' : ''} />
            <div className={cx('mt-3 text-xs font-bold uppercase tracking-[0.25em]', open.tier === 'gold' ? 'text-amber' : open.tier === 'silver' ? 'text-muted' : 'text-[#c98a54]')}>{TIER_LABEL[open.tier]}</div>
            <h2 className="mt-1 font-display text-2xl font-bold">{open.title}</h2>
            <p className="mt-1 text-muted">{open.description}</p>
            {when ? (
              <p className="mt-3 rounded-full bg-good/15 px-3 py-1 text-sm font-semibold text-good">Unlocked {new Date(when).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            ) : detail ? (
              <div className="mt-4 w-full max-w-xs">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Progress</span>
                  <span className="font-semibold tabular">
                    {Math.round(detail.value)} / {detail.target}
                  </span>
                </div>
                <Bar value={detail.value} target={detail.target} className="mt-1.5 h-2.5" />
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                <Lock size={14} /> Not unlocked yet
              </p>
            )}
            <p className="mt-4 text-xs text-faint">+20 XP when unlocked</p>
          </div>
        ) : null}
      </Sheet>
    </>
  )
}
