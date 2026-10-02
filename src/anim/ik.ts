import { DEG, angleOf, clamp, dist, polar } from './math'
import type { Vec } from './types'

export interface TwoBone {
  joint: Vec
  end: Vec
  reachable: boolean
}

/**
 * Analytical two-bone IK. `bend` picks which of the two solutions to use:
 * +1 rotates the first bone clockwise from the base→target line (on screen), -1 counter-clockwise.
 */
export function solveTwoBone(base: Vec, target: Vec, a: number, b: number, bend: 1 | -1): TwoBone {
  const d0 = dist(base, target)
  const maxReach = a + b - 1e-6
  const minReach = Math.abs(a - b) + 1e-6
  const reachable = d0 <= a + b + 0.75 && d0 >= Math.abs(a - b) - 0.75
  const d = clamp(d0, minReach, maxReach)
  const phi = angleOf(base, target)
  const cosAlpha = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)
  const alpha = Math.acos(cosAlpha) / DEG
  const theta1 = phi - bend * alpha
  const joint = polar(base, theta1, a)
  const end = polar(joint, angleOf(joint, target), b)
  return { joint, end, reachable }
}
