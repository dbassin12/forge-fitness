import { solveTwoBone } from './ik'
import { add, angleOf, dir, lerpV, polar, scale } from './math'
import type { LimbSpec, Pose, Skeleton, Vec, View } from './types'

/** World units: the floor is at y = GROUND; a standing figure is ~155 units tall. */
export const GROUND = 180

export const L = {
  torso: 50,
  neck: 6,
  headR: 9.5,
  upperArm: 27,
  forearm: 25,
  hand: 6,
  thigh: 40,
  shin: 38,
  foot: 14,
  heel: 4,
  /** Ankle height above the floor with the foot flat. */
  ankleH: 5,
  /** Half shoulder / hip width in front & top views. */
  shoulderHalf: 17,
  hipHalf: 9,
} as const

/** Standing hip height with straight legs and flat feet. */
export const STAND_HIP_Y = GROUND - L.ankleH - L.thigh - L.shin

export const STROKE = {
  torso: 21,
  pelvis: 17,
  neck: 7,
  upperArm: 10,
  forearm: 8.5,
  thigh: 13,
  shin: 11,
  foot: 6,
} as const

interface LimbResult {
  joint: Vec
  end: Vec
  reachable: boolean
}

function solveLimb(base: Vec, spec: LimbSpec, a: number, b: number): LimbResult {
  if ('ik' in spec) return solveTwoBone(base, spec.ik, a, b, spec.bend)
  const joint = polar(base, spec.fk[0], a)
  const end = polar(joint, spec.fk[1], b)
  return { joint, end, reachable: true }
}

function footPoints(ankle: Vec, angle: number | undefined, view: View): { toe: Vec; heel: Vec } {
  // Default: flat foot pointing forward (+x). Seen from the front the foot points at the
  // camera, so it is drawn foreshortened.
  const a = angle ?? 0
  const k = view === 'side' ? 1 : 0.42
  return { toe: polar(ankle, a, L.foot * k), heel: polar(ankle, a + 180, L.heel * k) }
}

/** Solve a pose into joint positions for the given view. */
export function solvePose(pose: Pose, view: View): Skeleton {
  const torsoDir = dir(pose.torso)
  const hip = pose.root
  const shoulder = polar(hip, pose.torso, L.torso)
  const lift = pose.shoulderLift ?? 0
  const shoulderJoint = lift ? add(shoulder, scale(torsoDir, lift)) : shoulder
  const neck = shoulder
  const headAngle = pose.head ?? pose.torso
  const head = polar(neck, headAngle, L.neck + L.headR)

  // Curved spine: control point offset perpendicular to the torso (toward the back for +spine).
  const mid = lerpV(hip, shoulder, 0.5)
  const perp = dir(pose.torso - 90)
  const spineCtrl = add(mid, scale(perp, (pose.spine ?? 0) * 2))

  let shoulderN = shoulderJoint
  let shoulderF = shoulderJoint
  let hipN = hip
  let hipF = hip
  if (view !== 'side') {
    // Screen-left / screen-right attachment points across the body.
    const across = dir(pose.torso + 90) // perpendicular to the spine
    shoulderN = add(shoulderJoint, scale(across, L.shoulderHalf))
    shoulderF = add(shoulderJoint, scale(across, -L.shoulderHalf))
    const hipAcross = pose.pelvis === undefined ? across : dir(pose.pelvis + 90)
    hipN = add(hip, scale(hipAcross, L.hipHalf))
    hipF = add(hip, scale(hipAcross, -L.hipHalf))
  }

  const armN = solveLimb(shoulderN, pose.armN, L.upperArm, L.forearm)
  const armF = solveLimb(shoulderF, pose.armF, L.upperArm, L.forearm)
  const legN = solveLimb(hipN, pose.legN, L.thigh, L.shin)
  const legF = solveLimb(hipF, pose.legF, L.thigh, L.shin)

  const handN = polar(armN.end, angleOf(armN.joint, armN.end), L.hand)
  const handF = polar(armF.end, angleOf(armF.joint, armF.end), L.hand)
  const fN = footPoints(legN.end, pose.footN, view)
  const fF = footPoints(legF.end, pose.footF, view)

  return {
    view,
    hip,
    hipN,
    hipF,
    shoulder: shoulderJoint,
    shoulderN,
    shoulderF,
    spineCtrl,
    neck,
    head,
    headAngle,
    torsoAngle: pose.torso,
    pelvisAngle: pose.pelvis ?? pose.torso,
    elbowN: armN.joint,
    wristN: armN.end,
    handN,
    elbowF: armF.joint,
    wristF: armF.end,
    handF,
    kneeN: legN.joint,
    ankleN: legN.end,
    toeN: fN.toe,
    heelN: fN.heel,
    kneeF: legF.joint,
    ankleF: legF.end,
    toeF: fF.toe,
    heelF: fF.heel,
    reachable: armN.reachable && armF.reachable && legN.reachable && legF.reachable,
  }
}
