import type { EaseName, Vec } from './types'

export const DEG = Math.PI / 180

export const v = (x: number, y: number): Vec => [x, y]
export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]]
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]]
export const scale = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s]
export const len = (a: Vec): number => Math.hypot(a[0], a[1])
export const dist = (a: Vec, b: Vec): number => Math.hypot(a[0] - b[0], a[1] - b[1])
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpV = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/** Unit vector for a world angle in degrees (SVG space: 90° points down). */
export const dir = (deg: number): Vec => [Math.cos(deg * DEG), Math.sin(deg * DEG)]
/** Point at `length` from `from` along `deg`. */
export const polar = (from: Vec, deg: number, length: number): Vec => add(from, scale(dir(deg), length))
export const angleOf = (a: Vec, b: Vec): number => Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG

/** Smooth 0→1→0 bump, peak at t = 0.5. */
export const bump = (t: number) => Math.sin(clamp(t, 0, 1) * Math.PI)

/** Map t from [a, b] to [0, 1], clamped. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1)

export const smooth = (t: number) => t * t * (3 - 2 * t)

export function ease(name: EaseName | undefined, t: number): number {
  const x = clamp(t, 0, 1)
  switch (name) {
    case 'linear':
      return x
    case 'in':
      return x * x * x
    case 'out':
      return 1 - Math.pow(1 - x, 3)
    case 'outBack': {
      const c1 = 1.4
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
    }
    case 'inOut':
    default:
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
  }
}
