import { useVoiceSettings } from './settings'

let ctx: AudioContext | null = null

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } }

/** The shared Web Audio context (one per page; iOS allows only a few). */
export function context(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

/** Call from a user gesture (iOS will not play audio otherwise). */
export function unlockAudio(): void {
  const nav = navigator as AudioSessionNavigator
  if (nav.audioSession) {
    try {
      nav.audioSession.type = useVoiceSettings.getState().mixWithMusic ? 'ambient' : 'playback'
    } catch {
      /* not supported */
    }
  }
  const c = context()
  if (c && c.state === 'suspended') void c.resume()
}

export function beep(freq = 880, ms = 120, gain = 0.18): void {
  if (!useVoiceSettings.getState().beeps) return
  const c = context()
  if (!c) return
  const t0 = c.currentTime + 0.01
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + ms / 1000 + 0.05)
}

export const tick = () => beep(880, 110)
export const go = () => beep(1320, 320, 0.22)
export function chime() {
  beep(988, 140)
  setTimeout(() => beep(1319, 220), 150)
}
