import { NavLink } from 'react-router'
import { Flame, Dumbbell, UtensilsCrossed, TrendingUp, Menu } from 'lucide-react'
import { cx } from '@/ui/cx'

const tabs = [
  { to: '/today', label: 'Today', Icon: Flame },
  { to: '/train', label: 'Train', Icon: Dumbbell },
  { to: '/eat', label: 'Eat', Icon: UtensilsCrossed },
  { to: '/progress', label: 'Progress', Icon: TrendingUp },
  { to: '/more', label: 'More', Icon: Menu },
] as const

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/90 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2" style={{ height: 'var(--tabbar-h)' }}>
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                cx(
                  'flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-ember' : 'text-faint hover:text-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
