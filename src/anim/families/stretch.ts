import { holdPhases, loopPhases } from '../motion'
import type { Motion, Pose, Vec } from '../types'
import { AY, GROUND, HY, L, STAND_HIP_Y, angleOf, fk, ik, keyPhases, keyPoseFn, lerp, motion, polar, smooth, standPose } from './common'
import { hingePose } from './hinge'

const X = 120

/** Arm circles (front view): arms out to the sides tracing small circles. */
export function armCircles(): Motion {
  return motion(
    'front',
    (u) => {
      const a = Math.sin(u * Math.PI * 2) * 14
      return {
        root: [X, STAND_HIP_Y + 1.2],
        torso: -90,
        legN: ik(X + 10, AY, 1),
        legF: ik(X - 10, AY, -1),
        footN: 70,
        footF: 110,
        armN: fk(-4 + a, -4 + a),
        armF: fk(184 - a, 184 - a),
      }
    },
    loopPhases(1.1, 'out'),
  )
}

/** Hip circles (front view): hands on hips, pelvis draws a circle. */
export function hipCircles(): Motion {
  return motion(
    'front',
    (u) => {
      const cx = X + Math.cos(u * Math.PI * 2) * 7
      const cy = STAND_HIP_Y + 3 + Math.sin(u * Math.PI * 2) * 2
      return {
        root: [cx, cy],
        torso: -90 - Math.cos(u * Math.PI * 2) * 5,
        legN: ik(X + 14, AY, 1),
        legF: ik(X - 14, AY, -1),
        footN: 70,
        footF: 110,
        armN: ik(cx + 14, cy - 6, 1),
        armF: ik(cx - 14, cy - 6, -1),
      }
    },
    loopPhases(2.4, 'out'),
  )
}

/** Leg swings holding a wall (side view). */
export function legSwings(): Motion {
  const wallX = X + 34
  return motion(
    'side',
    (u) => {
      const a = 90 + Math.sin(u * Math.PI * 2) * 52
      const p = standPose(X)
      p.legN = fk(a, a + 6)
      p.footN = a - 90
      p.legF = ik(X - 1, AY, 1)
      const S = polar(p.root, p.torso, L.torso)
      p.armF = ik(wallX - 2, S[1] + 6, -1)
      return p
    },
    loopPhases(1.6, 'out'),
    { props: [{ kind: 'wall', x: wallX }] },
  )
}

/** Half-kneeling hip-flexor stretch: rear knee down, hips ease forward. */
export function hipFlexorStretch(): Motion {
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const front: Vec = [X + 26, AY]
      const rearKneeAnkle: Vec = [X - 50, GROUND - 7]
      const root: Vec = [X - 14 + 7 * t, 134 + 1 * t]
      const torso = -92 - 4 * t
      const S = polar(root, torso, L.torso)
      return {
        root,
        torso,
        head: torso,
        spine: -2 * t,
        legN: ik(front[0], front[1], 1),
        legF: ik(rearKneeAnkle[0], rearKneeAnkle[1], 1),
        footF: 182,
        armN: fk(lerp(-70, -95, t), lerp(-75, -100, t)),
        armF: ik(S[0] + 4, S[1] + 40, -1),
      }
    },
    holdPhases(4.4),
  )
}

/** Standing hamstring stretch: fold forward from the hips with long legs, hands toward the shins. */
export function hamstringStretch(): Motion {
  return motion(
    'side',
    (u) => {
      const torso = 38 + u * 4
      const root: Vec = [X - 13, STAND_HIP_Y + 2]
      return {
        root,
        torso,
        head: torso + 20,
        spine: 3,
        legN: ik(X + 2, AY, 1),
        legF: ik(X - 1, AY, 1),
        armN: fk(118, 118),
        armF: fk(120, 120),
      }
    },
    holdPhases(4.4),
  )
}

/** Calf stretch against a wall: rear heel down, lean in. */
export function calfStretch(): Motion {
  const wallX = X + 58
  return motion(
    'side',
    (u) => {
      const lean = 4 + u * 2
      const root: Vec = [X + 6 + lean, 108]
      const torso = -74 + lean
      const S = polar(root, torso, L.torso)
      return {
        root,
        torso,
        head: torso,
        legN: ik(X + 30, AY, 1),
        legF: ik(X - 24, AY, 1),
        armN: ik(wallX - 2, S[1] - 2, -1),
        armF: ik(wallX - 2, S[1] + 2, -1),
      }
    },
    holdPhases(4.4),
    { props: [{ kind: 'wall', x: wallX }] },
  )
}

/** Chest opener: hands reach back and down, chest lifts. */
export function chestOpener(): Motion {
  return motion(
    'side',
    (u) => {
      const t = smooth(u)
      const p = standPose(X)
      p.spine = -3 * t
      p.head = -96
      const a = lerp(110, 146, t)
      p.armN = fk(a, a)
      p.armF = fk(a + 3, a + 3)
      return p
    },
    holdPhases(4),
  )
}

/** Figure-4 glute stretch, lying on the back: one ankle crossed over the other knee, hands pull the thigh in. */
export function figureFour(): Motion {
  return motion(
    'side',
    (u) => {
      const root: Vec = [X, GROUND - 9.5]
      const thigh = -112 - u * 4
      const knee = polar(root, thigh, L.thigh)
      const cross: Vec = [knee[0] + 4, knee[1] - 2]
      const p: Pose = {
        root,
        torso: 180,
        head: 186,
        legN: fk(thigh, -8),
        legF: ik(cross[0], cross[1], -1),
        footN: -80,
        footF: -30,
        armN: ik(knee[0] - 3, knee[1] + 6, 1),
        armF: ik(knee[0] - 5, knee[1] + 8, 1),
      }
      return p
    },
    holdPhases(4.4),
  )
}

/** World's greatest stretch: lunge, hand down inside the front foot, top arm reaches to the ceiling. */
export function worldsGreatest(): Motion {
  const stand = standPose(X)
  const lungeDown: Pose = {
    root: [X - 32, 128],
    torso: 12,
    head: 18,
    legN: ik(X + 4, AY, 1),
    legF: ik(X - 74, AY - 7, 1),
    footF: 52,
    armN: ik(X + 6, HY - 1, -1),
    armF: ik(X - 4, HY - 1, -1),
  }
  const reach: Pose = { ...lungeDown, torso: 4, armN: fk(-82, -82), head: -40 }
  const fn = keyPoseFn([{ pose: stand }, { pose: lungeDown }, { pose: reach }, { pose: lungeDown }, { pose: stand }], 'side')
  return motion('side', (u) => fn(u), keyPhases([1.2, 1.0, 1.0, 1.2], ['down', 'reach', 'in', 'up'], [0.2, 1.2, 0.2, 0.4]))
}

/** Inchworm: fold, walk the hands out to a plank, walk back. */
export function inchworm(): Motion {
  const stand = standPose(X)
  const fold: Pose = { ...hingePose(1, { load: 'none', depth: 1.15 }), armN: ik(X + 14, HY, -1), armF: ik(X + 12, HY, -1) }
  fold.torso = 40
  fold.head = 52
  fold.root = [X - 10, 96]
  const mid: Pose = { ...fold, root: [X - 2, 108], torso: 18, head: 24, armN: ik(X + 52, HY, -1), armF: ik(X + 50, HY, -1) }
  const S: Vec = [X + 92, HY - 50]
  const P: Vec = [X, GROUND - 14]
  const R: Vec = [P[0] + (S[0] - P[0]) * (78 / 128), P[1] + (S[1] - P[1]) * (78 / 128)]
  const plank: Pose = {
    root: R,
    torso: angleOf(R, S),
    head: angleOf(R, S) + 4,
    armN: ik(S[0] + 2, HY, -1),
    armF: ik(S[0], HY, -1),
    legN: ik(P[0], P[1], 1),
    legF: ik(P[0] - 2, P[1], 1),
    footN: 74,
    footF: 74,
  }
  const fn = keyPoseFn([{ pose: stand }, { pose: fold }, { pose: mid }, { pose: plank }, { pose: mid }, { pose: fold }, { pose: stand }], 'side')
  return motion('side', (u) => fn(u), keyPhases([1.2, 0.9, 0.9, 0.9, 0.9, 1.2], ['down', 'out', 'out', 'in', 'in', 'up'], [0.2, 0, 0.6, 0, 0, 0.4]))
}

/** Downward dog ↔ cobra flow. */
export function dogToCobra(): Motion {
  const H: Vec = [X + 64, HY]
  const feet: Vec = [X - 17, AY - 4]
  const dogHip: Vec = [X + 4, 96]
  const dog: Pose = {
    root: dogHip,
    torso: angleOf(dogHip, H) - 2,
    head: angleOf(dogHip, H) + 4,
    armN: ik(H[0], H[1], -1),
    armF: ik(H[0] - 2, H[1], -1),
    legN: ik(feet[0], feet[1], 1),
    legF: ik(feet[0] - 2, feet[1], 1),
    footN: 22,
    footF: 22,
  }
  const cobraHip: Vec = [X + 4, GROUND - 10]
  const cobra: Pose = {
    root: cobraHip,
    torso: -40,
    head: -54,
    spine: -7,
    armN: ik(H[0], H[1], -1),
    armF: ik(H[0] - 2, H[1], -1),
    legN: fk(182, 182),
    legF: fk(183, 183),
    footN: 120,
    footF: 120,
  }
  const fn = keyPoseFn([{ pose: dog }, { pose: cobra }, { pose: dog }], 'side')
  return motion('side', (u) => fn(u), keyPhases([1.6, 1.6], ['down', 'up'], [1.4, 1.4]))
}
