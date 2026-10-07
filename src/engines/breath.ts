/**
 * Bloom's breathing practices: paced patterns (in, hold, out) drawn as a growing and shrinking
 * orb, and voice-guided relaxations. Pure logic; the screens live in features/breathe.
 */

export type BreathPhaseKind = 'in' | 'holdIn' | 'out' | 'holdOut'

export interface BreathPhase {
  kind: BreathPhaseKind
  sec: number
}

export interface BreathPattern {
  id: string
  name: string
  /** What it's good for, in a few words. */
  purpose: string
  emoji: string
  phases: BreathPhase[]
  /** Minutes offered, and the one picked by default. */
  minutes: number[]
  defaultMinutes: number
  /** Spoken once at the start (plain words: no digits or symbols). */
  intro: string
  /** Shown on the card, e.g. "In 4 · Out 6". */
  rhythm: string
}

const rhythm = (phases: BreathPhase[]) =>
  phases.map((p) => `${p.kind === 'in' ? 'In' : p.kind === 'out' ? 'Out' : 'Hold'} ${p.sec}`).join(' · ')

const pattern = (p: Omit<BreathPattern, 'rhythm'>): BreathPattern => ({ ...p, rhythm: rhythm(p.phases) })

export const BREATHS: BreathPattern[] = [
  pattern({
    id: 'calm',
    name: 'Calm breath',
    purpose: 'Slow down and settle',
    emoji: '🌿',
    phases: [
      { kind: 'in', sec: 4 },
      { kind: 'out', sec: 6 },
    ],
    minutes: [1, 3, 5, 10],
    defaultMinutes: 3,
    intro: 'Sit or lie comfortably. Breathe in gently through your nose, and let each breath out be a little longer and softer.',
  }),
  pattern({
    id: 'box',
    name: 'Box breathing',
    purpose: 'Steady focus',
    emoji: '🟪',
    phases: [
      { kind: 'in', sec: 4 },
      { kind: 'holdIn', sec: 4 },
      { kind: 'out', sec: 4 },
      { kind: 'holdOut', sec: 4 },
    ],
    minutes: [2, 4, 6],
    defaultMinutes: 4,
    intro: 'Breathe in, hold, breathe out and hold, each for a slow count of four, like tracing the sides of a box.',
  }),
  pattern({
    id: 'sleep',
    name: '4-7-8 for sleep',
    purpose: 'Wind down for bed',
    emoji: '🌙',
    phases: [
      { kind: 'in', sec: 4 },
      { kind: 'holdIn', sec: 7 },
      { kind: 'out', sec: 8 },
    ],
    minutes: [1, 2, 4],
    defaultMinutes: 2,
    intro: 'Breathe in quietly through your nose, hold gently, then breathe out slowly through your mouth with a soft whoosh. If the hold feels like too much, just shorten it.',
  }),
  pattern({
    id: 'coherent',
    name: 'Balanced breath',
    purpose: 'Calm, even energy',
    emoji: '🌊',
    phases: [
      { kind: 'in', sec: 5 },
      { kind: 'out', sec: 5 },
    ],
    minutes: [3, 5, 10],
    defaultMinutes: 5,
    intro: 'Breathe in and out at an easy, even pace, like gentle waves rolling in and out.',
  }),
  pattern({
    id: 'sigh',
    name: 'Sighing breath',
    purpose: 'Let go of tension fast',
    emoji: '🫧',
    phases: [
      { kind: 'in', sec: 3 },
      { kind: 'holdIn', sec: 1 },
      { kind: 'out', sec: 7 },
    ],
    minutes: [1, 2, 3],
    defaultMinutes: 1,
    intro: 'Take a deep breath in through your nose, sip in a little more at the top, then let it all go with a long, slow sigh.',
  }),
]

export function getBreath(id: string): BreathPattern | undefined {
  return BREATHS.find((b) => b.id === id)
}

export const cycleSec = (p: Pick<BreathPattern, 'phases'>) => p.phases.reduce((s, x) => s + x.sec, 0)

/** Whole breaths that fit the minutes (at least one). */
export function cyclesFor(p: Pick<BreathPattern, 'phases'>, minutes: number): number {
  return Math.max(1, Math.round((minutes * 60) / cycleSec(p)))
}

export interface BreathMoment {
  cycle: number
  phaseIndex: number
  phase: BreathPhase
  /** Seconds into the current phase, and what's left of it. */
  inPhase: number
  phaseLeft: number
  /** Orb size: 0 = fully out, 1 = fully in. */
  fill: number
  done: boolean
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Where a breathing session is at `t` seconds. */
export function breathAt(p: Pick<BreathPattern, 'phases'>, cycles: number, t: number): BreathMoment {
  const total = cycleSec(p) * cycles
  const done = t >= total
  const tt = Math.max(0, Math.min(t, total - 1e-6))
  const cycle = Math.floor(tt / cycleSec(p))
  let local = tt - cycle * cycleSec(p)
  let phaseIndex = 0
  while (phaseIndex < p.phases.length - 1 && local >= p.phases[phaseIndex].sec) {
    local -= p.phases[phaseIndex].sec
    phaseIndex++
  }
  const phase = p.phases[phaseIndex]
  const k = Math.min(1, local / phase.sec)
  const fill = phase.kind === 'in' ? smooth(k) : phase.kind === 'out' ? 1 - smooth(k) : phase.kind === 'holdIn' ? 1 : 0
  return { cycle, phaseIndex, phase, inPhase: local, phaseLeft: phase.sec - local, fill: done ? 0 : fill, done }
}

export const PHASE_WORD: Record<BreathPhaseKind, string> = { in: 'Breathe in', holdIn: 'Hold', out: 'Breathe out', holdOut: 'Hold' }

// ---- Guided relaxations -------------------------------------------------------------------------

export interface GuidedLine {
  /** Seconds from the start. */
  at: number
  text: string
}

export interface Relaxation {
  id: string
  name: string
  purpose: string
  emoji: string
  minutes: number
  lines: GuidedLine[]
}

export const RELAXATIONS: Relaxation[] = [
  {
    id: 'body-scan',
    name: 'Body scan',
    purpose: 'Release tension, head to toe',
    emoji: '🌸',
    minutes: 5,
    lines: [
      { at: 0, text: 'Lie down or sit comfortably, and let your eyes close.' },
      { at: 10, text: 'Take a slow breath in, and let it go with a soft sigh.' },
      { at: 22, text: 'Bring your attention to your feet. Notice them, and let them soften.' },
      { at: 45, text: 'Let the softness travel up into your calves and your knees.' },
      { at: 70, text: 'Now your thighs and your hips. Let them grow heavy.' },
      { at: 95, text: 'Notice your belly rising and falling with each breath. Nothing to change.' },
      { at: 125, text: 'Let your lower back melt down, and your upper back widen.' },
      { at: 150, text: 'Relax your shoulders away from your ears. Let your arms and hands be heavy.' },
      { at: 180, text: 'Soften your jaw, your cheeks, and the space between your eyebrows.' },
      { at: 210, text: 'Feel your whole body, resting and supported.' },
      { at: 240, text: 'Stay here for a few more breaths, simply resting.' },
      { at: 280, text: 'Gently wiggle your fingers and toes. When you are ready, open your eyes.' },
    ],
  },
  {
    id: 'bedtime',
    name: 'Bedtime wind-down',
    purpose: 'Settle into sleep',
    emoji: '🌙',
    minutes: 6,
    lines: [
      { at: 0, text: 'Get cosy in bed, and let the day begin to fall away.' },
      { at: 12, text: 'Breathe in slowly, and breathe out even more slowly.' },
      { at: 30, text: 'With each breath out, let your body sink a little deeper into the bed.' },
      { at: 60, text: 'Think of one small thing from today that you are grateful for.' },
      { at: 95, text: 'Let any plans for tomorrow wait until tomorrow. Right now you are resting.' },
      { at: 130, text: 'Let your face soften, your shoulders soften, and your hands rest open.' },
      { at: 170, text: 'Breathe in for four, and out for six. Slowly. Gently.' },
      { at: 215, text: 'If your mind wanders, that is fine. Simply come back to the breath.' },
      { at: 260, text: 'Each breath out is an invitation to let go a little more.' },
      { at: 310, text: 'Stay with this easy rhythm, and let sleep come when it is ready.' },
      { at: 350, text: 'Good night.' },
    ],
  },
]

export function getRelaxation(id: string): Relaxation | undefined {
  return RELAXATIONS.find((r) => r.id === id)
}

/** XP for a mindful session: a little for showing up, a little per minute. */
export function breathXp(minutes: number): number {
  return 10 + Math.round(Math.max(0, minutes)) * 2
}
