import { registerSW } from 'virtual:pwa-register'
import { create } from 'zustand'

interface PwaState {
  needRefresh: boolean
  offlineReady: boolean
  update: () => void
  dismiss: () => void
}

let updateSW: ((reload?: boolean) => Promise<void>) | undefined

export const usePwa = create<PwaState>((set) => ({
  needRefresh: false,
  offlineReady: false,
  update: () => {
    void updateSW?.(true)
  },
  dismiss: () => set({ needRefresh: false, offlineReady: false }),
}))

export function initPwa() {
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
