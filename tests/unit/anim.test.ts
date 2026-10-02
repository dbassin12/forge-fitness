import { describe, expect, it } from 'vitest'
import { DEMO_MOTIONS } from '@/anim/demo'
import { cycleDuration, sampleMotion } from '@/anim/motion'
import { GROUND, L, solvePose } from '@/anim/rig'
import { solveTwoBone } from '@/anim/ik'
import { dist } from '@/anim/math'
import type { Skeleton, Vec } from '@/anim/types'

const bones = (s: Skeleton): Array<[Vec, Vec, number, string]> => [
  [s.shoulderN, s.elbowN, L.upperArm, 'upperArmN'],
  [s.elbowN, s.wristN, L.forearm, 'forearmN'],
  [s.shoulderF, s.elbowF, L.upperArm, 'upperArmF'],
  [s.elbowF, s.wristF, L.forearm, 'forearmF'],
  [s.hipN, s.kneeN, L.thigh, 'thighN'],
  [s.kneeN, s.ankleN, L.shin, 'shinN'],
  [s.hipF, s.kneeF, L.thigh, 'thighF'],
  [s.kneeF, s.ankleF, L.shin, 'shinF'],
]

describe('two-bone IK', () => {
  it('reaches reachable targets and preserves bone lengths', () => {
    const r = solveTwoBone([0, 0], [30, 30], 27, 25, 1)
    expect(r.reachable).toBe(true)
    expect(dist([0, 0], r.joint)).toBeCloseTo(27, 6)
    expect(dist(r.joint, r.end)).toBeCloseTo(25, 6)
    expect(dist(r.end, [30, 30])).toBeLessThan(1e-6)
  })
  it('points straight at out-of-reach targets', () => {
    const r = solveTwoBone([0, 0], [200, 0], 27, 25, 1)
    expect(r.reachable).toBe(false)
    expect(r.end[0]).toBeCloseTo(52, 3)
    expect(r.end[1]).toBeCloseTo(0, 1)
  })
  it('bend sign selects the side of the joint', () => {
    const down = solveTwoBone([0, 0], [0, 40], 27, 25, 1)
    const up = solveTwoBone([0, 0], [0, 40], 27, 25, -1)
    expect(down.joint[0]).toBeGreaterThan(0)
    expect(up.joint[0]).toBeLessThan(0)
  })
})

describe('motion invariants', () => {
  for (const d of DEMO_MOTIONS) {
    it(`${d.id}: finite, rigid, above the floor, contacts reachable`, () => {
      const m = d.motion
      const D = cycleDuration(m) * (m.alternate ? 2 : 1)
      const N = 32
      // Times at which the figure is "at rest" (phase boundaries): planted contacts must hold there.
      const rest = new Set<number>()
      let acc = 0
      for (let c = 0; c < (m.alternate ? 2 : 1); c++) {
        for (const ph of m.phases) {
          rest.add(Math.round(acc * 1000))
          acc += ph.dur
        }
      }
      const times = [...Array.from({ length: N + 1 }, (_, i) => (i / N) * D), ...[...rest].map((r) => r / 1000)]
      for (const t of times) {
        const s = sampleMotion(m, t)
        const atRest = rest.has(Math.round(t * 1000))
        const pose = m.pose(s.u, s.side)
        const sk = solvePose(pose, m.view)
        for (const v of Object.values(sk)) {
          if (Array.isArray(v)) {
            expect(Number.isFinite(v[0]) && Number.isFinite(v[1])).toBe(true)
          }
        }
        for (const [a, b, len, name] of bones(sk)) {
          expect(Math.abs(dist(a, b) - len), `${name} length`).toBeLessThan(1e-6)
        }
        if (m.view !== 'top') {
          const lowest = Math.max(sk.toeN[1], sk.toeF[1], sk.heelN[1], sk.heelF[1], sk.handN[1], sk.handF[1], sk.kneeN[1], sk.kneeF[1], sk.head[1] + L.headR - 1)
          expect(lowest, 'nothing sinks below the floor').toBeLessThan(GROUND + 4)
        }
        // Planted contacts: every IK target must be (almost) reachable whenever the figure is at rest.
        if (!atRest) continue
        for (const [spec, base, a, b] of [
          [pose.armN, sk.shoulderN, L.upperArm, L.forearm],
          [pose.armF, sk.shoulderF, L.upperArm, L.forearm],
          [pose.legN, sk.hipN, L.thigh, L.shin],
          [pose.legF, sk.hipF, L.thigh, L.shin],
        ] as const) {
          if ('ik' in spec) {
            const over = dist(base, spec.ik) - (a + b)
            expect(over, 'IK target overshoot').toBeLessThan(4)
          }
        }
      }
    })
  }
})
