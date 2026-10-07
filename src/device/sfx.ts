import { usePrefs } from '@/app/prefs'
import { context } from '@/voice/beeps'

/**
 * Little synthesized sound effects for wins. Generated with Web Audio (no audio files), quiet, and
 * off when the user turns "Sound effects" off. Call `unlockAudio()` from a tap first on iOS.
 */

type Wave = OscillatorType

function tone(c: AudioContext, at: number, freq: number, dur: number, gain: number, type: Wave = 'triangle', toFreq?: number) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, at)
  if (toFreq) osc.frequency.exponentialRampToValueAtTime(toFreq, at + dur)
  g.gain.setValueAtTime(0, at)
  g.gain.linearRampToValueAtTime(gain, at + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(g).connect(c.destination)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

function noise(c: AudioContext, at: number, dur: number, gain: number, from: number, to: number) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(from, at)
  bp.frequency.exponentialRampToValueAtTime(to, at + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(gain, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(at)
}

function play(fn: (c: AudioContext, t: number) => void) {
  if (!usePrefs.getState().sounds) return
  const c = context()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  try {
    fn(c, c.currentTime + 0.01)
  } catch {
    /* audio graph errors are never worth surfacing */
  }
}

export const sfx = {
  /** Soft positive pop (logged something). */
  pop: () => play((c, t) => tone(c, t, 520, 0.12, 0.12, 'sine', 1180)),
  /** Water glass: a little bloop. */
  bloop: () =>
    play((c, t) => {
      tone(c, t, 280, 0.16, 0.14, 'sine', 820)
      tone(c, t + 0.07, 640, 0.12, 0.06, 'sine', 1300)
    }),
  /** XP coin. */
  coin: () =>
    play((c, t) => {
      tone(c, t, 988, 0.08, 0.07, 'square')
      tone(c, t + 0.07, 1319, 0.22, 0.07, 'square')
    }),
  /** A set or quest done: quick major arpeggio. */
  success: () =>
    play((c, t) => {
      ;[1047, 1319, 1568].forEach((f, i) => tone(c, t + i * 0.075, f, 0.22, 0.09))
    }),
  /** Level up: rising fanfare and a held chord. */
  levelUp: () =>
    play((c, t) => {
      ;[784, 1047, 1319, 1568].forEach((f, i) => tone(c, t + i * 0.09, f, 0.18, 0.09, 'square'))
      ;[1047, 1319, 1568, 2093].forEach((f) => tone(c, t + 0.4, f, 0.9, 0.05, 'triangle'))
    }),
  /** Achievement badge: sparkle. */
  sparkle: () =>
    play((c, t) => {
      ;[1568, 2093, 2637, 3136].forEach((f, i) => tone(c, t + i * 0.05, f, 0.25, 0.05, 'sine'))
    }),
  /** Card flip / wheel start. */
  whoosh: () => play((c, t) => noise(c, t, 0.28, 0.25, 400, 3200)),
  /** Wheel ratchet click. */
  click: () => play((c, t) => tone(c, t, 2200, 0.025, 0.05, 'square')),
  /** Drum hit for "GO". */
  thump: () =>
    play((c, t) => {
      tone(c, t, 160, 0.22, 0.35, 'sine', 50)
      noise(c, t, 0.08, 0.12, 2000, 800)
    }),
}
