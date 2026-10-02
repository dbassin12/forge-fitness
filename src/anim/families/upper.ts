import { repPhases } from '../motion'
import type { Motion, Pose, Vec } from '../types'
import { AY, GROUND, L, SEAT_Y, TABLE_Y, angleOf, bodyPoint, dist, fk, ik, lerp, lerpV, motion, polar, smooth, solve1D, standPose } from './common'

const X = 120

export type StandingArm = 'curl' | 'hammer' | 'press' | 'arnold' | 'triceps' | 'shrug' | 'frontRaise'

/** Standing dumbbell arm work, side view. */
export function standingDb(kind: StandingArm): Motion {
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const p = standPose(X)
      switch (kind) {
        case 'curl':
        case 'hammer': {
          const fa = lerp(92, -48, t)
          p.armN = fk(lerp(92, 86, t), fa)
          p.armF = fk(lerp(95, 89, t), fa + 3)
          p.dbN = kind === 'hammer' ? 'vertical' : 'end'
          p.dbF = p.dbN
          break
        }
        case 'press':
        case 'arnold': {
          const startUa = kind === 'arnold' ? 66 : 82
          const ua = lerp(startUa, -91, t)
          const fa = lerp(-88, -91, t)
          p.armN = fk(ua, fa)
          p.armF = fk(ua + 3, fa + 2)
          p.dbN = 'end'
          p.dbF = 'end'
          break
        }
        case 'triceps': {
          const fa = lerp(116, 264, t)
          p.armN = fk(-97, fa)
          p.armF = fk(-95, fa + 2)
          p.dbBoth = 'vertical'
          break
        }
        case 'shrug':
          p.shoulderLift = 5 * t
          p.armN = fk(91, 90)
          p.armF = fk(93, 92)
          p.dbN = 'end'
          p.dbF = 'end'
          break
        case 'frontRaise': {
          const a = lerp(92, 2, t)
          p.armN = fk(a, a - 2)
          p.armF = fk(a + 3, a + 1)
          p.dbBoth = 'horizontal'
          break
        }
      }
      return p
    },
    kind === 'triceps' ? repPhases(1.6, 0.3, 1.1, 0.4, ['down', 'up']) : repPhases(1.1, 0.4, 1.6, 0.3, ['up', 'down']),
  )
}

/** Front-view lateral raise (also used for arm-circle style warm-ups). */
export function lateralRaise(o: { leanAway?: boolean } = {}): Motion {
  return motion(
    'front',
    (u) => {
      const t = smooth(u)
      return {
        root: [X, 98.2],
        torso: o.leanAway ? -96 : -90,
        legN: ik(X + 9, AY, 1),
        legF: ik(X - 9, AY, -1),
        footN: 70,
        footF: 110,
        armN: fk(lerp(84, 6, t), lerp(87, 9, t)),
        armF: fk(lerp(96, 174, t), lerp(93, 171, t)),
        dbN: 'end',
        dbF: 'end',
      }
    },
    repPhases(1.2, 0.4, 1.7, 0.3, ['up', 'down']),
  )
}

/** Bent-over dumbbell row (both arms), side view. */
export function bentRow(o: { oneArm?: boolean } = {}): Motion {
  if (o.oneArm) {
    // Free hand braced on a chair seat; the near arm rows the heavier dumbbell.
    const brace: Vec = [X + 54, SEAT_Y - 2]
    return motion(
      'side',
      (u) => {
        const t = smooth(u)
        const torso = -14
        const p: Pose = {
          root: [X - 6, 107],
          torso,
          head: torso + 10,
          legN: ik(X + 6, AY, 1),
          legF: ik(X - 14, AY, 1),
          armF: ik(brace[0], brace[1], -1),
          armN: fk(lerp(90, 168, t), lerp(90, 94, t)),
          dbN: 'end',
        }
        return p
      },
      repPhases(1.0, 0.5, 1.6, 0.3, ['up', 'down']),
      { props: [{ kind: 'chair', x: X + 60, facing: -1 }] },
    )
  }
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const torso = -32
      return {
        root: [X - 16, 109],
        torso,
        head: torso + 12,
        legN: ik(X + 2, AY, 1),
        legF: ik(X - 1, AY, 1),
        armN: fk(lerp(90, 166, t), lerp(90, 92, t)),
        armF: fk(lerp(92, 168, t), lerp(92, 94, t)),
        dbN: 'end',
        dbF: 'end',
      }
    },
    repPhases(1.0, 0.5, 1.6, 0.3, ['up', 'down']),
  )
}

/** Chair dips: hands on the seat edge behind, heels on the floor in front. */
export function chairDip(o: { straightLegs?: boolean } = {}): Motion {
  const chairX = X - 50
  const H: Vec = [chairX + 19, SEAT_Y - 2]
  const straight = L.upperArm + L.forearm - 1
  const foot: Vec = o.straightLegs ? [X + 40, AY - 1] : [X + 30, AY]
  return motion(
    'side',
    (u) => {
      const al = lerp(straight, 27, smooth(u))
      const S: Vec = [H[0] + 5, H[1] - Math.sqrt(Math.max(0, al * al - 25))]
      const torso = -86
      const R = polar(S, torso + 180, L.torso)
      return {
        root: R,
        torso,
        head: torso + 6,
        armN: ik(H[0], H[1], -1),
        armF: ik(H[0] - 2, H[1], -1),
        legN: ik(foot[0], foot[1], 1),
        legF: ik(foot[0] - 3, foot[1], 1),
        footN: o.straightLegs ? -60 : 0,
        footF: o.straightLegs ? -60 : 0,
      }
    },
    repPhases(1.6, 0.3, 1.1, 0.4),
    { props: [{ kind: 'chair', x: chairX, facing: 1 }] },
  )
}

/** Inverted row under a sturdy table: body rigid from the heels (or knees), chest to the table edge. */
export function invertedRow(o: { bentKnees?: boolean } = {}): Motion {
  const tableX = X - 30
  const H: Vec = [tableX + 41, TABLE_Y + 5]
  const Stop: Vec = [H[0] - 2, H[1] + 15]
  const Lb = o.bentKnees ? L.thigh + L.torso : L.thigh + L.shin + L.torso
  const Py = o.bentKnees ? GROUND - 44 : GROUND - 6
  const P: Vec = [Stop[0] + Math.sqrt(Lb * Lb - (Py - Stop[1]) ** 2), Py]
  const straight = L.upperArm + L.forearm - 1
  const closest = Math.atan2(P[1] - H[1], P[0] - H[0]) * (180 / Math.PI)
  const footFlat: Vec = [P[0] + 6, AY]
  return motion(
    'side',
    (u) => {
      const al = lerp(straight, dist(Stop, H), smooth(u))
      const beta = solve1D((b) => dist(bodyPoint(P, Lb, b, -1), H) - al, closest - 70, closest)
      const S = bodyPoint(P, Lb, beta, -1)
      const R = lerpV(P, S, (Lb - L.torso) / Lb)
      const torso = angleOf(R, S)
      const p: Pose = {
        root: R,
        torso,
        head: torso,
        armN: ik(H[0], H[1], -1),
        armF: ik(H[0] + 2, H[1], -1),
        legN: o.bentKnees ? ik(footFlat[0], footFlat[1], 1) : ik(P[0], P[1], -1),
        legF: o.bentKnees ? ik(footFlat[0] - 3, footFlat[1], 1) : ik(P[0] - 2, P[1], -1),
        footN: o.bentKnees ? 0 : -78,
        footF: o.bentKnees ? 0 : -78,
      }
      return p
    },
    repPhases(1.0, 0.5, 1.6, 0.3, ['up', 'down']),
    { props: [{ kind: 'table', x: tableX, width: 90 }] },
  )
}
