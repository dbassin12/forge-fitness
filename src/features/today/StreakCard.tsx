import { Snowflake } from 'lucide-react'
import { isBloom, W } from '@/app/brand'
import type { WorkoutLog } from '@/db/db'
import type { WeeklyStreak } from '@/engines/gamification'
import { addDays, isoWeekday, startOfWeek, WEEKDAY_SHORT } from '@/lib/dates'
import type { ISODate } from '@/domain/types'
import { Card } from '@/ui/Card'
import { cx } from '@/ui/cx'

/** An animated flame whose size grows with the streak. */
export function Flame({ weeks, size = 44 }: { weeks: number; size?: number }) {
  const lit = weeks > 0
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className={cx('shrink-0', lit && 'animate-flame')} style={{ transformOrigin: '50% 90%' }}>
      <defs>
        <linearGradient id="flame-outer" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lit ? 'var(--color-ember)' : 'var(--color-surface-3)'} />
          <stop offset="1" stopColor={lit ? 'var(--color-amber)' : 'var(--color-line)'} />
        </linearGradient>
        <linearGradient id="flame-inner" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lit ? '#fff3c4' : 'var(--color-surface-2)'} />
          <stop offset="1" stopColor={lit ? 'var(--color-amber)' : 'var(--color-surface-3)'} />
        </linearGradient>
      </defs>
      <path d="M24 3c2 7 10 11 10 22a10 10 0 0 1-20 0c0-5 3-8 5-11 0 4 2 6 4 6 0-6-1-11 1-17Z" fill="url(#flame-outer)" />
      <path d="M24 22c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-7 0 2 1 3 2 3 0-3 0-5 1-8Z" fill="url(#flame-inner)" />
    </svg>
  )
}

const PETAL = 'M24 39c-5-5-6.5-15 0-25 6.5 10 5 20 0 25Z'

/** Bloom's streak: a lotus that opens wider as the weeks add up. */
export function Blossom({ weeks, size = 44 }: { weeks: number; size?: number }) {
  const lit = weeks > 0
  const open = Math.min(1, 0.6 + weeks * 0.08)
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className={cx('shrink-0', lit && 'animate-breath')} style={{ transformOrigin: '50% 85%' }}>
      <defs>
        <linearGradient id="blossom-petal" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={lit ? 'var(--color-ember)' : 'var(--color-surface-3)'} />
          <stop offset="1" stopColor={lit ? 'var(--color-ember-2)' : 'var(--color-line)'} />
        </linearGradient>
      </defs>
      {[-72, 72, -38, 38].map((deg) => (
        <path key={deg} d={PETAL} transform={`rotate(${deg * open} 24 39)`} fill="url(#blossom-petal)" opacity={Math.abs(deg) > 50 ? 0.6 : 0.8} />
      ))}
      <path d={PETAL} fill="url(#blossom-petal)" />
      <path d="M11 41.5c4 2.5 8.5 3.5 13 3.5s9-1 13-3.5" stroke={lit ? 'var(--color-good)' : 'var(--color-line)'} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

/** The streak symbol for this app: Forge's flame or Bloom's lotus. */
export function StreakIcon(props: { weeks: number; size?: number }) {
  return isBloom ? <Blossom {...props} /> : <Flame {...props} />
}

type DayState = 'done' | 'snack' | 'missed' | 'planned' | 'rest'

/** Streak + this week at a glance (one dot per day). */
export function StreakCard({ streak, workouts, trainingDays, today }: { streak: WeeklyStreak; workouts: WorkoutLog[]; trainingDays: number[]; today: ISODate }) {
  const monday = startOfWeek(today)
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i)
    const wd = isoWeekday(date)
    const ws = workouts.filter((w) => w.date === date)
    const state: DayState = ws.some((w) => w.kind === 'plan')
      ? 'done'
      : ws.length
        ? 'snack'
        : trainingDays.includes(wd)
          ? date < today
            ? 'missed'
            : 'planned'
          : 'rest'
    return { date, wd, state, isToday: date === today }
  })
  const left = Math.max(0, streak.target - streak.thisWeek)
  return (
    <Card className="mt-3">
      <div className="flex items-center gap-3">
        <StreakIcon weeks={streak.weeks} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-xl font-bold leading-tight">
            {streak.weeks > 0 ? `${streak.weeks}-week streak` : isBloom ? 'Grow your streak' : 'Light your streak'}
          </div>
          <div className="text-sm text-muted">
            {left === 0
              ? isBloom
                ? 'Weekly goal reached. Anything more is a gift.'
                : 'Weekly goal hit! Anything more is a bonus.'
              : `${left} more ${left === 1 ? W.workout : W.workouts} to ${isBloom ? 'reach' : 'hit'} this week’s goal`}
          </div>
        </div>
        {streak.freezes > 0 ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-sky/15 px-2 py-1 text-xs font-semibold text-sky" title="Streak freezes: a missed week won't break your streak">
            <Snowflake size={13} /> {streak.freezes}
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {days.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span className={cx('text-[11px] font-medium', d.isToday ? 'text-ink' : 'text-faint')}>{WEEKDAY_SHORT[d.wd - 1].slice(0, 1)}</span>
            <span
              className={cx(
                'grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition',
                d.state === 'done' && 'bg-ember text-on-accent animate-pop',
                d.state === 'snack' && 'bg-ember/25 text-ember',
                d.state === 'missed' && 'bg-surface-2 text-faint',
                d.state === 'planned' && 'border-2 border-dashed border-ember/50 text-ember/80',
                d.state === 'rest' && 'bg-surface-2/60 text-faint',
                d.isToday && d.state !== 'done' && 'ring-2 ring-ink/70 ring-offset-2 ring-offset-surface',
              )}
              aria-label={`${WEEKDAY_SHORT[d.wd - 1]}: ${d.state === 'done' ? `${W.workout} done` : d.state === 'snack' ? 'moved' : d.state === 'missed' ? 'missed' : d.state === 'planned' ? `${W.workout} planned` : 'rest day'}`}
            >
              {d.state === 'done' ? '✓' : d.state === 'snack' ? '•' : d.state === 'missed' ? '–' : ''}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}
