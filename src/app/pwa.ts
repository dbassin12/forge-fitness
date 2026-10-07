import { create } from 'zustand'
import { APP } from './brand'

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
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return
  updateSW = registerAppSW({
    onNeedRefresh() {
      usePwa.setState({ needRefresh: true })
    },
    onOfflineReady() {
      usePwa.setState({ offlineReady: true })
      setTimeout(() => usePwa.setState({ offlineReady: false }), 4000)
    },
    onRegistered(registration) {
      // Check for app updates every hour while open.
      setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })
}

/**
 * The "prompt for update" flow of vite-plugin-pwa's registerSW, with one difference: the scope is
 * the app's own folder. Forge registers /sw.js for `/` and Bloom for `/bloom/`, so on a phone that
 * has both, each keeps its own offline copy and its own notifications.
 */
function registerAppSW(o: { onNeedRefresh: () => void; onOfflineReady: () => void; onRegistered: (r: ServiceWorkerRegistration) => void }) {
  let skipWaiting: (() => void) | undefined
  const ready = import('workbox-window')
    .then(({ Workbox }) => {
      const wb = new Workbox('/sw.js', { scope: APP.base, type: 'classic' })
      skipWaiting = () => wb.messageSkipWaiting()
      let prompted = false
      const prompt = () => {
        prompted = true
        // Once the new worker takes over, reload into the new version.
        wb.addEventListener('controlling', (e) => {
          if (e.isUpdate) window.location.reload()
        })
        o.onNeedRefresh()
      }
      wb.addEventListener('installed', (e) => {
        if (e.isUpdate === undefined) {
          if (e.isExternal) prompt()
          else if (!prompted) o.onOfflineReady()
        } else if (!e.isUpdate) o.onOfflineReady()
      })
      wb.addEventListener('waiting', prompt)
      return wb.register({ immediate: true }).then((r) => {
        if (r) o.onRegistered(r)
      })
    })
    .catch(() => undefined)
  return async () => {
    await ready
    skipWaiting?.()
  }
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
