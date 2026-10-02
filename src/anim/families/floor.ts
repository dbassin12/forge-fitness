import { holdPhases, loopPhases, repPhases } from '../motion'
import type { Motion, Pose, PropSpec, Vec } from '../types'
import { AY, GROUND, HY, L, SEAT_Y, angleOf, bump, fk, ik, keyPhases, keyPoseFn, lerp, lerpV, motion, polar, smooth } from './common'

const X = 120
/** Hip/shoulder height when lying on the floor. */
const LY = GROUND - 9.5

// ---- Supine (on the back, head to the left, face up) -------------------------------

function supineBase(over: Partial<Pose> = {}): Pose {
  return {
    root: [X, LY],
    torso: 180,
    head: 180,
    armN: fk(3, 3),
    armF: fk(5, 5),
    legN: ik(X + 40, AY, 1),
    legF: ik(X + 37, AY, 1),
    ...over,
  }
}

const shoulderOf = (p: Pose) => polar(p.root, p.torso, L.torso)

/** Dead bug: opposite arm and leg lower toward the floor while the back stays flat. */
export function deadBug(): Motion {
  return motion(
    'side',
    (u, side) => {
      const arm = lerp(-90, -172, smooth(u))
      const thigh = lerp(-90, -7, smooth(u))
      const shin = lerp(0, -7, smooth(u))
      const p = supineBase({ armN: fk(-90, -90), armF: fk(-92, -92), legN: fk(-90, 0), legF: fk(-92, -2), footN: -60, footF: -60 })
      if (side === 0) {
        p.armN = fk(arm, arm)
        p.legF = fk(thigh, shin)
        p.footF = lerp(-60, -40, u)
      } else {
        p.armF = fk(arm - 2, arm - 2)
        p.legN = fk(thigh, shin)
        p.footN = lerp(-60, -40, u)
      }
      return p
    },
    repPhases(1.4, 0.4, 1.2, 0.3, ['out', 'in']),
    { alternate: true },
  )
}

type CrunchKind = 'crunch' | 'reverse' | 'bicycle' | 'legRaise' | 'vup'

export function crunch(kind: CrunchKind = 'crunch'): Motion {
  if (kind === 'bicycle') {
    return motion(
      'side',
      (u, side) => {
        const t = smooth(u)
        const p = supineBase({ torso: 200, head: 214, spine: 4 })
        const S = shoulderOf(p)
        const head = polar(S, 214, L.neck + L.headR)
        p.armN = ik(head[0] + 3, head[1] - 2, 1)
        p.armF = ik(head[0] + 1, head[1] - 1, 1)
        const tuck = fk(lerp(-30, -108, t), lerp(-10, 0, t))
        const ext = fk(lerp(-30, -10, t), lerp(-10, -10, t))
        if (side === 0) {
          p.legN = tuck
          p.legF = ext
        } else {
          p.legF = tuck
          p.legN = ext
        }
        p.torso = 200 + 6 * t
        return p
      },
      [
        { to: 1, dur: 0.7, label: 'in', ease: 'inOut' },
        { to: 0, dur: 0.5, label: 'out', ease: 'inOut' },
      ],
      { alternate: true },
    )
  }
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      if (kind === 'reverse') {
        const p = supineBase({ armN: fk(4, 4), armF: fk(6, 6), spine: 4 * t, root: [X, LY - 3 * t] })
        p.legN = fk(lerp(-90, -128, t), lerp(-2, -48, t))
        p.legF = fk(lerp(-92, -130, t), lerp(-4, -50, t))
        p.footN = lerp(-40, -70, t)
        p.footF = p.footN
        return p
      }
      if (kind === 'legRaise') {
        const a = lerp(-6, -88, t)
        return supineBase({ legN: fk(a, a), legF: fk(a - 2, a - 2), footN: a - 70, footF: a - 70 })
      }
      if (kind === 'vup') {
        const p = supineBase({ torso: lerp(184, 232, t), head: lerp(184, 236, t), spine: 3 + 3 * t })
        const a = lerp(-8, -62, t)
        p.legN = fk(a, a)
        p.legF = fk(a - 2, a - 2)
        p.footN = a - 70
        p.footF = a - 70
        const arm = lerp(-176, -42, t)
        p.armN = fk(arm, arm)
        p.armF = fk(arm - 2, arm - 2)
        return p
      }
      // Classic crunch: shoulder blades peel off the floor, lower back stays down.
      const p = supineBase({ torso: lerp(180, 206, t), head: lerp(180, 222, t), spine: 5 * t })
      const S = shoulderOf(p)
      const chest: Vec = [S[0] + 14, S[1] - 6]
      p.armN = ik(chest[0], chest[1], 1)
      p.armF = ik(chest[0] - 1, chest[1] + 1, 1)
      return p
    },
    kind === 'vup' ? repPhases(0.9, 0.3, 0.9, 0.3, ['up', 'down']) : repPhases(1.1, 0.4, 1.1, 0.3, ['up', 'down']),
  )
}

/** Hollow body hold (or the tucked version) with a slow breathing sway. */
export function hollowHold(o: { tuck?: boolean } = {}): Motion {
  return motion(
    'side',
    (u) => {
      const p = supineBase({ torso: 197, head: 205, spine: 3 })
      const arm = o.tuck ? -60 : -172 - u
      p.armN = fk(arm, arm)
      p.armF = fk(arm - 2, arm - 2)
      if (o.tuck) {
        p.legN = fk(-60, 10)
        p.legF = fk(-62, 8)
      } else {
        p.legN = fk(-12 - u, -12 - u)
        p.legF = fk(-14 - u, -14 - u)
        p.footN = -80
        p.footF = -80
      }
      return p
    },
    holdPhases(),
  )
}

/** Glute bridge / single-leg bridge / shoulders-on-chair hip thrust. */
export function bridge(o: { single?: boolean; thrust?: boolean; loaded?: boolean } = {}): Motion {
  const props: PropSpec[] = []
  if (o.thrust) props.push({ kind: 'bench', x: X - 58, width: 44, height: 42 })
  const S: Vec = o.thrust ? [X - 40, SEAT_Y - 8] : [X - 42, LY]
  const foot: Vec = o.thrust ? [X + 46, AY] : [X + 34, AY]
  return motion(
    'side',
    (u, side) => {
      const t = smooth(u)
      let hip: Vec
      if (o.thrust) {
        const a0 = Math.atan2(GROUND - 13 - S[1], 26) * (180 / Math.PI)
        hip = polar(S, lerp(a0, -1, t), L.torso)
      } else {
        hip = polar(S, lerp(0, -33, t), L.torso)
      }
      const torso = angleOf(hip, S)
      const p: Pose = {
        root: hip,
        torso,
        head: o.thrust ? torso - 25 * t : 180,
        armN: fk(lerp(8, 5, t), 3),
        armF: fk(lerp(10, 7, t), 5),
        legN: ik(foot[0], foot[1], 1),
        legF: ik(foot[0] - 3, foot[1], 1),
      }
      if (o.loaded) {
        const top: Vec = [hip[0] + 2, hip[1] - 12]
        p.armN = ik(top[0], top[1], -1)
        p.armF = ik(top[0] - 2, top[1], -1)
        p.dbBoth = 'horizontal'
      }
      if (o.single) {
        const thighAngle = angleOf(hip, foot) - 40
        const free = fk(thighAngle, thighAngle)
        if (side === 0) p.legN = free
        else p.legF = free
      }
      return p
    },
    repPhases(1.0, 0.8, 1.3, 0.3, ['up', 'down']),
    { props, alternate: !!o.single },
  )
}

/** Supine dumbbell work: floor press, pullover, skull crusher. */
export function supineDb(kind: 'press' | 'pullover' | 'skull'): Motion {
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const p = supineBase()
      if (kind === 'press') {
        // u = 0 arms straight up, u = 1 elbows resting on the floor.
        const ua = lerp(-90, 14, t)
        const fa = -90
        p.armN = fk(ua, fa)
        p.armF = fk(ua + 2, fa)
        p.dbN = 'end'
        p.dbF = 'end'
      } else if (kind === 'pullover') {
        const a = lerp(-90, -170, t)
        p.armN = fk(a, a)
        p.armF = fk(a - 2, a - 2)
        p.dbBoth = 'end'
      } else {
        const fa = lerp(-96, -168, t)
        p.armN = fk(-102, fa)
        p.armF = fk(-100, fa + 2)
        p.dbN = 'end'
        p.dbF = 'end'
      }
      return p
    },
    repPhases(1.6, 0.3, 1.1, 0.4),
  )
}

// ---- Prone (face down, head to the right) -----------------------------------------

function proneBase(over: Partial<Pose> = {}): Pose {
  return {
    root: [X, LY],
    torso: 0,
    head: 2,
    armN: fk(176, 176),
    armF: fk(178, 178),
    legN: fk(180, 180),
    legF: fk(181, 181),
    footN: 120,
    footF: 120,
    ...over,
  }
}

export function superman(): Motion {
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const p = proneBase({ torso: lerp(0, -9, t), head: lerp(2, -14, t), spine: -4 * t })
      const arm = lerp(-2, -12, t)
      p.armN = fk(arm, arm)
      p.armF = fk(arm + 2, arm + 2)
      const leg = lerp(180, 191, t)
      p.legN = fk(leg, leg)
      p.legF = fk(leg - 1, leg - 1)
      return p
    },
    repPhases(1.0, 1.2, 1.0, 0.4, ['up', 'down']),
  )
}

export function cobra(): Motion {
  const H: Vec = [X + 46, HY]
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const torso = lerp(-2, -34, t)
      const p = proneBase({ torso, head: torso - 14 * t, spine: -8 * t })
      p.armN = ik(H[0], H[1], -1)
      p.armF = ik(H[0] - 2, H[1], -1)
      return p
    },
    [
      { to: 1, dur: 2, label: 'up', ease: 'inOut' },
      { dur: 2.5, label: 'hold' },
      { to: 0, dur: 1.6, label: 'down', ease: 'inOut' },
      { dur: 0.6, label: 'rest' },
    ],
  )
}

// ---- Quadruped (hands and knees, facing right) -------------------------------------

const QR: Vec = [X, GROUND - 4 - L.thigh]
const QTORSO = -10.4
const QS = polar(QR, QTORSO, L.torso)
const QH: Vec = [QS[0], HY]
const QANKLE: Vec = [X - 37, GROUND - 7]

function quadBase(over: Partial<Pose> = {}): Pose {
  return {
    root: QR,
    torso: QTORSO,
    head: QTORSO + 8,
    armN: ik(QH[0], QH[1], -1),
    armF: ik(QH[0] - 2, QH[1], -1),
    legN: ik(QANKLE[0], QANKLE[1], 1),
    legF: ik(QANKLE[0] - 2, QANKLE[1], 1),
    footN: 182,
    footF: 182,
    ...over,
  }
}

export function birdDog(): Motion {
  return motion(
    'side',
    (u, side) => {
      const t = smooth(u)
      const p = quadBase()
      const handOut = polar(QS, -3, L.upperArm + L.forearm - 0.5)
      const footOut = polar(QR, 182, L.thigh + L.shin - 0.5)
      const hand = lerpV(QH, handOut, t)
      const handLift: Vec = [hand[0], hand[1] - bump(t) * 8]
      const foot = lerpV(QANKLE, footOut, t)
      if (side === 0) {
        p.armN = ik(handLift[0], handLift[1], -1)
        p.legF = ik(foot[0], foot[1], 1)
        p.footF = lerp(182, 160, t)
      } else {
        p.armF = ik(handLift[0] - 2, handLift[1], -1)
        p.legN = ik(foot[0], foot[1], 1)
        p.footN = lerp(182, 160, t)
      }
      return p
    },
    repPhases(1.2, 1.0, 1.0, 0.3, ['out', 'in']),
    { alternate: true },
  )
}

export function catCow(): Motion {
  return motion(
    'side',
    (u) => {
      const t = Math.sin(u * Math.PI * 2) // -1 = cow, +1 = cat
      return quadBase({ spine: 7 * t, head: QTORSO + 8 + 34 * t, root: [QR[0], QR[1] - 1.5 * t] })
    },
    loopPhases(5.2, 'hold'),
  )
}

export function childsPose(): Motion {
  return motion(
    'side',
    (u) => {
      const R: Vec = [X - 30, GROUND - 24 + u * 0.8]
      const torso = 8
      const H: Vec = [X + 66, HY]
      return {
        root: R,
        torso,
        head: torso + 17,
        spine: 5,
        armN: ik(H[0], H[1], -1),
        armF: ik(H[0] - 2, H[1], -1),
        legN: ik(X - 33, GROUND - 6, 1),
        legF: ik(X - 35, GROUND - 6, 1),
        footN: 182,
        footF: 182,
      }
    },
    holdPhases(4.2),
  )
}

/** Bear plank: quadruped with the knees hovering an inch off the floor. */
export function bearPlank(): Motion {
  return motion('side', (u) => quadBase({ root: [QR[0], QR[1] - 4 - u * 0.6], legN: ik(QANKLE[0] + 4, QANKLE[1] - 4, 1), legF: ik(QANKLE[0] + 2, QANKLE[1] - 4, 1), footN: 150, footF: 150 }), holdPhases())
}

// ---- Seated -------------------------------------------------------------------------

/** Russian twist (side view): reclined torso, hands sweep from one hip to the other. */
export function russianTwist(o: { db?: boolean } = {}): Motion {
  return motion(
    'side',
    (u) => {
      const R: Vec = [X, GROUND - 11]
      const torso = -136
      const p: Pose = {
        root: R,
        torso,
        head: torso + 30,
        legN: ik(X + 52, AY - 6, 1),
        legF: ik(X + 49, AY - 6, 1),
        footN: -20,
        footF: -20,
        armN: fk(0, 0),
        armF: fk(0, 0),
      }
      const S = polar(R, torso, L.torso)
      const t = Math.sin(u * Math.PI * 2)
      const target: Vec = [S[0] + 30 + 6 * t, S[1] + 26 + 8 * t]
      p.armN = ik(target[0], target[1], -1)
      p.armF = ik(target[0] - 2 - 6 * t, target[1] - 4 * t, -1)
      if (o.db) p.dbBoth = 'horizontal'
      return p
    },
    loopPhases(1.8, 'hold'),
  )
}

// ---- Top view (lying face down, seen from above) ----------------------------------

function topBase(over: Partial<Pose> = {}): Pose {
  return {
    root: [X, 122],
    torso: -90,
    head: -90,
    legN: ik(X + 8, 122 + L.thigh + L.shin - 0.5, -1),
    legF: ik(X - 8, 122 + L.thigh + L.shin - 0.5, 1),
    footN: 90,
    footF: 90,
    armN: fk(80, 80),
    armF: fk(100, 100),
    ...over,
  }
}

export function proneRaise(kind: 'ytw' | 'snowAngel' | 'wPull'): Motion {
  if (kind === 'ytw') {
    const Y = topBase({ armN: fk(-52, -52), armF: fk(-128, -128) })
    const T = topBase({ armN: fk(-2, -2), armF: fk(182, 182) })
    const W = topBase({ armN: fk(38, -44), armF: fk(142, 224) })
    const fn = keyPoseFn([{ pose: Y }, { pose: T }, { pose: W }, { pose: Y }], 'top', false)
    return motion('top', (u) => fn(u), keyPhases([0.8, 0.8, 0.8], ['out', 'out', 'out'], [1.0, 1.0, 1.0]), { floor: false })
  }
  if (kind === 'snowAngel') {
    return motion(
      'top',
      (u) => {
        const t = smooth(u)
        const n = lerp(78, -58, t)
        const fF = lerp(102, 238, t)
        return topBase({ armN: fk(n, n), armF: fk(fF, fF) })
      },
      repPhases(2.0, 0.4, 2.0, 0.4, ['out', 'in']),
      { floor: false },
    )
  }
  return motion(
    'top',
    (u) => {
      const t = smooth(u)
      return topBase({ armN: fk(lerp(-58, 40, t), lerp(-58, -42, t)), armF: fk(lerp(238, 140, t), lerp(238, 222, t)) })
    },
    repPhases(1.4, 0.6, 1.4, 0.3, ['in', 'out']),
    { floor: false },
  )
}

