import { create } from 'zustand'
import { BLOOM_DARK_PALETTE, BLOOM_LIGHT_PALETTE, DARK_PALETTE, LIGHT_PALETTE, type Palette } from '@/anim/draw'
import { APP, isBloom, storageKey } from './brand'

export type ThemeName = 'dark' | 'light'
/** What the user picked: a fixed theme, or follow the phone's setting. */
export type ThemeMode = ThemeName | 'auto'
export type ForgeAccent = 'ember' | 'ocean' | 'lime' | 'violet' | 'rose' | 'gold'
export type BloomAccent = 'lotus' | 'sage' | 'lavender' | 'lagoon' | 'clay' | 'honey'
export type Accent = ForgeAccent | BloomAccent

export interface AccentInfo {
  id: Accent
  name: string
  /** Accent on the dark and the light background (also used for the mannequin's working muscles). */
  dark: string
  dark2: string
  light: string
  light2: string
  /** Level that unlocks it (1 = always available). */
  unlockLevel: number
}

const FORGE_ACCENTS: AccentInfo[] = [
  { id: 'ember', name: 'Ember', dark: '#ff6a3d', dark2: '#ff8f5e', light: '#f0532a', light2: '#ff7a47', unlockLevel: 1 },
  { id: 'ocean', name: 'Ocean', dark: '#38bdf8', dark2: '#7dd3fc', light: '#0284c7', light2: '#0ea5e9', unlockLevel: 1 },
  { id: 'lime', name: 'Lime', dark: '#a3e635', dark2: '#bef264', light: '#4d7c0f', light2: '#65a30d', unlockLevel: 1 },
  { id: 'violet', name: 'Violet', dark: '#a78bfa', dark2: '#c4b5fd', light: '#7c3aed', light2: '#8b5cf6', unlockLevel: 3 },
  { id: 'rose', name: 'Rose', dark: '#fb7185', dark2: '#fda4af', light: '#e11d48', light2: '#f43f5e', unlockLevel: 5 },
  { id: 'gold', name: 'Gold', dark: '#fbbf24', dark2: '#fcd34d', light: '#b45309', light2: '#d97706', unlockLevel: 8 },
]

/** Bloom's softer colors (each one keeps 5:1+ contrast for text on its background). */
const BLOOM_ACCENTS: AccentInfo[] = [
  { id: 'lotus', name: 'Lotus', dark: '#f2a0c0', dark2: '#f7c1d6', light: '#b03a68', light2: '#c9567f', unlockLevel: 1 },
  { id: 'sage', name: 'Sage', dark: '#9fd3b2', dark2: '#c2e5cf', light: '#3f7556', light2: '#55906d', unlockLevel: 1 },
  { id: 'lavender', name: 'Lavender', dark: '#c3b2f5', dark2: '#dcd1fa', light: '#6d4fc4', light2: '#8468d6', unlockLevel: 1 },
  { id: 'lagoon', name: 'Lagoon', dark: '#7fd0e0', dark2: '#b2e4ee', light: '#1d6f83', light2: '#2b8aa0', unlockLevel: 3 },
  { id: 'clay', name: 'Clay', dark: '#f2aa86', dark2: '#f7c9b1', light: '#a8502c', light2: '#c26a43', unlockLevel: 5 },
  { id: 'honey', name: 'Honey', dark: '#f0c776', dark2: '#f6dca6', light: '#8a6110', light2: '#a87a1f', unlockLevel: 8 },
]

/** The accent colors this app offers. */
export const ACCENTS: AccentInfo[] = isBloom ? BLOOM_ACCENTS : FORGE_ACCENTS

export function accentInfo(id: Accent): AccentInfo {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0]
}

const KEY = storageKey('theme')
const ACCENT_KEY = storageKey('accent')

/** Forge starts dark and fiery; Bloom follows the phone (light by day, dusk-dark at night). */
const DEFAULT_MODE: ThemeMode = isBloom ? 'auto' : 'dark'
const DEFAULT_ACCENT: Accent = ACCENTS[0].id

/** Status-bar / browser chrome color for each theme (matches --color-bg). */
const CHROME: Record<ThemeName, string> = isBloom ? { dark: '#141118', light: '#faf6f2' } : { dark: '#0b0d10', light: '#f6f7f9' }

function read<T extends string>(key: string, ok: readonly T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null
    if (v && ok.includes(v)) return v
  } catch {
    /* storage unavailable */
  }
  return fallback
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

const lightQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null)

function resolve(mode: ThemeMode): ThemeName {
  if (mode !== 'auto') return mode
  return lightQuery()?.matches ? 'light' : 'dark'
}

function apply(theme: ThemeName, accent: Accent) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.dataset.accent = accent
  root.dataset.app = APP.id
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CHROME[theme])
  // iPhone Home Screen apps draw white status-bar text over the page with "black-translucent";
  // in light mode ask for the default (dark text) bar, which iOS applies from the next launch.
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', theme === 'light' ? 'default' : 'black-translucent')
}

interface ThemeState {
  mode: ThemeMode
  /** The theme in effect right now (auto resolved). */
  theme: ThemeName
  accent: Accent
  setMode: (m: ThemeMode) => void
  setAccent: (a: Accent) => void
}

const initialMode = typeof document === 'undefined' ? DEFAULT_MODE : read<ThemeMode>(KEY, ['dark', 'light', 'auto'], DEFAULT_MODE)

export const useTheme = create<ThemeState>((set, get) => ({
  mode: initialMode,
  theme: typeof document === 'undefined' ? 'dark' : resolve(initialMode),
  accent: typeof document === 'undefined' ? DEFAULT_ACCENT : read<Accent>(ACCENT_KEY, ACCENTS.map((a) => a.id), DEFAULT_ACCENT),
  setMode: (mode) => {
    write(KEY, mode)
    const theme = resolve(mode)
    apply(theme, get().accent)
    set({ mode, theme })
  },
  setAccent: (accent) => {
    write(ACCENT_KEY, accent)
    apply(get().theme, accent)
    set({ accent })
  },
}))

export function initTheme() {
  const { theme, accent } = useTheme.getState()
  apply(theme, accent)
  // Follow the phone's light/dark switch while "Auto" is on.
  lightQuery()?.addEventListener?.('change', () => {
    const s = useTheme.getState()
    if (s.mode !== 'auto') return
    const theme = resolve('auto')
    apply(theme, s.accent)
    useTheme.setState({ theme })
  })
}

const palettes = new Map<string, Palette>()

export function paletteFor(theme: ThemeName, accent: Accent): Palette {
  const key = `${APP.id}:${theme}:${accent}`
  let p = palettes.get(key)
  if (!p) {
    const base = isBloom ? (theme === 'light' ? BLOOM_LIGHT_PALETTE : BLOOM_DARK_PALETTE) : theme === 'light' ? LIGHT_PALETTE : DARK_PALETTE
    const a = accentInfo(accent)
    p = accent === 'ember' ? base : { ...base, highlight: theme === 'light' ? a.light : a.dark }
    palettes.set(key, p)
  }
  return p
}

/** Mannequin colors for the current theme, with the working muscles in the accent color. */
export function usePalette(): Palette {
  const theme = useTheme((s) => s.theme)
  const accent = useTheme((s) => s.accent)
  return paletteFor(theme, accent)
}
