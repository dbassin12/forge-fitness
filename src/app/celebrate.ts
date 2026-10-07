import { create } from 'zustand'
import type { AchievementTier } from '@/engines/gamification'
import { usePrefs } from './prefs'
import type { AccentInfo } from './theme'

export interface BadgeInfo {
  id: string
  title: string
  description: string
  badge: string
  tier: AchievementTier
}

export type Celebration =
  | { kind: 'level'; level: number; title: string; unlocks: AccentInfo[]; gear?: { id: 'headband' | 'shades' | 'cap' | 'medal' | 'crown'; name: string }[] }
  | { kind: 'badges'; badges: BadgeInfo[] }
  | { kind: 'pb'; title: string; text: string; emoji: string }

export interface Toast {
  id: number
  title: string
  text?: string
  xp?: number
  emoji?: string
  tone?: 'quest' | 'info' | 'perfect' | 'badge'
}

interface CelebrateState {
  queue: Celebration[]
  toasts: Toast[]
  floaters: { id: number; xp: number }[]
  push: (c: Celebration) => void
  shift: () => void
  toast: (t: Omit<Toast, 'id'>) => void
  dropToast: (id: number) => void
  float: (xp: number) => void
  dropFloat: (id: number) => void
}

let seq = 1

/** The same news as a small note, for when full-screen celebrations are turned off. */
function asToasts(c: Celebration): Omit<Toast, 'id'>[] {
  if (c.kind === 'level') {
    const extra = [c.unlocks.length ? `New color: ${c.unlocks.map((u) => u.name).join(', ')}` : '', c.gear?.length ? `New gear for Ember: ${c.gear.map((g) => g.name).join(', ')}` : '']
      .filter(Boolean)
      .join(' · ')
    return [{ tone: 'perfect', title: `Level up! You’re level ${c.level}`, text: extra || c.title, emoji: '⭐' }]
  }
  if (c.kind === 'badges') return c.badges.map((b) => ({ tone: 'badge', title: `Achievement: ${b.title}`, text: b.description, xp: 20, emoji: b.badge }))
  return [{ tone: 'perfect', title: 'New personal best!', text: c.title, emoji: c.emoji }]
}

/** Queue of celebration screens, toasts and "+XP" floaters shown by <CelebrationHost />. */
export const useCelebrate = create<CelebrateState>((set) => ({
  queue: [],
  toasts: [],
  floaters: [],
  push: (c) =>
    usePrefs.getState().celebrations
      ? set((s) => ({ queue: [...s.queue, c] }))
      : set((s) => ({ toasts: [...s.toasts, ...asToasts(c).map((t) => ({ ...t, id: seq++ }))].slice(-3) })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
  toast: (t) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id: seq++ }] })),
  dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  float: (xp) => set((s) => ({ floaters: [...s.floaters.slice(-3), { id: seq++, xp }] })),
  dropFloat: (id) => set((s) => ({ floaters: s.floaters.filter((f) => f.id !== id) })),
}))
