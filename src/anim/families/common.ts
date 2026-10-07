import { GROUND, L, STAND_HIP_Y, solvePose } from '../rig'
import { add, angleOf, bump, clamp, dir, dist, ease, lerp, lerpV, polar, scale, seg, smooth, sub } from '../math'
import type { EaseName, LimbSpec, Motion, Phase, Pose, PropSpec, Vec, View } from '../types'

export { GROUND, L, STAND_HIP_Y }

/** Ankle height with the foot flat on the floor. */
export const AY = GROUND - L.ankleH
/** Hand (wrist) height when the palm is on the floor. */
export const HY = GROUND - 3
/** Height of a chair seat surface. */
export const SEAT_Y = GROUND - 42
/** Height of a table top. */
export const TABLE_Y = GROUND - 68

export const ik = (x: number, y: number, bend: 1 | -1 = 1): LimbSpec => ({ ik: [x, y], bend })
export const fk = (upper: number, lower: number): LimbSpec => ({ fk: [upper, lower] })

/** Arms hanging relaxed at the sides (side view). */
export const ARMS_HANG = { armN: fk(93, 91), armF: fk(97, 94) }

/** Feet planted (side view), knees bending forward. */
export function feet(xN: number, xF = xN - 3, y = AY): Pick<Pose, 'legN' | 'legF'> {
  return { legN: ik(xN, y, 1), legF: ik(xF, y, 1) }
}

/** A relaxed standing pose facing +x (side view). */
export function standPose(x = 120, over: Partial<Pose> = {}): Pose {
  return {
    root: [x, STAND_HIP_Y + 1.2],
    torso: -89,
    ...ARMS_HANG,
    ...feet(x + 2, x - 1),
    ...over,
  }
}

/** Local torso frame helpers: `up` runs hip→shoulder, `fwd` points to the chest side. */
export function torsoFrame(pose: Pick<Pose, 'root' | 'torso'>) {
  const up = dir(pose.torso)
  const fwd = dir(pose.torso + 90)
  const shoulder = polar(pose.root, pose.torso, L.torso)
  const at = (base: Vec, f: number, u: number): Vec => add(add(base, scale(fwd, f)), scale(up, u))
  return { up, fwd, shoulder, at }
}

/** Pull a target back within `maxLen` of `base` (a foot or hand in mid-air while stepping). */
export function withinReach(base: Vec, target: Vec, maxLen: number): Vec {
  const d = dist(base, target)
  if (d <= maxLen) return target
  return [base[0] + ((target[0] - base[0]) * maxLen) / d, base[1] + ((target[1] - base[1]) * maxLen) / d]
}

/** Bisection on a monotone-ish scalar function. Returns x in [lo, hi] where f(x) ≈ 0. */
export function solve1D(f: (x: number) => number, lo: number, hi: number, iters = 40): number {
  let a = lo
  let b = hi
  let fa = f(a)
  for (let i = 0; i < iters; i++) {
    const m = (a + b) / 2
    const fm = f(m)
    if ((fa <= 0 && fm <= 0) || (fa > 0 && fm > 0)) {
      a = m
      fa = fm
    } else {
      b = m
    }
  }
  return (a + b) / 2
}

/** Point on a rigid body line of length `len` from pivot `p`, rising at `beta` degrees above horizontal toward +x. */
export const bodyPoint = (p: Vec, len: number, beta: number, toward: 1 | -1 = 1): Vec => [
  p[0] + toward * len * Math.cos((beta * Math.PI) / 180),
  p[1] - len * Math.sin((beta * Math.PI) / 180),
]

// ---- Pose interpolation (for composite / key-pose motions) -----------------------

/** Convert every limb to IK form (positions), keeping the joint on the same side. */
export function toIK(pose: Pose, view: View): Pose {
  const s = solvePose(pose, view)
  const bendOf = (base: Vec, joint: Vec, end: Vec): 1 | -1 => {
    // Which side of base→end is the joint on? Match solveTwoBone's convention.
    const cross = (end[0] - base[0]) * (joint[1] - base[1]) - (end[1] - base[1]) * (joint[0] - base[0])
    return cross < 0 ? 1 : -1
  }
  const conv = (spec: LimbSpec, base: Vec, joint: Vec, end: Vec): LimbSpec =>
    'ik' in spec ? spec : { ik: end, bend: bendOf(base, joint, end) }
  return {
    ...pose,
    armN: conv(pose.armN, s.shoulderN, s.elbowN, s.wristN),
    armF: conv(pose.armF, s.shoulderF, s.elbowF, s.wristF),
    legN: conv(pose.legN, s.hipN, s.kneeN, s.ankleN),
    legF: conv(pose.legF, s.hipF, s.kneeF, s.ankleF),
  }
}

function lerpLimb(a: LimbSpec, b: LimbSpec, t: number): LimbSpec {
  if ('fk' in a && 'fk' in b) return { fk: [lerp(a.fk[0], b.fk[0], t), lerp(a.fk[1], b.fk[1], t)] }
  if ('ik' in a && 'ik' in b) return { ik: lerpV(a.ik, b.ik, t), bend: t < 0.5 ? a.bend : b.bend }
  return t < 0.5 ? a : b
}

const lerpOpt = (a: number | undefined, b: number | undefined, t: number, d = 0) => lerp(a ?? d, b ?? d, t)

/** Interpolate two poses. Both must use the same limb modes (convert with `toIK` first if needed). */
export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    root: lerpV(a.root, b.root, t),
    torso: lerp(a.torso, b.torso, t),
    head: lerp(a.head ?? a.torso, b.head ?? b.torso, t),
    spine: lerpOpt(a.spine, b.spine, t),
    shoulderLift: lerpOpt(a.shoulderLift, b.shoulderLift, t),
    pelvis: a.pelvis === undefined && b.pelvis === undefined ? undefined : lerp(a.pelvis ?? a.torso, b.pelvis ?? b.torso, t),
    armN: lerpLimb(a.armN, b.armN, t),
    armF: lerpLimb(a.armF, b.armF, t),
    legN: lerpLimb(a.legN, b.legN, t),
    legF: lerpLimb(a.legF, b.legF, t),
    footN: lerpOpt(a.footN, b.footN, t),
    footF: lerpOpt(a.footF, b.footF, t),
    dbN: t < 0.5 ? a.dbN : b.dbN,
    dbF: t < 0.5 ? a.dbF : b.dbF,
    dbBoth: t < 0.5 ? a.dbBoth : b.dbBoth,
  }
}

export interface KeyPose {
  pose: Pose
  /** Easing used when moving *into* this key from the previous one. */
  ease?: EaseName
}

/**
 * Motion built from key poses spread evenly over u ∈ [0, 1]. Limbs are converted to IK so
 * transitions between planted and swinging limbs interpolate positions (no sliding).
 */
export function keyPoseFn(keys: KeyPose[], view: View, convert = true): (u: number) => Pose {
  const ks = keys.map((k) => ({ ...k, pose: convert ? toIK(k.pose, view) : k.pose }))
  const n = ks.length - 1
  return (u: number) => {
    const x = clamp(u, 0, 1) * n
    const i = Math.min(n - 1, Math.floor(x))
    const t = x - i
    return lerpPose(ks[i].pose, ks[i + 1].pose, ease(ks[i + 1].ease ?? 'inOut', t))
  }
}

/** Phases that walk u through `n` evenly spaced key poses with the given segment durations. */
export function keyPhases(durations: number[], labels?: (Phase['label'] | undefined)[], holds?: number[]): Phase[] {
  const n = durations.length
  const out: Phase[] = []
  durations.forEach((d, i) => {
    out.push({ to: (i + 1) / n, dur: d, label: labels?.[i], ease: 'linear' })
    if (holds?.[i]) out.push({ dur: holds[i], label: 'hold' })
  })
  return out
}

export function motion(view: View, pose: (u: number, side: 0 | 1) => Pose, phases: Phase[], extra: Partial<Motion> = {}): Motion {
  return { view, pose, phases, ...extra }
}

export function withProps(m: Motion, props: PropSpec[]): Motion {
  return { ...m, props: [...(m.props ?? []), ...props] }
}

export { add, angleOf, bump, clamp, dir, dist, ease, lerp, lerpV, polar, scale, seg, smooth, sub }
