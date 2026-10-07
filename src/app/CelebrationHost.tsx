import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Palette, Sparkles } from 'lucide-react'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { Button } from '@/ui/Button'
import { cx } from '@/ui/cx'
import { useCelebrate, type BadgeInfo, type Celebration, type Toast } from './celebrate'
import { burst } from './confetti'
import { useTheme } from './theme'

const TIER_RING: Record<BadgeInfo['tier'], string> = {
  bronze: 'from-[#c98a54] to-[#7a4a25]',
  silver: 'from-[#e5e9f0] to-[#8b95a5]',
  gold: 'from-[#ffe08a] to-[#d99a1e]',
}

export function BadgeMedal({ badge, tier, size = 'lg', locked, className, style }: { badge: string; tier: BadgeInfo['tier']; size?: 'sm' | 'md' | 'lg'; locked?: boolean; className?: string; style?: React.CSSProperties }) {
  const dims = size === 'lg' ? 'h-24 w-24 text-5xl p-1.5' : size === 'md' ? 'h-16 w-16 text-3xl p-1' : 'h-12 w-12 text-2xl p-[3px]'
  return (
    <span className={cx('relative inline-grid shrink-0 rounded-full bg-gradient-to-br', locked ? 'from-surface-3 to-surface-2' : TIER_RING[tier], dims, className)} style={style}>
      <span className={cx('grid place-items-center rounded-full bg-surface', locked && 'grayscale opacity-40')}>{badge}</span>
    </span>
  )
}

function LevelUp({ c, onDone }: { c: Extract<Celebration, { kind: 'level' }>; onDone: () => void }) {
  const setAccent = useTheme((s) => s.setAccent)
  const unlock = c.unlocks[c.unlocks.length - 1]
  return (
    <div className="relative flex flex-col items-center px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 animate-spin-slow rounded-full opacity-40"
        style={{ background: 'repeating-conic-gradient(from 0deg, color-mix(in oklab, var(--color-ember) 45%, transparent) 0deg 10deg, transparent 10deg 30deg)', maskImage: 'radial-gradient(circle, black 30%, transparent 68%)' }}
      />
      <div className="relative text-sm font-bold uppercase tracking-[0.35em] text-gradient animate-fade-up">Level up!</div>
      <div className="relative mt-5 grid h-36 w-36 animate-bounce-in place-items-center rounded-full bg-gradient-to-br from-ember to-amber p-1.5 shadow-[0_0_60px_-10px_var(--color-ember)]">
        <div className="grid h-full w-full place-items-center rounded-full bg-surface">
          <div>
            <div className="font-display text-6xl font-black leading-none tabular">{c.level}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">level</div>
          </div>
        </div>
      </div>
      <h2 className="relative mt-5 font-display text-3xl font-bold animate-fade-up [animation-delay:200ms]">{c.title}</h2>
      <p className="relative mt-1 text-muted animate-fade-up [animation-delay:300ms]">Every rep and every meal got you here. Keep stacking XP.</p>
      {unlock ? (
        <div className="relative mt-5 flex w-full max-w-xs items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3 text-left animate-fade-up [animation-delay:450ms]">
          <span className="h-10 w-10 shrink-0 rounded-full ring-2 ring-white/20" style={{ background: `linear-gradient(135deg, ${unlock.dark}, ${unlock.dark2})` }} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">New color unlocked</div>
            <div className="font-semibold">{unlock.name}</div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Palette size={15} />}
            onClick={() => {
              setAccent(unlock.id)
              haptic('medium')
            }}
          >
            Try it
          </Button>
        </div>
      ) : null}
      <Button size="lg" block className="relative mt-6 max-w-xs" onClick={onDone}>
        Keep going
      </Button>
    </div>
  )
}

function Badges({ c, onDone }: { c: Extract<Celebration, { kind: 'badges' }>; onDone: () => void }) {
  const one = c.badges.length === 1 ? c.badges[0] : null
  return (
    <div className="flex flex-col items-center px-6 text-center">
      <div className="text-sm font-bold uppercase tracking-[0.3em] text-amber animate-fade-up">{one ? 'Achievement unlocked' : `${c.badges.length} achievements unlocked`}</div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {c.badges.slice(0, 6).map((b, i) => (
          <BadgeMedal key={b.id} badge={b.badge} tier={b.tier} size={one ? 'lg' : 'md'} className="animate-bounce-in" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
      {one ? (
        <>
          <h2 className="mt-5 font-display text-3xl font-bold">{one.title}</h2>
          <p className="mt-1 text-muted">{one.description}</p>
        </>
      ) : (
        <ul className="mt-5 w-full max-w-xs space-y-1.5 text-left text-sm">
          {c.badges.map((b) => (
            <li key={b.id} className="flex items-center gap-2">
              <Check size={16} className="shrink-0 text-good" />
              <span>
                <b>{b.title}</b> <span className="text-muted">· {b.description}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet/15 px-3 py-1 text-sm font-semibold text-violet">
        <Sparkles size={15} /> +{20 * c.badges.length} XP
      </div>
      <Button size="lg" block className="mt-6 max-w-xs" onClick={onDone}>
        Awesome
      </Button>
    </div>
  )
}

function PersonalBest({ c, onDone }: { c: Extract<Celebration, { kind: 'pb' }>; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 text-center">
      <div className="text-sm font-bold uppercase tracking-[0.3em] text-gradient">New personal best</div>
      <div className="mt-4 animate-bounce-in text-7xl">{c.emoji}</div>
      <h2 className="mt-4 font-display text-3xl font-bold">{c.title}</h2>
      <p className="mt-1 text-muted">{c.text}</p>
      <Button size="lg" block className="mt-6 max-w-xs" onClick={onDone}>
        Let’s go
      </Button>
    </div>
  )
}

function Modal({ c }: { c: Celebration }) {
  const shift = useCelebrate((s) => s.shift)
  useEffect(() => {
    if (c.kind === 'level') {
      sfx.levelUp()
      haptic('celebrate')
      burst('big')
    } else if (c.kind === 'badges') {
      sfx.sparkle()
      haptic('success')
      burst('small')
    } else {
      sfx.success()
      haptic('celebrate')
      burst('sides')
    }
  }, [c])
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-hidden bg-black/75 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label="Celebration">
      <div className="w-full max-w-md animate-rise" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
        {c.kind === 'level' ? <LevelUp c={c} onDone={shift} /> : c.kind === 'badges' ? <Badges c={c} onDone={shift} /> : <PersonalBest c={c} onDone={shift} />}
      </div>
    </div>,
    document.body,
  )
}

function ToastView({ t }: { t: Toast }) {
  const drop = useCelebrate((s) => s.dropToast)
  useEffect(() => {
    if (t.tone === 'perfect') {
      sfx.levelUp()
      haptic('celebrate')
      burst('sides')
    } else if (t.tone === 'quest') {
      sfx.success()
      haptic('success')
    } else if (t.tone === 'badge') {
      sfx.sparkle()
      haptic('success')
      burst('small')
    }
    const id = window.setTimeout(() => drop(t.id), t.tone === 'perfect' || t.tone === 'badge' ? 4200 : 3200)
    return () => window.clearTimeout(id)
  }, [t, drop])
  return (
    <button
      type="button"
      onClick={() => drop(t.id)}
      className={cx(
        'pointer-events-auto flex w-full max-w-md animate-slide-up items-center gap-3 rounded-2xl border p-3 text-left shadow-2xl backdrop-blur-xl',
        t.tone === 'perfect' || t.tone === 'badge' ? 'border-amber/50 bg-surface-2/95' : 'border-line bg-surface-2/95',
      )}
      role="status"
    >
      <span className={cx('grid h-10 w-10 shrink-0 animate-bounce-in place-items-center rounded-xl text-xl', t.tone === 'perfect' || t.tone === 'badge' ? 'bg-amber/20' : 'bg-good/15')}>
        {t.emoji ?? <Check size={20} className="text-good" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{t.title}</span>
        {t.text ? <span className="block truncate text-sm text-muted">{t.text}</span> : null}
      </span>
      {t.xp ? <span className="shrink-0 rounded-full bg-violet/15 px-2.5 py-1 text-xs font-bold text-violet">+{t.xp} XP</span> : null}
    </button>
  )
}

function Floater({ id, xp }: { id: number; xp: number }) {
  const drop = useCelebrate((s) => s.dropFloat)
  useEffect(() => {
    const t = window.setTimeout(() => drop(id), 1500)
    return () => window.clearTimeout(t)
  }, [id, drop])
  return <span className="animate-float-up rounded-full bg-violet px-3 py-1 text-sm font-bold text-white shadow-lg shadow-violet/30">+{xp} XP</span>
}

/** Renders celebration screens, quest toasts and "+XP" floaters. Mount once per layout. */
export function CelebrationHost({ floaters = true }: { floaters?: boolean }) {
  const current = useCelebrate((s) => s.queue[0])
  const toasts = useCelebrate((s) => s.toasts)
  const floats = useCelebrate((s) => s.floaters)
  return (
    <>
      {toasts.length ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4" style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}>
          {toasts.map((t) => (
            <ToastView key={t.id} t={t} />
          ))}
        </div>
      ) : null}
      {floaters && floats.length ? (
        <div className="pointer-events-none fixed inset-x-0 z-[55] flex flex-col items-center gap-1" style={{ bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 18px)' }} aria-hidden>
          {floats.map((f) => (
            <Floater key={f.id} id={f.id} xp={f.xp} />
          ))}
        </div>
      ) : null}
      {current ? <Modal key={JSON.stringify(current).slice(0, 80)} c={current} /> : null}
    </>
  )
}
