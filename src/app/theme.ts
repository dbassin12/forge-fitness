import { create } from 'zustand'
import { DARK_PALETTE, LIGHT_PALETTE, type Palette } from '@/anim/draw'

export type ThemeName = 'dark' | 'light'

const KEY = 'forge.theme'

function readTheme(): ThemeName {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* storage unavailable */
  }
  return 'dark'
}

function apply(theme: ThemeName) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b0d10' : '#f6f7f9')
}

export const useTheme = create<{ theme: ThemeName; setTheme: (t: ThemeName) => void }>((set) => ({
  theme: typeof document === 'undefined' ? 'dark' : readTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* ignore */
    }
    apply(theme)
    set({ theme })
  },
}))

export function initTheme() {
  apply(useTheme.getState().theme)
}

export function usePalette(): Palette {
  return useTheme((s) => s.theme) === 'light' ? LIGHT_PALETTE : DARK_PALETTE
}
