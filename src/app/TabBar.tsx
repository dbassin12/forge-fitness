import { NavLink } from 'react-router'
import { Apple, Dumbbell, Flame, Flower2, Gamepad2, Sprout, Sun, TrendingUp, UtensilsCrossed, Wind } from 'lucide-react'
import { isBloom } from '@/app/brand'
import { haptic } from '@/device/haptics'
import { cx } from '@/ui/cx'

const FORGE_TABS = [
  { to: '/today', label: 'Today', Icon: Flame },
  { to: '/train', label: 'Train', Icon: Dumbbell },
  { to: '/play', label: 'Play', Icon: Gamepad2 },
  { to: '/eat', label: 'Eat', Icon: UtensilsCrossed },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
]

/** Bloom swaps the games for breathing and calls food "Nourish". */
const BLOOM_TABS = [
  { to: '/today', label: 'Today', Icon: Sun },
  { to: '/train', label: 'Practice', Icon: Flower2 },
  { to: '/breathe', label: 'Breathe', Icon: Wind },
  { to: '/eat', label: 'Nourish', Icon: Apple },
  { to: '/progress', label: 'Growth', Icon: Sprout },
]

const tabs = isBloom ? BLOOM_TABS : FORGE_TABS

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="vt-tabbar fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/90 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2" style={{ height: 'var(--tabbar-h)' }}>
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              viewTransition
              onClick={() => haptic('light')}
              className={({ isActive }) =>
                cx('group relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors', isActive ? 'text-ember' : 'text-faint hover:text-muted')
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    aria-hidden
                    className={cx(
                      'absolute top-1.5 h-8 w-14 rounded-full bg-ember/15 transition duration-300 ease-out',
                      isActive ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
                    )}
                  />
                  <Icon key={String(isActive)} size={22} strokeWidth={isActive ? 2.4 : 2} className={cx('relative transition-transform group-active:scale-90', isActive && 'animate-bounce-in')} />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
