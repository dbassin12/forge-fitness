import { repPhases } from '../motion'
import type { Motion, Pose, Vec } from '../types'
import { AY, L, fk, ik, lerp, motion, polar, smooth, torsoFrame } from './common'

const X = 120

export interface HingeOpts {
  /** 'pair' = DB in each hand, 'one' = single DB in both hands (swing), 'none' = bodyweight. */
  load?: 'pair' | 'none' | 'one'
  hands?: 'hang' | 'behindHead' | 'hips' | 'cross'
  singleLeg?: boolean
  depth?: number
  fault?: 'roundBack' | 'squatty' | null
  tempo?: [number, number, number, number]
}

/** Hip hinge geometry: torso pitches forward while the hips travel back; knees stay soft. */
export function hingePose(k: number, o: HingeOpts = {}, side: 0 | 1 = 0): Pose {
  const kk = Math.max(0, Math.min(1, k)) * (o.depth ?? 1)
  const torso = lerp(-88, o.singleLeg ? -4 : -14, kk)
  const back = lerp(1, o.singleLeg ? 16 : 24, kk)
  const kneeBend = o.fault === 'squatty' ? 26 * kk : 7 * kk
  const legReach = L.thigh + L.shin - 0.6 - kneeBend
  const A: Vec = [X, AY]
  const hipX = X - back
  const hipY = A[1] - Math.sqrt(Math.max(1, legReach * legReach - (A[0] - hipX) ** 2))
  const pose: Pose = {
    root: [hipX, hipY],
    torso,
    spine: o.fault === 'roundBack' ? 8 * kk : 0,
    head: torso + (o.fault === 'roundBack' ? 25 * kk : 4),
    legN: ik(A[0] + 2, A[1], 1),
    legF: ik(A[0] - 1, A[1], 1),
    armN: fk(91, 90),
    armF: fk(93, 92),
  }
  const f = torsoFrame(pose)
  if (o.hands === 'behindHead') {
    const head = polar(f.shoulder, torso, L.neck + L.headR)
    const t = f.at(head, -6, 0)
    pose.armN = ik(t[0], t[1], 1)
    pose.armF = ik(t[0] - 2, t[1], 1)
  } else if (o.hands === 'cross') {
    const t = f.at(f.shoulder, 8, -10)
    pose.armN = ik(t[0], t[1], -1)
    pose.armF = ik(t[0] - 1, t[1] + 1, -1)
  } else if (o.hands === 'hips') {
    const t = f.at(pose.root, 4, 8)
    pose.armN = ik(t[0], t[1], -1)
    pose.armF = ik(t[0] - 2, t[1], -1)
  }
  if (o.load === 'pair') {
    pose.dbN = 'end'
    pose.dbF = 'end'
  }
  if (o.singleLeg) {
    // Free leg rises behind in line with the torso; the opposite hand carries the weight.
    const freeAngle = lerp(96, torso + 180 - 4, smooth(kk))
    const free = fk(freeAngle, freeAngle + lerp(0, 6, kk))
    if (side === 0) {
      pose.legF = free
      pose.legN = ik(A[0] + 2, A[1], 1)
      pose.footF = freeAngle + 90
    } else {
      pose.legN = free
      pose.legF = ik(A[0] - 1, A[1], 1)
      pose.footN = freeAngle + 90
    }
    if (o.load !== 'none') {
      pose.dbN = side === 0 ? null : 'end'
      pose.dbF = side === 0 ? 'end' : null
    }
  }
  return pose
}

export function hinge(o: HingeOpts = {}): Motion {
  const t = o.tempo ?? [1.8, 0.3, 1.2, 0.5]
  return motion('side', (u, side) => hingePose(u, o, side), repPhases(...t), { alternate: !!o.singleLeg })
}

/** Kettlebell-style dumbbell swing: hinge back, then snap the hips so the DB floats to chest height. */
export function swing(): Motion {
  return motion(
    'side',
    (u) => {
      // u = 0 top (arms forward at chest height), u = 1 bottom (DB between the legs).
      const kk = u
      const torso = lerp(-89, -22, kk)
      const back = lerp(0, 20, kk)
      const legReach = L.thigh + L.shin - 0.6 - 14 * kk
      const hipX = X - back
      const hipY = AY - Math.sqrt(Math.max(1, legReach * legReach - (X - hipX) ** 2))
      const arm = lerp(-2, 116, smooth(kk))
      return {
        root: [hipX, hipY],
        torso,
        head: torso + 6,
        legN: ik(X + 4, AY, 1),
        legF: ik(X - 4, AY, 1),
        armN: fk(arm, arm),
        armF: fk(arm + 2, arm + 2),
        dbBoth: 'vertical',
      }
    },
    [
      { to: 1, dur: 0.55, label: 'down', ease: 'inOut' },
      { to: 0, dur: 0.5, label: 'up', ease: 'out' },
      { dur: 0.15, label: 'hold' },
    ],
  )
}
