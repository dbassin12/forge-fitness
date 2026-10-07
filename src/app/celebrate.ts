import { create } from 'zustand'
import type { AchievementTier } from '@/engines/gamification'
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

/** Queue of celebration screens, toasts and "+XP" floaters shown by <CelebrationHost />. */
export const useCelebrate = create<CelebrateState>((set) => ({
  queue: [],
  toasts: [],
  floaters: [],
  push: (c) => set((s) => ({ queue: [...s.queue, c] })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
  toast: (t) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id: seq++ }] })),
  dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  float: (xp) => set((s) => ({ floaters: [...s.floaters.slice(-3), { id: seq++, xp }] })),
  dropFloat: (id) => set((s) => ({ floaters: s.floaters.filter((f) => f.id !== id) })),
}))
