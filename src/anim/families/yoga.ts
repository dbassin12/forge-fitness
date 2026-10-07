import { holdPhases, loopPhases, repPhases } from '../motion'
import { solvePose } from '../rig'
import type { LimbSpec, Motion, Phase, Pose, PropSpec, Vec, View } from '../types'
import {
  AY,
  GROUND,
  HY,
  L,
  STAND_HIP_Y,
  add,
  angleOf,
  clamp,
  dir,
  dist,
  ease,
  fk,
  ik,
  lerp,
  lerpPose,
  lerpV,
  motion,
  polar,
  scale,
  smooth,
  standPose,
  sub,
  toIK,
  type KeyPose,
} from './common'
import { LY, proneBase, supineBase, topBase } from './floor'

/**
 * Yoga poses and flows for Bloom. Most poses are holds: the figure settles into the shape and
 * breathes (the motion's `u` rises and falls with a slow breath). Flows (sun salutations) are key
 * poses joined by smooth transitions: arms sweep in arcs, planted hands and feet stay put.
 */

const X = 120
/** One slow breath: about two and a half seconds in, two and a half out. */
const BREATH = 5.2

const mat = (x: number, width = 150): PropSpec => ({ kind: 'mat', x, width })
const breath = () => holdPhases(BREATH)
/** Keeps compact poses (folds, seated, kneeling) at the same scale as standing ones. */
const FRAME_H = 150

/** Pelvis position for a stance where both legs reach their ankles almost straight. */
function rootForLegs(pelvis: number, ankleN: Vec, ankleF: Vec, view: View, slack = 0.8): Vec {
  const across = view === 'side' ? ([0, 0] as Vec) : dir(pelvis + 90)
  const hN = scale(across, L.hipHalf)
  const hF = scale(across, -L.hipHalf)
  const len = L.thigh + L.shin - slack
  const c1 = sub(ankleN, hN)
  const c2 = sub(ankleF, hF)
  const d = Math.max(1e-6, dist(c1, c2))
  const h = Math.sqrt(Math.max(0, len * len - (d / 2) * (d / 2)))
  const m = lerpV(c1, c2, 0.5)
  const n: Vec = [-(c2[1] - c1[1]) / d, (c2[0] - c1[0]) / d]
  const a = add(m, scale(n, h))
  const b = add(m, scale(n, -h))
  return a[1] < b[1] ? a : b
}

/** Hip height that keeps one straight leg on its ankle (hip at `x`). */
function hipOver(ankle: Vec, x: number, slack = 0.6): number {
  const len = L.thigh + L.shin - slack
  return ankle[1] - Math.sqrt(Math.max(1, len * len - (ankle[0] - x) ** 2))
}

// ---- Flows: key poses with arm arcs ------------------------------------------------------

type LimbKey = 'armN' | 'armF' | 'legN' | 'legF'
const LIMBS: LimbKey[] = ['armN', 'armF', 'legN', 'legF']

/** Turn from angle `a` to `b` the short way round. */
function lerpAngle(a: number, b: number, t: number): number {
  const d = ((((b - a) % 360) + 540) % 360) - 180
  return a + d * t
}

/**
 * The mat is solid: a knee that would dip through it kneels on it instead (the shin then points
 * at the foot), and toes that would poke through it tip up to rest on it.
 */
function onTheMat(pose: Pose, view: View): Pose {
  if (view !== 'side') return pose
  const out: Pose = { ...pose }
  const sk = solvePose(pose, view)
  const kneeY = GROUND - 6
  for (const k of ['N', 'F'] as const) {
    const leg = k === 'N' ? 'legN' : 'legF'
    const hip = k === 'N' ? sk.hipN : sk.hipF
    const knee = k === 'N' ? sk.kneeN : sk.kneeF
    const ankle = k === 'N' ? sk.ankleN : sk.ankleF
    if (knee[1] <= kneeY + 0.5) continue
    const dy = kneeY - hip[1]
    if (Math.abs(dy) > L.thigh) continue
    const dx = Math.sqrt(L.thigh * L.thigh - dy * dy)
    const kx = Math.abs(hip[0] + dx - knee[0]) < Math.abs(hip[0] - dx - knee[0]) ? hip[0] + dx : hip[0] - dx
    const K: Vec = [kx, kneeY]
    const spec = pose[leg]
    const target: Vec = 'ik' in spec ? [spec.ik[0], Math.min(spec.ik[1], GROUND - 6)] : ankle
    out[leg] = fk(angleOf(hip, K), angleOf(K, target))
  }
  const sk2 = solvePose(out, view)
  for (const [ankle, key] of [
    [sk2.ankleN, 'footN'],
    [sk2.ankleF, 'footF'],
  ] as const) {
    const a = out[key] ?? 0
    const r = (a * Math.PI) / 180
    if (ankle[1] + L.foot * Math.sin(r) <= GROUND - 0.6) continue
    const s = clamp((GROUND - 0.6 - ankle[1]) / L.foot, -1, 1)
    const flat = (Math.asin(s) * 180) / Math.PI
    out[key] = Math.cos(r) >= 0 ? flat : 180 - flat
  }
  return out
}

/**
 * Like keyPoseFn, but a limb that's given as angles in both neighbouring keys turns through its
 * angles (arms sweep overhead in an arc); everything else moves by position (planted hands and
 * feet don't slide). Feet turn the short way round, and nothing passes through the mat.
 */
export function flowFn(keys: KeyPose[], view: View): (u: number) => Pose {
  const asIK = keys.map((k) => toIK(k.pose, view))
  const n = keys.length - 1
  return (u: number) => {
    const x = clamp(u, 0, 1) * n
    const i = Math.min(n - 1, Math.floor(x))
    const t = ease(keys[i + 1].ease ?? 'inOut', x - i)
    const a: Pose = { ...asIK[i] }
    const b: Pose = { ...asIK[i + 1] }
    for (const k of LIMBS) {
      const pa: LimbSpec = keys[i].pose[k]
      const pb: LimbSpec = keys[i + 1].pose[k]
      if ('fk' in pa && 'fk' in pb) {
        a[k] = pa
        b[k] = pb
      }
    }
    const p = lerpPose(a, b, t)
    p.footN = lerpAngle(a.footN ?? 0, b.footN ?? 0, t)
    p.footF = lerpAngle(a.footF ?? 0, b.footF ?? 0, t)
    return onTheMat(p, view)
  }
}

/** Phases for a flow: one move per key, each with its own duration, label and pause. */
function flowPhases(steps: [dur: number, label: Phase['label'], pause?: number][]): Phase[] {
  const out: Phase[] = []
  steps.forEach(([d, label, pause], i) => {
    out.push({ to: (i + 1) / steps.length, dur: d, label, ease: 'linear' })
    if (pause) out.push({ dur: pause, label: 'hold' })
  })
  return out
}

// ---- Standing ---------------------------------------------------------------------------

/** Mountain pose with arm raises: arms float up on the inhale and down on the exhale. */
export function mountainBreath(): Motion {
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const p = standPose(X)
      const a = lerp(94, -84, t)
      p.armN = fk(a, a - 2 * t)
      p.armF = fk(a + 3, a + 1)
      p.head = lerp(-89, -97, t)
      p.spine = -1.5 * t
      return p
    },
    [
      { to: 1, dur: 3, label: 'up', ease: 'inOut' },
      { dur: 0.8, label: 'hold' },
      { to: 0, dur: 3, label: 'down', ease: 'inOut' },
      { dur: 0.8, label: 'rest' },
    ],
    { props: [mat(X, 110)] },
  )
}

/** Chair pose: sit back as if into a chair, arms reaching up alongside the ears. */
export function chairPose(): Motion {
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = -57 - 2 * b
      return {
        root: [X - 15, 127 + 2 * b],
        torso,
        head: torso - 8,
        spine: -1,
        legN: ik(X + 4, AY, 1),
        legF: ik(X + 1, AY, 1),
        armN: fk(torso - 5, torso - 6),
        armF: fk(torso - 2, torso - 3),
      }
    },
    breath(),
    { props: [mat(X, 110)] },
  )
}

/** Warrior I (side view): front knee over the ankle, back leg long, arms overhead. */
export function warrior1(): Motion {
  const front: Vec = [X + 38, AY]
  const back: Vec = [X - 64, AY]
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const root: Vec = [X - 2, 128 + 1.5 * b]
      return {
        root,
        torso: -91,
        head: -96 - 2 * b,
        spine: -1.5 - b,
        legN: ik(front[0], front[1], 1),
        legF: ik(back[0], back[1], 1),
        footF: -8,
        armN: fk(-92 - b, -93 - b),
        armF: fk(-88, -90),
      }
    },
    breath(),
    { props: [mat(X - 12, 170)] },
  )
}

/** Warrior II (front view): wide stance, front knee bent, arms long to the sides. */
export function warrior2(): Motion {
  const aN: Vec = [X + 46, AY]
  const aF: Vec = [X - 78, AY]
  return motion(
    'front',
    (u) => {
      const b = smooth(u)
      const rootX = X - 8
      return {
        root: [rootX, hipOver(aF, rootX - L.hipHalf, 0.8) + 1.2 * b],
        torso: -90,
        head: -90,
        legN: ik(aN[0], aN[1], 1),
        legF: ik(aF[0], aF[1], -1),
        footN: 2,
        footF: 100,
        armN: fk(-1 - 1.5 * b, -1 - 1.5 * b),
        armF: fk(181 + 1.5 * b, 181 + 1.5 * b),
      }
    },
    breath(),
    { props: [mat(X - 16, 190)] },
  )
}

/** Triangle (front view): both legs long, torso tips over the front leg, top arm to the sky. */
export function triangle(): Motion {
  const aN: Vec = [X + 44, AY]
  const aF: Vec = [X - 62, AY]
  return motion(
    'front',
    (u) => {
      const b = smooth(u)
      const torso = -24 + 2 * b
      const pelvis = -66
      const root = rootForLegs(pelvis, aN, aF, 'front', 1)
      const hipN = add(root, scale(dir(pelvis + 90), L.hipHalf))
      const shoulderN = add(polar(root, torso, L.torso), scale(dir(torso + 90), L.shoulderHalf))
      // Where a plumb line from the bottom shoulder meets the front leg.
      const k = clamp((shoulderN[0] - hipN[0]) / (aN[0] - hipN[0]), 0.35, 0.92)
      const shin = lerpV(hipN, aN, k)
      return {
        root,
        torso,
        pelvis,
        head: torso - 4,
        legN: ik(aN[0], aN[1], 1),
        legF: ik(aF[0], aF[1], -1),
        footN: 4,
        footF: 100,
        armN: ik(shoulderN[0], Math.min(shin[1] - 2, shoulderN[1] + 50), 1),
        armF: fk(-91, -90),
      }
    },
    breath(),
    { props: [mat(X - 9, 180)] },
  )
}

/** Goddess (front view): wide squat, knees out over the toes, arms in a cactus shape. */
export function goddess(): Motion {
  return motion(
    'front',
    (u) => {
      const b = smooth(u)
      return {
        root: [X, 126 + 3 * b],
        torso: -90,
        head: -90,
        legN: ik(X + 40, AY, 1),
        legF: ik(X - 40, AY, -1),
        footN: 22,
        footF: 158,
        armN: fk(-2, -88 - 2 * b),
        armF: fk(182, -92 + 2 * b),
      }
    },
    breath(),
    { props: [mat(X, 150)] },
  )
}

export type TreeLevel = 'kickstand' | 'calf' | 'thigh'

/** Tree pose (front view): one foot rests on the standing leg, knee opens to the side. */
export function treePose(level: TreeLevel = 'calf'): Motion {
  const stand: Vec = [X - 6, AY]
  const footAt: Record<TreeLevel, Vec> = { kickstand: [X + 1, AY - 9], calf: [X - 1, 141], thigh: [X - 3, 119] }
  const overhead = level === 'thigh'
  return motion(
    'front',
    (u) => {
      const sway = Math.sin(u * Math.PI) * 0.9
      const rootX = X + 1 + sway
      const root: Vec = [rootX, hipOver(stand, rootX - L.hipHalf)]
      const S = polar(root, -90, L.torso)
      const f = footAt[level]
      const p: Pose = {
        root,
        torso: -90 + sway * 0.6,
        head: -90,
        legF: ik(stand[0], stand[1], -1),
        legN: ik(f[0], f[1], 1),
        footF: 100,
        footN: level === 'kickstand' ? 60 : 96,
        armN: ik(S[0] + 2, S[1] + 19, 1),
        armF: ik(S[0] - 2, S[1] + 19, -1),
      }
      if (overhead) {
        p.armN = ik(S[0] + 3, S[1] - 50, -1)
        p.armF = ik(S[0] - 3, S[1] - 50, 1)
      }
      return p
    },
    breath(),
    { props: [mat(X, 110)] },
  )
}

/** Warrior III (side view): hinge forward on one leg; the back leg lifts in line with the body. */
export function warrior3(o: { chair?: boolean } = {}): Motion {
  const chairX = X + 114
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = o.chair ? -12 : -5 + b
      const root: Vec = [X + 2, STAND_HIP_Y + 1]
      const p: Pose = {
        root,
        torso,
        head: torso + 12,
        legN: ik(X + 3, AY, 1),
        legF: fk(torso + 180 + 1, torso + 180 + 1 - b),
        footF: torso + 90,
        armN: fk(torso - 4, torso - 4),
        armF: fk(torso - 2, torso - 2),
      }
      if (o.chair) {
        const grip: Vec = [chairX - 18, GROUND - 82]
        p.armN = ik(grip[0], grip[1], -1)
        p.armF = ik(grip[0] - 2, grip[1] + 1, -1)
        p.head = torso + 16
      }
      return p
    },
    breath(),
    { props: o.chair ? [{ kind: 'chair', x: chairX }, mat(X + 10, 130)] : [mat(X + 10, 130)] },
  )
}

/** Standing side stretch (front view): arms overhead, lengthen up and over to one side. */
export function standingSideBend(): Motion {
  return motion(
    'front',
    (u, side) => {
      const k = smooth(u)
      const s = side === 0 ? 1 : -1
      const torso = -90 + 16 * k * s
      const root: Vec = [X - 4 * k * s, STAND_HIP_Y + 1.5]
      const S = polar(root, torso, L.torso)
      const reach = polar(S, torso + 20 * k * s, 44)
      return {
        root,
        torso,
        pelvis: -90 + 3 * k * s,
        head: torso + 6 * k * s,
        legN: ik(X + 8, AY, 1),
        legF: ik(X - 8, AY, -1),
        footN: 80,
        footF: 100,
        armN: ik(reach[0] + 2, reach[1], -1),
        armF: ik(reach[0] - 2, reach[1], 1),
      }
    },
    [
      { to: 1, dur: 2.6, label: 'out', ease: 'inOut' },
      { dur: 2.4, label: 'hold' },
      { to: 0, dur: 2.4, label: 'in', ease: 'inOut' },
      { dur: 0.8, label: 'rest' },
    ],
    { alternate: true, props: [mat(X, 110)], minFrameH: FRAME_H },
  )
}

/** Standing forward fold: soft knees, the upper body hangs heavy, fingertips toward the floor. */
export function standingFold(): Motion {
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = 50 + 5 * b
      const root: Vec = [X - 14, STAND_HIP_Y + 3]
      const S = polar(root, torso, L.torso)
      return {
        root,
        torso,
        head: torso + 24,
        spine: 6,
        legN: ik(X + 3, AY, 1),
        legF: ik(X, AY, 1),
        armN: ik(S[0] + 4, HY - 4 * (1 - b), -1),
        armF: ik(S[0] + 2, HY - 4 * (1 - b), -1),
      }
    },
    breath(),
    { props: [mat(X, 110)], minFrameH: FRAME_H },
  )
}

// ---- Lunges and hips ----------------------------------------------------------------------

/** Low lunge (side view): back knee down, hips sink forward, arms overhead. */
export function lowLunge(o: { arms?: 'up' | 'knee' } = {}): Motion {
  const front: Vec = [X + 30, AY]
  const backAnkle: Vec = [X - 52, GROUND - 7]
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const root: Vec = [X - 10 + 6 * t, 133 + 1.5 * t]
      const torso = -91 - 3 * t
      const p: Pose = {
        root,
        torso,
        head: torso - 4,
        spine: -2 * t,
        legN: ik(front[0], front[1], 1),
        legF: ik(backAnkle[0], backAnkle[1], 1),
        footF: 182,
        armN: fk(-93 - 2 * t, -95 - 2 * t),
        armF: fk(-89 - 2 * t, -91 - 2 * t),
      }
      if (o.arms === 'knee') {
        p.armN = ik(front[0] - 2, 132, -1)
        p.armF = ik(front[0] - 5, 134, -1)
      }
      return p
    },
    breath(),
    { props: [mat(X - 10, 160)], minFrameH: FRAME_H },
  )
}

/** Lizard lunge (side view): hands down inside the front foot, back knee resting. */
export function lizardLunge(): Motion {
  const front: Vec = [X + 22, AY]
  const backAnkle: Vec = [X - 70, GROUND - 7]
  const H: Vec = [X + 34, HY]
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const root: Vec = [X - 18 + 3 * b, 140 + 2 * b]
      const torso = 6 + 2 * b
      return {
        root,
        torso,
        head: torso - 6,
        spine: 1,
        legN: ik(front[0], front[1], 1),
        legF: ik(backAnkle[0], backAnkle[1], 1),
        footF: 182,
        armN: ik(H[0], H[1], -1),
        armF: ik(H[0] - 2, H[1], -1),
      }
    },
    breath(),
    { props: [mat(X - 20, 170)], minFrameH: FRAME_H },
  )
}

/** Half splits (side view): back knee under the hip, front leg long, fold over it. */
export function halfSplits(): Motion {
  const knee: Vec = [X - 10, GROUND - 6]
  const root: Vec = [X - 10, knee[1] - L.thigh + 0.5]
  const heel: Vec = [X + 56, AY]
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = -8 + 12 * b
      const S = polar(root, torso, L.torso)
      return {
        root,
        torso,
        head: torso + 16,
        spine: 3,
        legN: ik(heel[0], heel[1], 1),
        footN: -88,
        legF: ik(X - 48, GROUND - 7, 1),
        footF: 182,
        armN: ik(S[0] + 5, HY, -1),
        armF: ik(S[0] + 3, HY, -1),
      }
    },
    breath(),
    { props: [mat(X, 160)], minFrameH: FRAME_H },
  )
}

/** Pigeon (side view): front shin folded on the floor, back leg long behind, chest tall. */
export function pigeon(o: { fold?: boolean } = {}): Motion {
  const root: Vec = [X - 6, 150]
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = o.fold ? 8 + 3 * b : -84 + 3 * b
      const S = polar(root, torso, L.torso)
      const p: Pose = {
        root,
        torso,
        head: o.fold ? torso + 22 : torso - 4,
        spine: o.fold ? 5 : -1,
        legN: ik(X - 8, GROUND - 7, 1),
        footN: 186,
        legF: ik(root[0] - 72, AY + 1, -1),
        footF: 182,
        armN: ik(root[0] + 20, 147, -1),
        armF: ik(root[0] + 17, 149, -1),
      }
      if (o.fold) {
        p.armN = ik(S[0] + 24, HY, -1)
        p.armF = ik(S[0] + 22, HY, -1)
      }
      return p
    },
    breath(),
    { props: [mat(X - 20, 170)], minFrameH: FRAME_H },
  )
}

// ---- Floor: all fours and belly ---------------------------------------------------------------

const DOG_H: Vec = [X + 64, HY]
const DOG_FEET: Vec = [X - 17, AY - 4]

function dogPose(breathe = 0): Pose {
  const hip: Vec = [X + 4, 96]
  return {
    root: hip,
    torso: angleOf(hip, DOG_H) - 2,
    head: angleOf(hip, DOG_H) + 4 + 3 * breathe,
    spine: -1.5 * breathe,
    armN: ik(DOG_H[0], DOG_H[1], -1),
    armF: ik(DOG_H[0] - 2, DOG_H[1], -1),
    legN: ik(DOG_FEET[0], DOG_FEET[1], 1),
    legF: ik(DOG_FEET[0] - 2, DOG_FEET[1], 1),
    footN: 22,
    footF: 22,
  }
}

/** Downward-facing dog, held: hips lift up and back, heels sink toward the mat. */
export function downDog(): Motion {
  return motion('side', (u) => dogPose(smooth(u)), breath(), { props: [mat(X + 20, 150)] })
}

/** Puppy pose (side view): hips over knees, chest melts toward the mat, arms long. */
export function puppyPose(): Motion {
  const R: Vec = [X - 10, GROUND - 6 - L.thigh]
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = 20 + 3 * b
      const S = polar(R, torso, L.torso)
      return {
        root: R,
        torso,
        head: torso + 26,
        spine: -2 - 2 * b,
        legN: ik(X - 48, GROUND - 7, 1),
        legF: ik(X - 50, GROUND - 7, 1),
        footN: 182,
        footF: 182,
        armN: ik(S[0] + 42, HY, -1),
        armF: ik(S[0] + 40, HY, -1),
      }
    },
    breath(),
    { props: [mat(X + 10, 170)] },
  )
}

/** Sphinx (side view): lying on the belly, propped on the forearms, chest open. */
export function sphinx(): Motion {
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = -24 - 3 * b
      const p = proneBase({ torso, head: torso - 10, spine: -3 - 2 * b })
      const S = polar(p.root, torso, L.torso)
      const elbow: Vec = [S[0], GROUND - 4]
      p.armN = ik(elbow[0] + L.forearm, GROUND - 4, -1)
      p.armF = ik(elbow[0] + L.forearm - 2, GROUND - 4, -1)
      return p
    },
    breath(),
    { props: [mat(X - 10, 170)] },
  )
}

/** Locust (side view): chest and legs float up, arms reach back alongside the body. */
export function locust(): Motion {
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const p = proneBase({ torso: lerp(-2, -11, t), head: lerp(2, -16, t), spine: -4 * t })
      const arm = lerp(178, 190, t)
      p.armN = fk(arm, arm)
      p.armF = fk(arm - 1, arm - 1)
      const leg = lerp(180, 190, t)
      p.legN = fk(leg, leg)
      p.legF = fk(leg - 1, leg - 1)
      return p
    },
    [
      { to: 1, dur: 2.2, label: 'up', ease: 'inOut' },
      { dur: 3, label: 'hold' },
      { to: 0, dur: 2, label: 'down', ease: 'inOut' },
      { dur: 1, label: 'rest' },
    ],
    { props: [mat(X - 10, 180)] },
  )
}

// ---- Floor: on the back ---------------------------------------------------------------------

/** Bridge pose, held: hips lifted, shoulders and feet grounded. */
export function bridgeHold(): Motion {
  const S: Vec = [X - 42, LY]
  const foot: Vec = [X + 34, AY]
  return motion(
    'side',
    (u) => {
      const t = 0.9 + 0.1 * smooth(u)
      const hip = polar(S, lerp(0, -33, t), L.torso)
      const torso = angleOf(hip, S)
      return {
        root: hip,
        torso,
        head: 180,
        armN: fk(6, 3),
        armF: fk(8, 5),
        legN: ik(foot[0], foot[1], 1),
        legF: ik(foot[0] - 3, foot[1], 1),
      }
    },
    breath(),
    { props: [mat(X - 10, 170)] },
  )
}

/** Happy baby (side view): knees toward the armpits, shins tall, hands hold the shins. */
export function happyBaby(): Motion {
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const thigh = -134 - 6 * b
      const p = supineBase({ head: 180 })
      const knee = polar(p.root, thigh, L.thigh)
      const ankle = polar(knee, -88, L.shin)
      const grip = lerpV(knee, ankle, 0.45)
      p.legN = fk(thigh, -88)
      p.legF = fk(thigh - 2, -90)
      p.footN = 180
      p.footF = 180
      p.armN = ik(grip[0] + 2, grip[1], 1)
      p.armF = ik(grip[0], grip[1] + 2, 1)
      return p
    },
    breath(),
    { props: [mat(X - 20, 160)] },
  )
}

/** Knees to chest (side view): hug both knees in; they ease closer on each exhale. */
export function kneesToChest(): Motion {
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const thigh = -130 - 8 * b
      const p = supineBase({ head: 180 })
      const knee = polar(p.root, thigh, L.thigh)
      const shin = 22 + 4 * b
      const hug = polar(knee, shin, 14)
      p.legN = fk(thigh, shin)
      p.legF = fk(thigh - 2, shin - 2)
      p.footN = shin - 30
      p.footF = shin - 30
      p.armN = ik(hug[0], hug[1] + 3, 1)
      p.armF = ik(hug[0] - 2, hug[1] + 4, 1)
      return p
    },
    breath(),
    { props: [mat(X - 20, 160)] },
  )
}

/** Legs up the wall (side view): lying close to a wall with the legs resting up it. */
export function legsUpWall(): Motion {
  const wallX = X + 8
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      return supineBase({
        head: 180,
        spine: -0.8 * b,
        legN: fk(-90, -90),
        legF: fk(-91, -91),
        footN: -150,
        footF: -152,
        armN: fk(4, 2),
        armF: fk(6, 4),
      })
    },
    breath(),
    { props: [{ kind: 'wall', x: wallX }, mat(X - 30, 130)] },
  )
}

/** Resting pose (savasana): lying long and still; the chest rises and falls. */
export function savasana(): Motion {
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      return supineBase({
        head: 180,
        spine: -0.9 * b,
        legN: fk(1, 1),
        legF: fk(2, 2),
        footN: -55,
        footF: -60,
        armN: fk(8, 5),
        armF: fk(10, 7),
      })
    },
    holdPhases(6),
    { props: [mat(X - 10, 180)] },
  )
}

/** Toe taps (side view): legs in tabletop, one foot lowers to tap the mat, back stays flat. */
export function toeTaps(): Motion {
  return motion(
    'side',
    (u, side) => {
      const t = smooth(u)
      const p = supineBase({ head: 180, armN: fk(5, 3), armF: fk(7, 5), legN: fk(-90, 0), legF: fk(-92, -2), footN: -60, footF: -60 })
      const thigh = lerp(-90, -40, t)
      if (side === 0) p.legN = fk(thigh, thigh + 90)
      else p.legF = fk(thigh - 2, thigh + 88)
      return p
    },
    repPhases(1.6, 0.3, 1.4, 0.4, ['down', 'up']),
    { alternate: true, props: [mat(X - 10, 170)] },
  )
}

/** Supine twist (seen from above): knees drop to one side, arms open wide. */
export function supineTwist(): Motion {
  return motion(
    'top',
    (u) => {
      const b = smooth(u)
      const p = topBase({ armN: fk(-2, -2), armF: fk(182, 182), pelvis: -70 })
      p.legN = fk(18 + 3 * b, 124)
      p.legF = fk(10 + 3 * b, 128)
      p.footN = 124
      p.footF = 128
      return p
    },
    breath(),
    { floor: false },
  )
}

/** Reclined butterfly (seen from above): soles together, knees fall open. */
export function reclinedButterfly(): Motion {
  return motion(
    'top',
    (u) => {
      const b = smooth(u)
      const p = topBase({ armN: fk(62, 70), armF: fk(118, 110) })
      const y = p.root[1] + 44 - 2 * b
      p.legN = ik(p.root[0] + 4, y, -1)
      p.legF = ik(p.root[0] - 4, y, 1)
      p.footN = 175
      p.footF = 5
      return p
    },
    breath(),
    { floor: false },
  )
}

// ---- Seated (front view) ----------------------------------------------------------------------

const SEAT: Vec = [X, GROUND - 13]

/** Sitting on the mat, knees wide (the base for easy seat and butterfly). */
function seated(over: Partial<Pose> = {}): Pose {
  return {
    root: SEAT,
    torso: -90,
    head: -90,
    legN: ik(X + 12, GROUND - 6, 1),
    legF: ik(X - 12, GROUND - 6, -1),
    footN: 170,
    footF: 10,
    armN: ik(X + 40, GROUND - 18, 1),
    armF: ik(X - 40, GROUND - 18, -1),
    ...over,
  }
}

/** Easy seat with breath: sitting tall, hands on the knees; the shoulders rise and soften. */
export function easySeat(): Motion {
  return motion('front', (u) => seated({ shoulderLift: 1.8 * smooth(u) }), holdPhases(6), { props: [mat(X, 130)], minFrameH: FRAME_H })
}

/** Neck release (front view): ear toward one shoulder, then the other, shoulders soft. */
export function neckRelease(): Motion {
  return motion(
    'front',
    (u) => {
      const tilt = Math.sin(u * Math.PI * 2) * 22
      return seated({ head: -90 + tilt, shoulderLift: 1.2 * Math.max(0, Math.cos(u * Math.PI * 4)) })
    },
    loopPhases(10, 'hold'),
    { props: [mat(X, 130)], minFrameH: FRAME_H },
  )
}

/** Seated side bend (front view): one arm sweeps up and over, the other hand on the mat. */
export function seatedSideBend(): Motion {
  return motion(
    'front',
    (u, side) => {
      const k = smooth(u)
      const s = side === 0 ? 1 : -1
      const torso = -90 + 22 * k * s
      const S = polar(SEAT, torso, L.torso)
      const over = polar(S, torso + 10 * k * s, 44)
      const floorHand: Vec = [X + 38 * s, GROUND - 4]
      const p = seated({ torso, pelvis: -90, head: torso + 8 * k * s })
      const rest: Vec = [X - 40 * s, GROUND - 18]
      const top = lerpV(rest, over, k)
      const low = lerpV([X + 40 * s, GROUND - 18], floorHand, k)
      if (s === 1) {
        p.armF = ik(top[0], top[1], 1)
        p.armN = ik(low[0], low[1], 1)
      } else {
        p.armN = ik(top[0], top[1], -1)
        p.armF = ik(low[0], low[1], -1)
      }
      return p
    },
    [
      { to: 1, dur: 2.6, label: 'out', ease: 'inOut' },
      { dur: 3, label: 'hold' },
      { to: 0, dur: 2.4, label: 'in', ease: 'inOut' },
      { dur: 0.8, label: 'rest' },
    ],
    { alternate: true, props: [mat(X, 130)], minFrameH: FRAME_H },
  )
}

/** Butterfly (front view): soles together, knees open, hands around the feet. */
export function butterfly(): Motion {
  return motion(
    'front',
    (u) => {
      const f = Math.sin(u * Math.PI * 2) * 1.6
      return seated({
        legN: ik(X + 12, GROUND - 6 + f, 1),
        legF: ik(X - 12, GROUND - 6 + f, -1),
        footN: 180,
        footF: 0,
        armN: ik(X + 12, GROUND - 14, 1),
        armF: ik(X - 12, GROUND - 14, -1),
      })
    },
    loopPhases(4, 'hold'),
    { props: [mat(X, 130)], minFrameH: FRAME_H },
  )
}

// ---- Seated (side view) -----------------------------------------------------------------------

/** Seated forward fold (side view): legs long, fold forward from the hips, hands to the shins. */
export function seatedForwardFold(): Motion {
  const root: Vec = [X - 30, GROUND - 11]
  const heel: Vec = [X + 46, GROUND - 6]
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = -44 + 8 * b
      const S = polar(root, torso, L.torso)
      const reach = lerpV(S, [heel[0], heel[1] - 8], 0.85)
      return {
        root,
        torso,
        head: torso + 34,
        spine: 4,
        legN: ik(heel[0], heel[1], -1),
        legF: ik(heel[0] - 2, heel[1], -1),
        footN: -80,
        footF: -80,
        armN: ik(reach[0], reach[1], -1),
        armF: ik(reach[0] - 2, reach[1] + 1, -1),
      }
    },
    breath(),
    { props: [mat(X - 5, 160)], minFrameH: FRAME_H },
  )
}

/** Boat pose (side view): balance on the sit bones, shins lifted, arms reaching forward. */
export function boat(o: { easy?: boolean } = {}): Motion {
  const root: Vec = [X - 6, GROUND - 11]
  return motion(
    'side',
    (u) => {
      const b = smooth(u)
      const torso = -126 + 2 * b
      const p: Pose = {
        root,
        torso,
        head: torso + 30,
        spine: 1,
        legN: fk(-48 - b, 2),
        legF: fk(-50 - b, 0),
        footN: -30,
        footF: -30,
        armN: fk(-2, -2),
        armF: fk(0, 0),
      }
      if (o.easy) {
        p.legN = ik(X + 46, AY, 1)
        p.legF = ik(X + 44, AY, 1)
        p.footN = 0
        p.footF = 0
        const knee = polar(root, -50, L.thigh)
        p.armN = ik(knee[0] - 8, knee[1] + 6, 1)
        p.armF = ik(knee[0] - 10, knee[1] + 7, 1)
      }
      return p
    },
    breath(),
    { props: [mat(X, 150)], minFrameH: FRAME_H },
  )
}

// ---- Sun salutations ---------------------------------------------------------------------------

/** Where the hands land for the floor part of the flow (in front of the feet). */
const SH: Vec = [X + 28, HY]

function stand(arms: 'down' | 'up' | 'heart' = 'down'): Pose {
  const p = standPose(X)
  if (arms === 'up') {
    p.armN = fk(-92, -94)
    p.armF = fk(-88, -90)
    p.head = -96
    p.spine = -2
  } else if (arms === 'heart') {
    p.armN = ik(X + 13, 64, -1)
    p.armF = ik(X + 12, 65, -1)
  } else {
    p.armN = fk(93, 91)
    p.armF = fk(97, 94)
  }
  return p
}

/** Forward fold with hands on the mat (knees as soft as needed). */
function fold(): Pose {
  const root: Vec = [X - 14, 100]
  const torso = 52
  return {
    root,
    torso,
    head: torso + 22,
    spine: 6,
    legN: ik(X + 3, AY, 1),
    legF: ik(X, AY, 1),
    armN: ik(SH[0], SH[1], -1),
    armF: ik(SH[0] - 2, SH[1], -1),
  }
}

/** Halfway lift: long flat back, hands on the shins. */
function halfLift(): Pose {
  const root: Vec = [X - 13, 99.5]
  const torso = 8
  return {
    root,
    torso,
    head: torso - 6,
    spine: -1,
    legN: ik(X + 3, AY, 1),
    legF: ik(X, AY, 1),
    armN: ik(X + 9, 142, -1),
    armF: ik(X + 7, 143, -1),
  }
}

/** Arms sweeping out to the sides on the way down (a "swan dive"). */
function swan(): Pose {
  const root: Vec = [X - 8, 99]
  const torso = -38
  return {
    root,
    torso,
    head: torso - 2,
    spine: -1,
    legN: ik(X + 3, AY, 1),
    legF: ik(X, AY, 1),
    armN: fk(-40, -40),
    armF: fk(-36, -36),
  }
}

/** Low lunge with hands down: right foot (far leg) back, knee resting or lifted. */
function lungeBack(kneeDown: boolean): Pose {
  const root: Vec = kneeDown ? [X - 26, 140] : [X - 28, 128]
  const torso = kneeDown ? -6 : 4
  return {
    root,
    torso,
    head: torso - 6,
    spine: 1,
    legN: ik(X + 3, AY, 1),
    legF: kneeDown ? ik(X - 92, GROUND - 7, 1) : ik(X - 96, GROUND - 14, 1),
    footF: kneeDown ? 182 : 72,
    armN: ik(SH[0], SH[1], -1),
    armF: ik(SH[0] - 2, SH[1], -1),
  }
}

/** Plank, on the knees for the gentle flow. */
function plank(knees: boolean): Pose {
  const S: Vec = [SH[0] - 2, HY - (L.upperArm + L.forearm - 1)]
  if (knees) {
    const K: Vec = [S[0] - Math.sqrt(90 ** 2 - (GROUND - 6 - S[1]) ** 2), GROUND - 6]
    const R = lerpV(S, K, L.torso / 90)
    return {
      root: R,
      torso: angleOf(R, S),
      head: angleOf(R, S) + 6,
      armN: ik(SH[0], SH[1], -1),
      armF: ik(SH[0] - 2, SH[1], -1),
      legN: ik(K[0] - L.shin, GROUND - 7, 1),
      legF: ik(K[0] - L.shin - 2, GROUND - 7, 1),
      footN: 182,
      footF: 182,
    }
  }
  const Lb = L.torso + L.thigh + L.shin
  const P: Vec = [S[0] - Math.sqrt(Lb ** 2 - (GROUND - 14 - S[1]) ** 2), GROUND - 14]
  const R = lerpV(S, P, L.torso / Lb)
  const a = Math.asin(Math.min(1, (GROUND - 0.6 - P[1]) / L.foot)) * (180 / Math.PI)
  return {
    root: R,
    torso: angleOf(R, S),
    head: angleOf(R, S) + 6,
    armN: ik(SH[0], SH[1], -1),
    armF: ik(SH[0] - 2, SH[1], -1),
    legN: ik(P[0], P[1], 1),
    legF: ik(P[0] - 2, P[1], 1),
    footN: a,
    footF: a,
  }
}

/** Long legs on the mat behind the hips (knees bend toward the mat when they fold). */
const proneLegs = (hipX: number): Pick<Pose, 'legN' | 'legF' | 'footN' | 'footF'> => ({
  legN: ik(hipX - 77, GROUND - 7, 1),
  legF: ik(hipX - 78, GROUND - 7, 1),
  footN: 182,
  footF: 182,
})

/** Lying on the belly, hands under the shoulders. */
function belly(): Pose {
  return {
    ...proneBase({ root: [X - 24, LY], torso: 0, head: 6 }),
    ...proneLegs(X - 24),
    armN: ik(SH[0], SH[1], -1),
    armF: ik(SH[0] - 2, SH[1], -1),
  }
}

/** Low cobra: chest lifts a little, elbows hug in. */
function lowCobra(): Pose {
  const torso = -24
  return {
    ...proneBase({ root: [X - 24, LY], torso, head: torso - 14, spine: -6 }),
    ...proneLegs(X - 24),
    armN: ik(SH[0], SH[1], -1),
    armF: ik(SH[0] - 2, SH[1], -1),
  }
}

/** Child's pose with the hands where they were (hips back to the heels). */
function child(): Pose {
  const R: Vec = [X - 50, GROUND - 23]
  const torso = 8
  return {
    root: R,
    torso,
    head: torso + 17,
    spine: 5,
    armN: ik(SH[0] + 4, SH[1], -1),
    armF: ik(SH[0] + 2, SH[1], -1),
    legN: ik(R[0] - 2, GROUND - 6, 1),
    legF: ik(R[0] - 4, GROUND - 6, 1),
    footN: 182,
    footF: 182,
  }
}

/** Downward dog with the hands at the flow's hand spot. */
function dog(): Pose {
  const feet: Vec = [SH[0] - 81, AY - 4]
  const hip: Vec = [SH[0] - 60, 96]
  return {
    root: hip,
    torso: angleOf(hip, SH) - 2,
    head: angleOf(hip, SH) + 4,
    armN: ik(SH[0], SH[1], -1),
    armF: ik(SH[0] - 2, SH[1], -1),
    legN: ik(feet[0], feet[1], 1),
    legF: ik(feet[0] - 2, feet[1], 1),
    footN: 22,
    footF: 22,
  }
}

/** Stepping the front foot up between the hands, back leg still long. */
function lungeForward(): Pose {
  const back: Vec = [SH[0] - 81, AY - 4]
  const root: Vec = [X - 22, 126]
  return {
    root,
    torso: 6,
    head: 0,
    spine: 1,
    legN: ik(X + 3, AY, 1),
    legF: ik(back[0], back[1], 1),
    footF: 22,
    armN: ik(SH[0], SH[1], -1),
    armF: ik(SH[0] - 2, SH[1], -1),
  }
}

/** Half sun salutation: arms up, fold, halfway lift, fold, rise. Standing only, no floor work. */
export function halfSunSalutation(): Motion {
  const keys: KeyPose[] = [
    { pose: stand('heart') },
    { pose: stand('down') },
    { pose: stand('up') },
    { pose: swan() },
    { pose: fold() },
    { pose: halfLift() },
    { pose: fold() },
    { pose: swan() },
    { pose: stand('up') },
    { pose: stand('heart') },
  ]
  const fn = flowFn(keys, 'side')
  return motion(
    'side',
    (u) => fn(u),
    flowPhases([
      [1.2, 'out'],
      [2.2, 'up', 0.6],
      [1.4, 'down'],
      [1.4, 'down', 0.8],
      [1.8, 'up', 0.8],
      [1.6, 'down', 0.6],
      [1.6, 'up'],
      [1.6, 'up', 0.6],
      [2, 'in', 1],
    ]),
    { props: [mat(X + 5, 130)] },
  )
}

/**
 * Sun salutation. The gentle version keeps the knees down and rests in child's pose; the classic
 * one steps back to plank, lowers, lifts to cobra and holds downward dog.
 */
export function sunSalutation(o: { gentle?: boolean } = {}): Motion {
  const gentle = !!o.gentle
  const keys: KeyPose[] = gentle
    ? [
        { pose: stand('heart') },
        { pose: stand('up') },
        { pose: swan() },
        { pose: fold() },
        { pose: halfLift() },
        { pose: fold() },
        { pose: lungeBack(true) },
        { pose: plank(true) },
        { pose: belly() },
        { pose: lowCobra() },
        { pose: child() },
        { pose: dog() },
        { pose: lungeForward() },
        { pose: fold() },
        { pose: swan() },
        { pose: stand('up') },
        { pose: stand('heart') },
      ]
    : [
        { pose: stand('heart') },
        { pose: stand('up') },
        { pose: swan() },
        { pose: fold() },
        { pose: halfLift() },
        { pose: fold() },
        { pose: lungeBack(false) },
        { pose: plank(false) },
        { pose: belly() },
        { pose: lowCobra() },
        { pose: dog() },
        { pose: lungeForward() },
        { pose: fold() },
        { pose: halfLift() },
        { pose: swan() },
        { pose: stand('up') },
        { pose: stand('heart') },
      ]
  const fn = flowFn(keys, 'side')
  const steps: [number, Phase['label'], number?][] = gentle
    ? [
        [2.2, 'up', 0.5],
        [1.4, 'down'],
        [1.4, 'down', 0.6],
        [1.6, 'up', 0.6],
        [1.4, 'down', 0.4],
        [1.8, 'out', 0.6],
        [1.6, 'out', 0.6],
        [2, 'down', 0.4],
        [1.8, 'up', 1],
        [2, 'in', 1.6],
        [2.2, 'up', 2.4],
        [2.2, 'in', 0.6],
        [1.6, 'in', 0.4],
        [1.6, 'up'],
        [1.6, 'up', 0.6],
        [2, 'in', 1],
      ]
    : [
        [2.2, 'up', 0.5],
        [1.4, 'down'],
        [1.4, 'down', 0.6],
        [1.6, 'up', 0.6],
        [1.4, 'down', 0.4],
        [1.6, 'out', 0.4],
        [1.4, 'out', 0.6],
        [2, 'down', 0.4],
        [1.8, 'up', 1],
        [2, 'out', 3],
        [2.2, 'in', 0.6],
        [1.6, 'in', 0.4],
        [1.4, 'up', 0.6],
        [1.4, 'up'],
        [1.6, 'up', 0.6],
        [2, 'in', 1],
      ]
  return motion('side', (u) => fn(u), flowPhases(steps), { props: [mat(X - 20, 210)] })
}
