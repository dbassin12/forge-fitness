import { registerSW } from 'virtual:pwa-register'
import { create } from 'zustand'

/** Chrome/Android's install prompt (not in the TS DOM lib). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PwaState {
  needRefresh: boolean
  offlineReady: boolean
  /** Captured `beforeinstallprompt` (Android/desktop Chrome) — null when unavailable. */
  installPrompt: BeforeInstallPromptEvent | null
  installed: boolean
  update: () => void
  dismiss: () => void
  promptInstall: () => Promise<boolean>
}

let updateSW: ((reload?: boolean) => Promise<void>) | undefined

export const usePwa = create<PwaState>((set, get) => ({
  needRefresh: false,
  offlineReady: false,
  installPrompt: null,
  installed: false,
  update: () => {
    void updateSW?.(true)
  },
  dismiss: () => set({ needRefresh: false, offlineReady: false }),
  promptInstall: async () => {
    const e = get().installPrompt
    if (!e) return false
    await e.prompt()
    const { outcome } = await e.userChoice
    set({ installPrompt: null, installed: outcome === 'accepted' })
    return outcome === 'accepted'
  },
}))

export function initPwa() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    usePwa.setState({ installPrompt: e as BeforeInstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => usePwa.setState({ installPrompt: null, installed: true }))
  if (!('serviceWorker' in navigator)) return
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      usePwa.setState({ needRefresh: true })
    },
    onOfflineReady() {
      usePwa.setState({ offlineReady: true })
      setTimeout(() => usePwa.setState({ offlineReady: false }), 4000)
    },
    onRegisteredSW(_url, registration) {
      // Check for app updates every hour while open.
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })
}

/** True when running as an installed (home-screen) app. */
export function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function isIOS(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}
