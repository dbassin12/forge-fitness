import { create } from 'zustand'
import { isBloom, storageKey } from '@/app/brand'

export interface VoiceSettings {
  /** Spoken coaching on/off (captions always show). */
  enabled: boolean
  voiceURI?: string
  rate: number
  pitch: number
  volume: number
  /** Countdown beeps and chimes. */
  beeps: boolean
  /** Count reps out loud in tempo. */
  countReps: boolean
  /** Let sounds mix with music (true) or take over audio (false). Safari only. */
  mixWithMusic: boolean
  /**
   * Explain how to do each exercise before its first set: in full while it's new to you (then a
   * short reminder), in full every time, or not at all (just its name).
   */
  explain: ExplainMode
}

export type ExplainMode = 'new' | 'always' | 'off'

const KEY = storageKey('voice')

// Bloom's coach speaks a little slower: yoga cues land better unhurried.
const DEFAULTS: VoiceSettings = { enabled: true, rate: isBloom ? 0.9 : 1, pitch: 1, volume: 1, beeps: true, countReps: true, mixWithMusic: true, explain: 'new' }

function load(): VoiceSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<VoiceSettings>) }
  } catch {
    /* ignore */
  }
  return DEFAULTS
}

export const useVoiceSettings = create<VoiceSettings & { update: (p: Partial<VoiceSettings>) => void }>((set, get) => ({
  ...(typeof localStorage === 'undefined' ? DEFAULTS : load()),
  update: (p) => {
    set(p)
    const { update: _u, ...rest } = get()
    void _u
    try {
      localStorage.setItem(KEY, JSON.stringify(rest))
    } catch {
      /* ignore */
    }
  },
}))
