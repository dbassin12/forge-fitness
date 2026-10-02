import { holdPhases, repPhases } from '../motion'
import type { Motion, Pose, PropSpec, Vec } from '../types'
import { DEG, angleOf } from '../math'
import { GROUND, HY, L, SEAT_Y, bodyPoint, dist, ik, lerp, lerpV, motion, polar, solve1D } from './common'

export interface PushOpts {
  surface?: 'floor' | 'chair' | 'wall'
  feetOn?: 'floor' | 'chair'
  knees?: boolean
  narrow?: boolean
  depth?: number
  fault?: 'hipSag' | 'hipPike' | 'headDrop' | null
  tempo?: [number, number, number, number]
  /** Variants that reuse the plank geometry. */
  mode?: 'rep' | 'hold' | 'taps' | 'climbers' | 'renegade'
}

const P0X = 40

interface PushGeo {
  P: Vec
  Lb: number
  H: Vec
  betaTop: number
  armLen: (u: number) => number
  props: PropSpec[]
  wallX?: number
}

const armAngle = (beta: number, narrow?: boolean) => 90 - Math.max(0, beta - 18) * 0.9 + (narrow ? 9 : 0)

function geometry(o: PushOpts): PushGeo {
  const props: PropSpec[] = []
  const Lb = o.knees ? L.thigh + L.torso : L.thigh + L.shin + L.torso
  let P: Vec
  if (o.knees) P = [P0X, GROUND - 5]
  else if (o.feetOn === 'chair') P = [P0X, SEAT_Y - 9]
  else P = [P0X, GROUND - 14]
  if (o.feetOn === 'chair') props.push({ kind: 'chair', x: P0X - 6, facing: 1 })

  const straight = L.upperArm + L.forearm - 1
  const surfaceY = o.surface === 'chair' ? SEAT_Y - 2 : HY - (o.mode === 'renegade' ? 6 : 0)
  let betaTop: number
  let H: Vec
  if (o.surface === 'wall') {
    betaTop = 72
    const S = bodyPoint(P, Lb, betaTop)
    H = polar(S, armAngle(betaTop, o.narrow), straight)
    props.push({ kind: 'wall', x: H[0] + 2 })
  } else {
    betaTop = solve1D((b) => {
      const S = bodyPoint(P, Lb, b)
      return S[1] + straight * Math.sin(armAngle(b, o.narrow) * DEG) - surfaceY
    }, -10, 85)
    const S = bodyPoint(P, Lb, betaTop)
    H = polar(S, armAngle(betaTop, o.narrow), straight)
    if (o.surface === 'chair') props.push({ kind: 'chair', x: H[0] + 8, facing: -1 })
  }
  const bottom = o.surface === 'wall' ? 23 : o.surface === 'chair' ? 21 : 20
  const depth = o.depth ?? 1
  return { P, Lb, H, betaTop, armLen: (u) => lerp(straight, bottom, u * depth), props }
}

function plankPose(g: PushGeo, al: number, o: PushOpts, u: number): { pose: Pose; S: Vec; R: Vec } {
  // Search only the upper branch: from the closest approach (body line pointing at the hands) up to the top.
  const closest = -angleOf(g.P, g.H)
  const beta = al >= g.armLen(0) - 1e-6 ? g.betaTop : solve1D((b) => dist(bodyPoint(g.P, g.Lb, b), g.H) - al, closest, g.betaTop)
  const S = bodyPoint(g.P, g.Lb, beta)
  const d = [(S[0] - g.P[0]) / g.Lb, (S[1] - g.P[1]) / g.Lb]
  const perpDown: Vec = [-d[1], d[0]]
  const sag = o.fault === 'hipSag' ? 10 - 3 * u : o.fault === 'hipPike' ? -13 : 0
  const onLine = lerpV(g.P, S, (g.Lb - L.torso) / g.Lb)
  const R: Vec = [onLine[0] + perpDown[0] * sag, onLine[1] + perpDown[1] * sag]
  const torso = angleOf(R, S)
  const pose: Pose = {
    root: R,
    torso,
    head: torso + (o.fault === 'headDrop' ? 42 : 4),
    armN: ik(g.H[0], g.H[1], -1),
    armF: ik(g.H[0] - 2.5, g.H[1] + 0.5, -1),
    legN: ik(g.P[0], g.P[1], 1),
    legF: ik(g.P[0] - 2, g.P[1], 1),
  }
  if (o.knees) {
    const ankle = polar(g.P, 196, L.shin)
    pose.legN = ik(ankle[0], ankle[1], 1)
    pose.legF = ik(ankle[0] - 2, ankle[1] - 1, 1)
    pose.footN = 168
    pose.footF = 170
  } else {
    const floorY = g.P[1] > SEAT_Y ? GROUND - 0.6 : SEAT_Y - 0.6
    const a = Math.asin(Math.min(1, (floorY - g.P[1]) / L.foot)) / DEG
    pose.footN = a
    pose.footF = a
  }
  return { pose, S, R }
}

const DEFAULT_TEMPO: [number, number, number, number] = [1.7, 0.3, 1.0, 0.4]

export function pushUp(o: PushOpts = {}): Motion {
  const g = geometry(o)
  const mode = o.mode ?? 'rep'
  if (mode === 'hold') {
    return motion(
      'side',
      (u) => {
        const r = plankPose(g, g.armLen(0) - 0.6 * u, o, 0)
        return r.pose
      },
      holdPhases(),
      { props: g.props },
    )
  }
  if (mode === 'taps') {
    return motion(
      'side',
      (u, side) => {
        const { pose, S } = plankPose(g, g.armLen(0), o, 0)
        const tap: Vec = [S[0] - 4, S[1] + 5]
        const hand = lerpV(g.H, tap, u)
        const arc = Math.sin(u * Math.PI) * 6
        const target: Vec = [hand[0], hand[1] - arc]
        if (side === 0) pose.armN = ik(target[0], target[1], -1)
        else pose.armF = ik(target[0] - 2, target[1], -1)
        return pose
      },
      [
        { to: 1, dur: 0.38, label: 'up', ease: 'inOut' },
        { dur: 0.12, label: 'hold' },
        { to: 0, dur: 0.38, label: 'down', ease: 'inOut' },
        { dur: 0.12, label: 'rest' },
      ],
      { alternate: true, props: g.props },
    )
  }
  if (mode === 'climbers') {
    return motion(
      'side',
      (u, side) => {
        const { pose, R } = plankPose(g, g.armLen(0), o, 0)
        const drive: Vec = [R[0] + 16, g.P[1] - 3]
        const foot = lerpV(g.P, drive, u)
        const lifted: Vec = [foot[0], foot[1] - Math.sin(u * Math.PI) * 5]
        if (side === 0) {
          pose.legN = ik(lifted[0], lifted[1], 1)
          pose.footN = lerp(pose.footN ?? 70, 20, u)
        } else {
          pose.legF = ik(lifted[0] - 2, lifted[1], 1)
          pose.footF = lerp(pose.footF ?? 70, 20, u)
        }
        return pose
      },
      [
        { to: 1, dur: 0.32, label: 'in', ease: 'out' },
        { to: 0, dur: 0.32, label: 'out', ease: 'inOut' },
      ],
      { alternate: true, props: g.props },
    )
  }
  if (mode === 'renegade') {
    return motion(
      'side',
      (u, side) => {
        const { pose, R } = plankPose(g, g.armLen(0), o, 0)
        pose.dbN = 'end'
        pose.dbF = 'end'
        const rowTo: Vec = [R[0] + 14, R[1] - 1]
        const hand = lerpV(g.H, rowTo, u)
        if (side === 0) pose.armN = ik(hand[0], hand[1], -1)
        else pose.armF = ik(hand[0] - 2, hand[1], -1)
        return pose
      },
      repPhases(0.8, 0.25, 0.9, 0.35, ['up', 'down']),
      { alternate: true, props: g.props },
    )
  }
  const t = o.tempo ?? DEFAULT_TEMPO
  return motion('side', (u) => plankPose(g, g.armLen(u), o, u).pose, repPhases(...t), { props: g.props })
}

/** Forearm plank (optionally on the knees), with a gentle breathing sway. */
export function forearmPlank(o: { knees?: boolean; fault?: 'hipSag' | 'hipPike' | null } = {}): Motion {
  const E: Vec = [160, GROUND - 4]
  const S: Vec = [E[0], E[1] - L.upperArm]
  const Lb = o.knees ? L.thigh + L.torso : L.thigh + L.shin + L.torso
  const Py = o.knees ? GROUND - 5 : GROUND - 14
  const beta = Math.asin((Py - S[1]) / Lb) / DEG
  const P: Vec = [S[0] - Lb * Math.cos(beta * DEG), Py]
  return motion(
    'side',
    (u) => {
      const d = [(S[0] - P[0]) / Lb, (S[1] - P[1]) / Lb]
      const sag = (o.fault === 'hipSag' ? 9 : o.fault === 'hipPike' ? -14 : 0) + u * 0.8
      const on = lerpV(P, S, (Lb - L.torso) / Lb)
      const R: Vec = [on[0] - d[1] * sag, on[1] + d[0] * sag]
      const torso = angleOf(R, S)
      const pose: Pose = {
        root: R,
        torso,
        head: torso + 6,
        armN: ik(E[0] + L.forearm, E[1], -1),
        armF: ik(E[0] + L.forearm - 2.5, E[1], -1),
        legN: ik(P[0], P[1], 1),
        legF: ik(P[0] - 2, P[1], 1),
      }
      if (o.knees) {
        const ankle = polar(P, 196, L.shin)
        pose.legN = ik(ankle[0], ankle[1], 1)
        pose.legF = ik(ankle[0] - 2, ankle[1] - 1, 1)
        pose.footN = 168
        pose.footF = 170
      } else {
        const a = Math.asin(Math.min(1, (GROUND - 0.6 - P[1]) / L.foot)) / DEG
        pose.footN = a
        pose.footF = a
      }
      return pose
    },
    holdPhases(),
  )
}

/**
 * Pike push-up: hips high in an inverted V, head travels toward the floor just in front of the
 * hands. The shoulder follows a path; the hip rides the straight-leg arc around the feet.
 */
export function pikePushUp(o: { elevated?: boolean; depth?: number; tempo?: [number, number, number, number] } = {}): Motion {
  const props: PropSpec[] = []
  const A: Vec = o.elevated ? [40, SEAT_Y - 8] : [52, GROUND - 9]
  if (o.elevated) props.push({ kind: 'chair', x: 34, facing: 1 })
  const legLen = L.thigh + L.shin - 1
  const straight = L.upperArm + L.forearm - 1
  // Hands: far enough from the feet that straight arms line up with the torso at the top.
  const H: Vec = o.elevated ? [A[0] + 92, HY] : [A[0] + 102, HY]
  const armDir = o.elevated ? 62 : 40
  const Stop: Vec = [H[0] - straight * Math.cos((armDir * Math.PI) / 180), H[1] - straight * Math.sin((armDir * Math.PI) / 180)]
  const Sbot: Vec = [H[0] - 5, H[1] - 27]
  const depth = o.depth ?? 1
  const hipFor = (S: Vec): Vec => {
    // Intersection of circle(A, legLen) and circle(S, torso), upper solution.
    const d = dist(A, S)
    const a = (legLen * legLen - L.torso * L.torso + d * d) / (2 * d)
    const h = Math.sqrt(Math.max(0, legLen * legLen - a * a))
    const ux = (S[0] - A[0]) / d
    const uy = (S[1] - A[1]) / d
    const mx = A[0] + ux * a
    const my = A[1] + uy * a
    const c1: Vec = [mx + uy * h, my - ux * h]
    const c2: Vec = [mx - uy * h, my + ux * h]
    return c1[1] < c2[1] ? c1 : c2
  }
  return motion(
    'side',
    (u) => {
      const S = lerpV(Stop, Sbot, u * depth)
      const R = hipFor(S)
      const t = angleOf(R, S)
      return {
        root: R,
        torso: t,
        head: t + 10,
        armN: ik(H[0], H[1], -1),
        armF: ik(H[0] - 2, H[1] + 0.5, -1),
        legN: ik(A[0], A[1], 1),
        legF: ik(A[0] - 2, A[1], 1),
        footN: o.elevated ? 70 : 30,
        footF: o.elevated ? 70 : 30,
      }
    },
    repPhases(...(o.tempo ?? [1.8, 0.3, 1.1, 0.4])),
    { props },
  )
}

/** Wall-supported handstand hold (advanced): back to the wall, heels resting on it. */
export function wallHandstand(): Motion {
  const H: Vec = [128, HY]
  const S: Vec = [H[0] - 1, H[1] - (L.upperArm + L.forearm - 1)]
  const R: Vec = [S[0] + 5, S[1] - L.torso + 0.5]
  const feetAt = polar(R, -82, L.thigh + L.shin - 0.5)
  const wallX = feetAt[0] + 5
  return motion(
    'side',
    (u) => {
      const r: Vec = [R[0], R[1] + 0.6 * u]
      const torso = angleOf(r, S)
      return {
        root: r,
        torso,
        head: torso,
        armN: ik(H[0], H[1], -1),
        armF: ik(H[0] - 2, H[1], -1),
        legN: ik(feetAt[0], feetAt[1], 1),
        legF: ik(feetAt[0] - 2, feetAt[1] + 1, 1),
        footN: -100,
        footF: -100,
      }
    },
    holdPhases(),
    { props: [{ kind: 'wall', x: wallX }] },
  )
}
