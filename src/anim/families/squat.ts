import { repPhases, holdPhases } from '../motion'
import type { Motion, Pose, PropSpec, Vec } from '../types'
import { AY, L, bump, fk, ik, lerp, motion, polar, seg, smooth, torsoFrame } from './common'

export type SquatArms = 'forward' | 'hips' | 'goblet' | 'rack' | 'sides' | 'cross' | 'behindHead' | 'overhead' | 'press'

export interface SquatOpts {
  depth?: number
  arms?: SquatArms
  box?: boolean
  jump?: boolean
  tempo?: [number, number, number, number]
  /** Isometric hold at a fixed depth (wall sit uses `wall`). */
  hold?: number
  wall?: boolean
  fault?: 'kneesForward' | 'roundBack' | 'heelsUp' | null
}

const X = 120

/** Side-view squat geometry for depth k ∈ [0, 1]. */
export function squatPose(k: number, o: SquatOpts = {}): Pose {
  const kk = Math.max(0, Math.min(1, k))
  const A: Vec = [X, AY]
  const shinLean = o.wall ? lerp(3, 6, kk) : lerp(4, o.fault === 'kneesForward' ? 44 : 30, kk)
  const knee: Vec = [A[0] + L.shin * Math.sin((shinLean * Math.PI) / 180), A[1] - L.shin * Math.cos((shinLean * Math.PI) / 180)]
  const thigh = lerp(3, 86, kk)
  const hip: Vec = [knee[0] - L.thigh * Math.sin((thigh * Math.PI) / 180), knee[1] - L.thigh * Math.cos((thigh * Math.PI) / 180)]
  const lean = o.wall ? lerp(2, 4, kk) : lerp(5, o.arms === 'goblet' || o.arms === 'rack' ? 30 : 40, kk)
  const torso = -90 + lean
  const spine = o.fault === 'roundBack' ? 7 * kk : 0
  const pose: Pose = {
    root: hip,
    torso,
    spine,
    head: torso + (o.fault === 'roundBack' ? 18 * kk : -4 * kk),
    legN: ik(A[0] + 2, A[1]),
    legF: ik(A[0] - 1, A[1]),
    footN: o.fault === 'heelsUp' ? -25 * kk : 0,
    footF: o.fault === 'heelsUp' ? -25 * kk : 0,
    armN: fk(93, 91),
    armF: fk(97, 94),
  }
  const f = torsoFrame(pose)
  const s = f.shoulder
  const ks = smooth(kk)
  switch (o.arms ?? 'forward') {
    case 'forward':
      pose.armN = fk(lerp(93, -2, ks), lerp(91, -4, ks))
      pose.armF = fk(lerp(97, 2, ks), lerp(94, 0, ks))
      break
    case 'cross': {
      const t = f.at(s, 7, -9)
      pose.armN = ik(t[0], t[1], -1)
      pose.armF = ik(t[0] - 2, t[1] + 2, -1)
      break
    }
    case 'hips': {
      const t = f.at(hip, 4, 8)
      pose.armN = ik(t[0], t[1], -1)
      pose.armF = ik(t[0] - 2, t[1], -1)
      break
    }
    case 'goblet': {
      const t = f.at(s, 15, -17)
      pose.armN = ik(t[0], t[1], -1)
      pose.armF = ik(t[0] - 1.5, t[1] + 1, -1)
      pose.dbBoth = 'vertical'
      break
    }
    case 'rack': {
      const t = f.at(s, 9, -1)
      pose.armN = ik(t[0], t[1], -1)
      pose.armF = ik(t[0] - 2, t[1], -1)
      pose.dbN = 'end'
      pose.dbF = 'end'
      break
    }
    case 'press': {
      // Thruster: rack at the bottom, overhead at the top (k = 0 standing).
      const rack = f.at(s, 9, -1)
      const top = polar(s, -88, L.upperArm + L.forearm - 2)
      const t: Vec = [lerp(top[0], rack[0], seg(kk, 0, 0.35)), lerp(top[1], rack[1], seg(kk, 0, 0.35))]
      pose.armN = ik(t[0], t[1], -1)
      pose.armF = ik(t[0] - 2, t[1], -1)
      pose.dbN = 'end'
      pose.dbF = 'end'
      break
    }
    case 'sides':
      pose.armN = fk(91, 90)
      pose.armF = fk(93, 92)
      pose.dbN = 'end'
      pose.dbF = 'end'
      break
    case 'behindHead': {
      const head = polar(s, torso, L.neck + L.headR)
      const t = f.at(head, -7, 1)
      pose.armN = ik(t[0], t[1], 1)
      pose.armF = ik(t[0] - 2, t[1], 1)
      break
    }
    case 'overhead':
      pose.armN = fk(torso - 4, torso - 4)
      pose.armF = fk(torso, torso)
      break
  }
  return pose
}

export function squat(o: SquatOpts = {}): Motion {
  const depth = o.depth ?? 1
  const props: PropSpec[] = []
  if (o.box) {
    // Seat edge just behind where the hips bottom out.
    const bottom = squatPose(depth, o)
    props.push({ kind: 'chair', x: bottom.root[0] - 14, facing: 1 })
  }
  if (o.wall) {
    const p = squatPose(o.hold ?? depth, o)
    props.push({ kind: 'wall', x: p.root[0] - 11 - 14 })
  }

  if (o.hold !== undefined || o.wall) {
    const k = o.hold ?? depth
    return motion(
      'side',
      (u) => {
        const p = squatPose(k, { ...o, arms: o.arms ?? (o.wall ? 'cross' : 'forward') })
        // Breathing sway for holds.
        return { ...p, root: [p.root[0], p.root[1] + bump(u) * 0.8] }
      },
      holdPhases(),
      { props },
    )
  }

  if (o.jump) {
    // u: 0 stand → 0.4 bottom → 0.65 airborne → 0.85 landing → 1 stand.
    return motion(
      'side',
      (u) => {
        let k: number
        let lift = 0
        if (u < 0.4) k = smooth(u / 0.4) * depth * 0.8
        else if (u < 0.55) k = lerp(depth * 0.8, 0, smooth((u - 0.4) / 0.15))
        else if (u < 0.8) {
          k = 0
          lift = Math.sin(((u - 0.55) / 0.25) * Math.PI) * 22
        } else k = Math.sin(((u - 0.8) / 0.2) * Math.PI) * 0.45
        const p = squatPose(k, { ...o, arms: 'forward' })
        if (lift) {
          return {
            ...p,
            root: [p.root[0], p.root[1] - lift],
            legN: ik(X + 3, AY - lift + 4),
            legF: ik(X, AY - lift + 4),
            footN: 28,
            footF: 28,
            armN: fk(-60, -62),
            armF: fk(-55, -58),
          }
        }
        return p
      },
      [
        { to: 0.4, dur: 0.7, label: 'down', ease: 'inOut' },
        { to: 0.55, dur: 0.18, label: 'up', ease: 'linear' },
        { to: 0.8, dur: 0.38, label: 'jump', ease: 'linear' },
        { to: 1, dur: 0.35, label: 'down', ease: 'out' },
        { dur: 0.3, label: 'rest' },
      ],
    )
  }

  const t = o.tempo ?? [1.6, 0.3, 1.1, 0.4]
  return motion('side', (u) => squatPose(u * depth, o), repPhases(...t), { props })
}

/** Front-view squat / Cossack / sumo for knee tracking and lateral moves. */
export function squatFront(o: { width?: number; depth?: number; fault?: 'kneeCave' | null; arms?: 'forward' | 'cross' } = {}): Motion {
  const w = o.width ?? 18
  const depth = o.depth ?? 1
  return motion(
    'front',
    (u) => {
      const k = smooth(u) * depth
      const hipY = lerp(98, 136, k)
      const bendN: 1 | -1 = o.fault === 'kneeCave' ? -1 : 1
      const bendF: 1 | -1 = o.fault === 'kneeCave' ? 1 : -1
      const raise = lerp(92, 0, k)
      return {
        root: [X, hipY],
        torso: -90,
        legN: ik(X + w, AY, bendN),
        legF: ik(X - w, AY, bendF),
        footN: 40,
        footF: 140,
        armN: o.arms === 'cross' ? ik(X + 6, 70, 1) : fk(lerp(86, 60, k) - raise * 0, lerp(88, 62, k)),
        armF: o.arms === 'cross' ? ik(X - 6, 72, -1) : fk(lerp(94, 120, k), lerp(92, 118, k)),
      }
    },
    repPhases(1.6, 0.3, 1.1, 0.4),
  )
}
