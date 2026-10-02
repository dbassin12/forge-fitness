import { useCaption } from './captions'
import { useVoiceSettings } from './settings'

export type SpeechPriority = 'cue' | 'count' | 'narration'

export interface SpeakOptions {
  priority?: SpeechPriority
  /** Stop whatever is being said (and queued) first. */
  interrupt?: boolean
  /** Update the on-screen caption (default true). */
  caption?: boolean
}

interface Item {
  text: string
  opts: SpeakOptions
  resolve: () => void
}

const PREFERRED = [
  'samantha', 'ava', 'allison', 'susan', 'karen', 'serena', 'daniel', 'alex', 'zoe', 'evan', 'nathan',
  'google us english', 'google uk english female', 'microsoft aria', 'microsoft jenny', 'microsoft guy', 'microsoft libby',
]

export function rankVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase()
    let s = 0
    if (v.lang.toLowerCase().startsWith('en-us')) s += 40
    else if (v.lang.toLowerCase().startsWith('en')) s += 25
    else s -= 100
    if (/(enhanced|premium|natural|neural)/.test(n)) s += 30
    const i = PREFERRED.findIndex((p) => n.includes(p))
    if (i >= 0) s += 20 - i * 0.5
    if (v.localService) s += 6
    if (/(compact|novelty|whisper|bells|bad news|boing|bubbles|cellos|zarvox|trinoids|albert|jester|organ|superstar|wobble|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy)/.test(n)) s -= 60
    return s
  }
  return [...voices].sort((a, b) => score(b) - score(a))
}

/** Estimated speaking time in ms (used when voice is off and as a watchdog). */
export function estimateMs(text: string, rate = 1): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(700, (words / 2.6) * 1000 / rate + 250)
}

/** Split long text into sentence-sized chunks (Chrome cuts off utterances after ~15 s). */
export function chunk(text: string, max = 180): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]
  const out: string[] = []
  let cur = ''
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim())
      cur = ''
    }
    cur += s
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

class SpeechEngine {
  private queue: Item[] = []
  private busy = false
  private unlocked = false
  private voices: SpeechSynthesisVoice[] = []
  private listeners = new Set<() => void>()
  private generation = 0

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  }

  init(): void {
    if (!this.supported) return
    const load = () => {
      this.voices = window.speechSynthesis.getVoices()
      this.listeners.forEach((l) => l())
    }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
  }

  onVoices(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  listVoices(): SpeechSynthesisVoice[] {
    return rankVoices(this.voices).filter((v) => v.lang.toLowerCase().startsWith('en'))
  }

  private voice(): SpeechSynthesisVoice | undefined {
    const { voiceURI } = useVoiceSettings.getState()
    if (voiceURI) {
      const v = this.voices.find((x) => x.voiceURI === voiceURI)
      if (v) return v
    }
    return rankVoices(this.voices)[0]
  }

  /** Must run inside a user gesture once (iOS Safari requirement). */
  unlock(): void {
    if (!this.supported || this.unlocked) return
    this.unlocked = true
    try {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      window.speechSynthesis.speak(u)
    } catch {
      /* ignore */
    }
  }

  cancel(): void {
    this.generation++
    const pending = this.queue.splice(0)
    pending.forEach((p) => p.resolve())
    this.busy = false
    if (this.supported) window.speechSynthesis.cancel()
  }

  speak(text: string, opts: SpeakOptions = {}): Promise<void> {
    if (opts.interrupt) this.cancel()
    return new Promise((resolve) => {
      const parts = chunk(text)
      parts.forEach((part, i) => this.queue.push({ text: part, opts, resolve: i === parts.length - 1 ? resolve : () => {} }))
      void this.pump()
    })
  }

  private async pump(): Promise<void> {
    if (this.busy) return
    const item = this.queue.shift()
    if (!item) return
    this.busy = true
    const gen = this.generation
    const settings = useVoiceSettings.getState()
    if (item.opts.caption !== false) useCaption.getState().set(item.text)
    if (!settings.enabled || !this.supported) {
      await new Promise((r) => setTimeout(r, estimateMs(item.text, settings.rate)))
    } else {
      await new Promise<void>((done) => {
        const u = new SpeechSynthesisUtterance(item.text)
        const v = this.voice()
        if (v) {
          u.voice = v
          u.lang = v.lang
        } else u.lang = 'en-US'
        u.rate = settings.rate
        u.pitch = settings.pitch
        u.volume = settings.volume
        let finished = false
        const finish = () => {
          if (finished) return
          finished = true
          clearTimeout(watchdog)
          done()
        }
        u.onend = finish
        u.onerror = finish
        const watchdog = setTimeout(finish, estimateMs(item.text, settings.rate) * 1.8 + 2500)
        window.speechSynthesis.speak(u)
      })
    }
    if (gen !== this.generation) return
    this.busy = false
    item.resolve()
    void this.pump()
  }
}

export const speech = new SpeechEngine()
