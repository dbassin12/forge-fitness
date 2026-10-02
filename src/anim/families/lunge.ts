import { repPhases } from '../motion'
import type { LimbSpec, Motion, Pose, Vec } from '../types'
import { AY, L, SEAT_Y, bump, fk, ik, lerp, lerpV, motion, seg, smooth, torsoFrame, withinReach } from './common'

const X = 130

type Arms = 'hips' | 'pair' | 'forward' | 'clasp'

function armsFor(pose: Pose, arms: Arms, u: number): Pick<Pose, 'armN' | 'armF' | 'dbN' | 'dbF'> {
  const f = torsoFrame(pose)
  if (arms === 'pair') return { armN: fk(91, 90), armF: fk(93, 92), dbN: 'end', dbF: 'end' }
  if (arms === 'forward') {
    const a = lerp(92, 4, smooth(u))
    return { armN: fk(a, a - 2), armF: fk(a + 3, a + 1) }
  }
  if (arms === 'clasp') {
    const t = f.at(f.shoulder, 13, -16)
    return { armN: ik(t[0], t[1], -1), armF: ik(t[0] - 2, t[1] + 1, -1) }
  }
  const t = f.at(pose.root, 4, 8)
  return { armN: ik(t[0], t[1], -1), armF: ik(t[0] - 2, t[1], -1) }
}

function legs(front: LimbSpec, rear: LimbSpec, side: 0 | 1): Pick<Pose, 'legN' | 'legF'> {
  return side === 0 ? { legN: front, legF: rear } : { legN: rear, legF: front }
}

/** Reverse lunge (step back), forward lunge (step forward) or split squat (feet stay put). */
export function lunge(o: { kind?: 'reverse' | 'forward' | 'split'; arms?: Arms; tempo?: [number, number, number, number] } = {}): Motion {
  const kind = o.kind ?? 'reverse'
  const arms = o.arms ?? 'hips'
  const stride = 68
  return motion(
    'side',
    (u, side) => {
      let frontFoot: Vec
      let rearFoot: Vec
      let rearAngle: number
      let root: Vec
      if (kind === 'split') {
        frontFoot = [X, AY]
        rearFoot = [X - stride + 2, AY - 7]
        rearAngle = 52
        root = lerpV([X - 30, 106], [X - 33, 133], smooth(u))
      } else if (kind === 'reverse') {
        const s1 = seg(u, 0, 0.42)
        const s2 = seg(u, 0.25, 1)
        frontFoot = [X, AY]
        rearFoot = [lerp(X - 1, X - stride, smooth(s1)), lerp(AY, AY - 7, s1) - 9 * bump(s1)]
        rearAngle = lerp(0, 52, s1)
        root = lerpV([X - 1, 98.2], [X - 33, 133], smooth(s2))
      } else {
        const s1 = seg(u, 0, 0.42)
        const s2 = seg(u, 0.25, 1)
        rearFoot = [X - stride / 2, lerp(AY, AY - 7, s2)]
        rearAngle = lerp(0, 52, s2)
        frontFoot = [lerp(X - stride / 2 + 1, X + stride / 2, smooth(s1)), AY - 9 * bump(s1)]
        root = lerpV([X - stride / 2 + 1, 98.2], [X - 2, 133], smooth(s2))
      }
      const torso = -88 + 4 * seg(u, 0.2, 1)
      const reach = L.thigh + L.shin - 0.3
      frontFoot = withinReach(root, frontFoot, reach)
      rearFoot = withinReach(root, rearFoot, reach)
      const base: Pose = {
        root,
        torso,
        head: torso,
        ...legs(ik(frontFoot[0], frontFoot[1], 1), ik(rearFoot[0], rearFoot[1], 1), side),
        armN: fk(93, 91),
        armF: fk(97, 94),
      }
      if (side === 0) base.footF = rearAngle
      else base.footN = rearAngle
      return { ...base, ...armsFor(base, arms, u) }
    },
    repPhases(...(o.tempo ?? [1.7, 0.3, 1.3, 0.4])),
    { alternate: true },
  )
}

/** Bulgarian split squat: rear foot laces-down on a chair seat. */
export function bulgarian(o: { arms?: Arms } = {}): Motion {
  const rear: Vec = [X - 66, SEAT_Y - 6]
  return motion(
    'side',
    (u) => {
      const root = lerpV([X - 22, 103], [X - 26, 134], smooth(u))
      const torso = -86 + 6 * u
      const base: Pose = {
        root,
        torso,
        head: torso,
        legN: ik(X + 8, AY, 1),
        legF: ik(rear[0], rear[1], 1),
        footF: 186,
        armN: fk(93, 91),
        armF: fk(97, 94),
      }
      return { ...base, ...armsFor(base, o.arms ?? 'hips', u) }
    },
    repPhases(1.8, 0.3, 1.3, 0.4),
    { props: [{ kind: 'chair', x: X - 72, facing: 1 }] },
  )
}

/** Step-up onto a sturdy step (or the bottom stair). */
export function stepUp(o: { arms?: Arms } = {}): Motion {
  const stepX = X + 30
  const top = AY - 20
  return motion(
    'side',
    (u, side) => {
      const lift = seg(u, 0.45, 1)
      const root = lerpV([X + 3, 104], [stepX - 2, top - 76.5], smooth(seg(u, 0, 0.9)))
      const trail = lerpV([X - 8, AY], [stepX - 7, top], smooth(lift))
      const trailLifted = withinReach(root, [trail[0], trail[1] - 10 * bump(lift)], L.thigh + L.shin - 0.3)
      const torso = -84 - 4 * u
      const base: Pose = {
        root,
        torso,
        head: torso,
        ...legs(ik(stepX, top, 1), ik(trailLifted[0], trailLifted[1], 1), side),
        armN: fk(93, 91),
        armF: fk(97, 94),
      }
      return { ...base, ...armsFor(base, o.arms ?? 'pair', 0) }
    },
    repPhases(1.4, 0.4, 1.4, 0.4, ['up', 'down']),
    { alternate: true, props: [{ kind: 'step', x: stepX + 4, width: 46, height: 20 }] },
  )
}

/** Jump lunge: explode up and switch legs in the air (one cycle = both legs). */
export function jumpLunge(): Motion {
  const back: Vec = [X - 64, AY - 7]
  const front: Vec = [X, AY]
  return motion(
    'side',
    (u) => {
      const half = u < 0.5 ? 0 : 1
      const v = (u - half * 0.5) * 2
      const fly = seg(v, 0.3, 0.7)
      const swap = half === 0 ? smooth(fly) : 1 - smooth(fly)
      const air = Math.sin(fly * Math.PI)
      const nearFoot = lerpV(front, back, swap)
      const farFoot = lerpV(back, front, swap)
      const lift = air * 26
      const yBottom = 131
      const y = v < 0.3 ? lerp(yBottom, 112, smooth(v / 0.3)) : v < 0.7 ? 112 - lift : lerp(112, yBottom, smooth((v - 0.7) / 0.3))
      const root: Vec = [X - 32, y]
      const torso = -86
      return {
        root,
        torso,
        head: torso,
        legN: ik(nearFoot[0], nearFoot[1] - lift * 0.9, 1),
        legF: ik(farFoot[0], farFoot[1] - lift * 0.9, 1),
        footN: lerp(0, 52, swap),
        footF: lerp(52, 0, swap),
        armN: fk(lerp(70, 120, swap), lerp(40, 100, swap)),
        armF: fk(lerp(120, 70, swap), lerp(100, 40, swap)),
      }
    },
    [
      { to: 0.5, dur: 0.9, label: 'jump', ease: 'linear' },
      { to: 1, dur: 0.9, label: 'jump', ease: 'linear' },
    ],
  )
}

/** Front-view lateral lunge / Cossack squat / curtsy lunge. */
export function lateralLunge(o: { kind?: 'lateral' | 'cossack' | 'curtsy' } = {}): Motion {
  const kind = o.kind ?? 'lateral'
  return motion(
    'front',
    (u, side) => {
      const dirX = side === 0 ? 1 : -1
      let nFoot: Vec
      let fFoot: Vec
      let root: Vec
      let tilt = 0
      if (kind === 'cossack') {
        nFoot = [X + 44, AY]
        fFoot = [X - 44, AY]
        root = lerpV([X, 104], [X + dirX * 26, 141], smooth(u))
        tilt = 4 * u * dirX
      } else if (kind === 'curtsy') {
        const s1 = seg(u, 0, 0.4)
        const crossing: Vec = [lerp(X + 9 * dirX, X - 24 * dirX, smooth(s1)), AY - 3 - 8 * bump(s1)]
        nFoot = side === 0 ? crossing : [X + 9, AY]
        fFoot = side === 0 ? [X - 9, AY] : crossing
        root = lerpV([X, 98.2], [X - 8 * dirX, 126], smooth(seg(u, 0.25, 1)))
      } else {
        const s1 = seg(u, 0, 0.4)
        const out: Vec = [lerp(X + 9 * dirX, X + 44 * dirX, smooth(s1)), AY - 8 * bump(s1)]
        nFoot = side === 0 ? out : [X + 9, AY]
        fFoot = side === 0 ? [X - 9, AY] : out
        root = lerpV([X, 98.2], [X + 24 * dirX, 128], smooth(seg(u, 0.25, 1)))
        tilt = 5 * seg(u, 0.25, 1) * dirX
      }
      const torso = -90 + tilt
      return {
        root,
        torso,
        legN: ik(nFoot[0], nFoot[1], 1),
        legF: ik(fFoot[0], fFoot[1], -1),
        footN: 62,
        footF: 118,
        armN: ik(root[0] + 5, root[1] - 36, 1),
        armF: ik(root[0] - 5, root[1] - 35, -1),
      }
    },
    repPhases(1.6, 0.3, 1.3, 0.4),
    { alternate: true },
  )
}
