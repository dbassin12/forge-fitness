export type Vec = readonly [number, number]

/**
 * A limb is posed either by inverse kinematics (where the hand/foot should be, plus which
 * way the elbow/knee bends) or by forward kinematics (absolute world angles, in degrees,
 * of the upper and lower segment). Angles use SVG screen space: 0° = +x (right),
 * 90° = down, 180° = left, -90° = up.
 */
export type LimbSpec = { ik: Vec; bend: 1 | -1 } | { fk: readonly [number, number] }

export type View = 'side' | 'front' | 'top'

export type DumbbellMode = 'end' | 'vertical' | 'horizontal'

export interface Pose {
  /** Pelvis (hip joint centre). */
  root: Vec
  /** World angle of the hip → shoulder vector. -90 = upright. */
  torso: number
  /** World angle of the neck → head vector. Defaults to the torso angle. */
  head?: number
  /** Spine curvature: + rounds the back (cat, crunch), − arches it (cow, cobra). */
  spine?: number
  /** Extra shoulder elevation along the torso (shrugs). */
  shoulderLift?: number
  /** Side view: near/far limbs. Front/top view: screen-left/screen-right limbs. */
  armN: LimbSpec
  armF: LimbSpec
  legN: LimbSpec
  legF: LimbSpec
  /** World angle of each foot (ankle → toes). Defaults to flat, toes pointing forward. */
  footN?: number
  footF?: number
  /** Dumbbells held in each hand, and how they're drawn. */
  dbN?: DumbbellMode | null
  dbF?: DumbbellMode | null
  /** One dumbbell held in both hands (goblet, swing, overhead extension). */
  dbBoth?: DumbbellMode | null
}

/** Solved joint positions. */
export interface Skeleton {
  view: View
  hip: Vec
  hipN: Vec
  hipF: Vec
  shoulder: Vec
  shoulderN: Vec
  shoulderF: Vec
  /** Mid-spine control point for the curved torso. */
  spineCtrl: Vec
  neck: Vec
  head: Vec
  headAngle: number
  torsoAngle: number
  elbowN: Vec
  wristN: Vec
  handN: Vec
  elbowF: Vec
  wristF: Vec
  handF: Vec
  kneeN: Vec
  ankleN: Vec
  toeN: Vec
  heelN: Vec
  kneeF: Vec
  ankleF: Vec
  toeF: Vec
  heelF: Vec
  /** True when every IK target was reachable (contacts are exactly where requested). */
  reachable: boolean
}

export type PropSpec =
  | { kind: 'chair'; x: number; facing?: 1 | -1 }
  | { kind: 'bench'; x: number; width?: number; height?: number }
  | { kind: 'wall'; x: number }
  | { kind: 'table'; x: number; width?: number }
  | { kind: 'step'; x: number; width?: number; height?: number }
  | { kind: 'mat'; x: number; width?: number }
  | { kind: 'bar'; x: number; y: number }

export type PhaseLabel = 'down' | 'up' | 'hold' | 'out' | 'in' | 'reach' | 'rest' | 'jump' | 'switch'

export interface Phase {
  /** Move u to this value… */
  to?: number
  /** …over this many seconds (at 1× speed). A phase without `to` is a hold. */
  dur: number
  label?: PhaseLabel
  ease?: EaseName
}

export type EaseName = 'linear' | 'inOut' | 'in' | 'out' | 'outBack'

export interface Motion {
  view: View
  /** Pose for progress u ∈ [0, 1] through the movement; `side` alternates 0/1 for unilateral moves. */
  pose: (u: number, side: 0 | 1) => Pose
  /** One repetition (one full cycle) as a sequence of phases, starting from u = phases' implied start. */
  phases: Phase[]
  /** u at the start of the cycle (default 0). */
  start?: number
  /** Alternate side each cycle. */
  alternate?: boolean
  props?: PropSpec[]
  /** Draw a floor line (default true for side/front). */
  floor?: boolean
}
