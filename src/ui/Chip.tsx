import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

export function Chip({ active, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        'h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition',
        active ? 'border-ember bg-ember/15 text-ember' : 'border-line bg-surface text-muted hover:text-ink',
        className,
      )}
      {...rest}
    />
  )
}

export type TagTone = 'muted' | 'ember' | 'amber' | 'teal' | 'sky' | 'violet' | 'good' | 'bad'

export function Tag({ children, tone = 'muted' }: { children: React.ReactNode; tone?: TagTone }) {
  const tones: Record<TagTone, string> = {
    muted: 'bg-surface-2 text-muted',
    ember: 'bg-ember/15 text-ember',
    amber: 'bg-amber/15 text-amber',
    teal: 'bg-teal/15 text-teal',
    sky: 'bg-sky/15 text-sky',
    violet: 'bg-violet/15 text-violet',
    good: 'bg-good/15 text-good',
    bad: 'bg-bad/15 text-bad',
  }
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', tones[tone])}>{children}</span>
}

export function LevelDots({ level }: { level: number }) {
  const filled = Math.ceil(level / 2)
  return (
    <span className="inline-flex gap-0.5" aria-label={`Difficulty ${level} of 10`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cx('h-1.5 w-1.5 rounded-full', i < filled ? 'bg-ember' : 'bg-surface-3')} />
      ))}
    </span>
  )
}
