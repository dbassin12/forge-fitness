import { loopPhases } from '../motion'
import type { Motion, Pose, Vec } from '../types'
import { AY, GROUND, HY, L, STAND_HIP_Y, bump, fk, ik, keyPhases, keyPoseFn, lerp, motion, polar, seg, smooth, standPose } from './common'
import { squatPose } from './squat'

const X = 120

/** Jumping jacks (front view). `step` = low-impact step-out version. */
export function jumpingJack(o: { step?: boolean } = {}): Motion {
  return motion(
    'front',
    (u, side) => {
      const w = bump(u)
      const hop = o.step ? 0 : Math.abs(Math.sin(u * Math.PI * 2)) * 6
      const spread = o.step ? 0 : w
      const stepOut = o.step ? w : 0
      const nX = X + lerp(8, 30, spread) + (o.step && side === 0 ? stepOut * 22 : 0)
      const fX = X - lerp(8, 30, spread) - (o.step && side === 1 ? stepOut * 22 : 0)
      const rootY = STAND_HIP_Y + 1.2 - hop + w * (o.step ? 2 : 3)
      return {
        root: [X, rootY],
        torso: -90,
        legN: ik(nX, AY - hop, 1),
        legF: ik(fX, AY - hop, -1),
        footN: 62,
        footF: 118,
        armN: fk(lerp(82, -62, w), lerp(84, -72, w)),
        armF: fk(lerp(98, 242, w), lerp(96, 252, w)),
      }
    },
    [{ to: 1, dur: o.step ? 1.3 : 0.9, label: 'jump', ease: 'linear' }],
    { alternate: !!o.step },
  )
}

/** Running-in-place family: high knees, march, butt kicks (side view, alternating legs). */
export function runInPlace(kind: 'highKnees' | 'march' | 'buttKicks' | 'fastFeet' = 'highKnees'): Motion {
  const period = kind === 'march' ? 0.9 : kind === 'fastFeet' ? 0.32 : 0.5
  return motion(
    'side',
    (u, side) => {
      const b = bump(u)
      const p = standPose(X)
      const bob = kind === 'march' ? b * 1.5 : b * 3
      p.root = [X, p.root[1] - (kind === 'fastFeet' ? 1 : bob)]
      p.torso = kind === 'buttKicks' ? -86 : -88
      let leg
      if (kind === 'buttKicks') leg = fk(lerp(94, 100, b), lerp(92, 205, b))
      else if (kind === 'fastFeet') leg = ik(X + 2, AY - b * 6, 1)
      else {
        const thigh = lerp(92, kind === 'march' ? 30 : -4, b)
        leg = fk(thigh, lerp(92, 96, b))
      }
      const swingA = lerp(100, 40, b)
      const swingB = lerp(80, 140, b)
      if (side === 0) {
        p.legN = leg
        p.footN = kind === 'buttKicks' ? lerp(0, 120, b) : lerp(0, 25, b)
        p.armN = fk(swingB, swingB - 60)
        p.armF = fk(swingA, swingA - 70)
      } else {
        p.legF = leg
        p.footF = kind === 'buttKicks' ? lerp(0, 120, b) : lerp(0, 25, b)
        p.armF = fk(swingB, swingB - 60)
        p.armN = fk(swingA, swingA - 70)
      }
      return p
    },
    loopPhases(period, kind === 'march' ? 'up' : 'jump'),
    { alternate: true },
  )
}

/** Skaters (front view): bound side to side, landing on one leg while the other sweeps behind. */
export function skaters(): Motion {
  return motion(
    'front',
    (u, side) => {
      const dirX = side === 0 ? 1 : -1
      // u: 0 land (bent) → 0.6 push off → 1 airborne toward the other side (mirrored next cycle).
      const t = smooth(u)
      const cx = X + dirX * lerp(30, -30, t)
      const air = Math.sin(seg(u, 0.55, 1) * Math.PI) * 9
      const bend = 1 - Math.sin(seg(u, 0, 0.55) * Math.PI * 0.5) * 0.4
      const rootY = 104 + 12 * bend - air
      const plant: Vec = [cx + dirX * 4, AY - air]
      const trail: Vec = [cx - dirX * 26, AY - 9 - air]
      const lean = dirX * 10
      return {
        root: [cx, rootY],
        torso: -90 + lean,
        legN: dirX > 0 ? ik(plant[0], plant[1], 1) : ik(trail[0], trail[1], 1),
        legF: dirX > 0 ? ik(trail[0], trail[1], -1) : ik(plant[0], plant[1], -1),
        footN: 62,
        footF: 118,
        armN: fk(dirX > 0 ? 150 : 40, dirX > 0 ? 140 : 30),
        armF: fk(dirX > 0 ? 150 : 40, dirX > 0 ? 140 : 30),
      }
    },
    [{ to: 1, dur: 0.75, label: 'jump', ease: 'linear' }],
    { alternate: true },
  )
}

/** Shadow boxing (side view): guard up, alternating straight punches. */
export function shadowBox(): Motion {
  return motion(
    'side',
    (u, side) => {
      const p = standPose(X, { root: [X - 4, STAND_HIP_Y + 4] })
      p.legN = ik(X + 10, AY, 1)
      p.legF = ik(X - 18, AY, 1)
      p.footF = 20
      const S = polar(p.root, p.torso, L.torso)
      const guard: Vec = [S[0] + 9, S[1] - 11]
      const punch: Vec = [S[0] + 51, S[1] - 3]
      const b = bump(u)
      const hand: Vec = [lerp(guard[0], punch[0], b), lerp(guard[1], punch[1], b)]
      const guardF: Vec = [guard[0] - 3, guard[1] + 2]
      if (side === 0) {
        p.armN = ik(hand[0], hand[1], 1)
        p.armF = ik(guardF[0], guardF[1], 1)
      } else {
        p.armF = ik(hand[0] - 2, hand[1], 1)
        p.armN = ik(guard[0], guard[1], 1)
      }
      p.root = [p.root[0] + b * 2, p.root[1] - Math.abs(Math.sin(u * Math.PI * 2)) * 1.5]
      return p
    },
    loopPhases(0.55, 'out'),
    { alternate: true },
  )
}

function plankTop(): Pose {
  // High plank keyframe (feet back, hands under shoulders).
  const H: Vec = [X + 46, HY]
  const S: Vec = [H[0] - 3, H[1] - 50]
  const P: Vec = [S[0] - Math.sqrt(128 * 128 - (GROUND - 14 - S[1]) ** 2), GROUND - 14]
  const R: Vec = [P[0] + (S[0] - P[0]) * (78 / 128), P[1] + (S[1] - P[1]) * (78 / 128)]
  const torso = (Math.atan2(S[1] - R[1], S[0] - R[0]) * 180) / Math.PI
  return {
    root: R,
    torso,
    head: torso + 4,
    armN: ik(H[0], H[1], -1),
    armF: ik(H[0] - 2, H[1], -1),
    legN: ik(P[0], P[1], 1),
    legF: ik(P[0] - 2, P[1], 1),
    footN: 74,
    footF: 74,
  }
}

function crouchHandsDown(): Pose {
  const p = squatPose(1, { arms: 'forward' })
  const H: Vec = [X + 32, HY]
  return { ...p, torso: 8, head: 22, spine: 3, armN: ik(H[0], H[1], -1), armF: ik(H[0] - 2, H[1], -1) }
}

/** Burpee family as key poses: squat thrust, step-back burpee, full burpee with jump. */
export function burpee(kind: 'thrust' | 'stepBack' | 'full' = 'full'): Motion {
  const stand = standPose(X)
  const crouch = crouchHandsDown()
  const plank = plankTop()
  const halfOut: Pose = { ...plank, legF: crouch.legF, footF: 0 }
  const keys = [{ pose: stand }, { pose: crouch }]
  if (kind === 'stepBack') keys.push({ pose: halfOut }, { pose: plank }, { pose: halfOut }, { pose: crouch })
  else keys.push({ pose: plank }, { pose: crouch })
  if (kind === 'full') {
    const jump: Pose = { ...stand, root: [X, stand.root[1] - 18], legN: ik(X + 3, AY - 16, 1), legF: ik(X, AY - 16, 1), footN: 30, footF: 30, armN: fk(-95, -95), armF: fk(-92, -92) }
    keys.push({ pose: stand }, { pose: jump }, { pose: stand })
  } else keys.push({ pose: stand })
  const fn = keyPoseFn(keys, 'side')
  const n = keys.length - 1
  const durs = Array.from({ length: n }, (_, i) => (kind === 'full' && i >= n - 2 ? 0.28 : 0.42))
  return motion('side', (u) => fn(u), keyPhases(durs, Array(n).fill('jump')))
}

