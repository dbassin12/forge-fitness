import { ease, lerp } from './math'
import type { Motion, PhaseLabel, Pose } from './types'

export interface MotionSample {
  u: number
  side: 0 | 1
  cycle: number
  phaseIndex: number
  label?: PhaseLabel
  /** Progress through the current phase, 0..1. */
  phaseProgress: number
  cycleTime: number
  cycleDuration: number
}

export function cycleDuration(m: Motion): number {
  return m.phases.reduce((sum, p) => sum + p.dur, 0)
}

/** Deterministic sample of a motion at time t (seconds at 1× speed). */
export function sampleMotion(m: Motion, t: number): MotionSample {
  const D = Math.max(0.001, cycleDuration(m))
  const tt = Math.max(0, t)
  const cycle = Math.floor(tt / D)
  let local = tt - cycle * D
  let u = m.start ?? 0
  const side: 0 | 1 = m.alternate ? ((cycle % 2) as 0 | 1) : 0
  for (let i = 0; i < m.phases.length; i++) {
    const p = m.phases[i]
    const last = i === m.phases.length - 1
    if (local <= p.dur || last) {
      const k = p.dur > 0 ? Math.min(1, local / p.dur) : 1
      const to = p.to ?? u
      return {
        u: lerp(u, to, ease(p.ease, k)),
        side,
        cycle,
        phaseIndex: i,
        label: p.label,
        phaseProgress: k,
        cycleTime: tt - cycle * D,
        cycleDuration: D,
      }
    }
    local -= p.dur
    if (p.to !== undefined) u = p.to
  }
  // Unreachable, but keeps TypeScript happy.
  return { u, side, cycle, phaseIndex: 0, phaseProgress: 0, cycleTime: 0, cycleDuration: D }
}

export function poseAt(m: Motion, t: number): Pose {
  const s = sampleMotion(m, t)
  return m.pose(s.u, s.side)
}

/** Standard rep: move to 1 (eccentric), pause, back to 0 (concentric), pause. */
export function repPhases(down = 1.6, bottom = 0.3, up = 1.1, top = 0.4, labels: [PhaseLabel, PhaseLabel] = ['down', 'up']) {
  return [
    { to: 1, dur: down, label: labels[0], ease: 'inOut' as const },
    { dur: bottom, label: 'hold' as const },
    { to: 0, dur: up, label: labels[1], ease: 'inOut' as const },
    { dur: top, label: 'rest' as const },
  ]
}

/** Isometric hold: a gentle "breathing" oscillation around u = 0.5. */
export function holdPhases(breath = 3.6) {
  return [
    { to: 1, dur: breath / 2, label: 'hold' as const, ease: 'inOut' as const },
    { to: 0, dur: breath / 2, label: 'hold' as const, ease: 'inOut' as const },
  ]
}

/** Continuous cyclic motion (u sweeps 0→1 linearly once per cycle). */
export function loopPhases(period = 1.2, label: PhaseLabel = 'up') {
  return [{ to: 1, dur: period, label, ease: 'linear' as const }]
}
