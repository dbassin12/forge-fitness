import { cycleDuration, sampleMotion } from './motion'
import { GROUND, L, solvePose } from './rig'
import type { Motion, PropSpec, Skeleton, Vec } from './types'

export interface ViewBox {
  x: number
  y: number
  w: number
  h: number
}

const cache = new WeakMap<Motion, ViewBox>()

function skeletonPoints(s: Skeleton): Vec[] {
  return [
    s.hip, s.hipN, s.hipF, s.shoulder, s.shoulderN, s.shoulderF, s.neck, s.head,
    s.elbowN, s.wristN, s.handN, s.elbowF, s.wristF, s.handF,
    s.kneeN, s.ankleN, s.toeN, s.heelN, s.kneeF, s.ankleF, s.toeF, s.heelF,
  ]
}

function propBounds(p: PropSpec): [number, number, number, number] {
  switch (p.kind) {
    case 'chair':
      return [p.x - 22, GROUND - 86, p.x + 22, GROUND]
    case 'bench':
      return [p.x - (p.width ?? 60) / 2, GROUND - (p.height ?? 42), p.x + (p.width ?? 60) / 2, GROUND]
    case 'wall':
      return [p.x, GROUND - 40, p.x + 10, GROUND]
    case 'table':
      return [p.x - (p.width ?? 90) / 2, GROUND - 70, p.x + (p.width ?? 90) / 2, GROUND]
    case 'step':
      return [p.x - (p.width ?? 50) / 2, GROUND - (p.height ?? 20), p.x + (p.width ?? 50) / 2, GROUND]
    case 'mat':
      return [p.x - (p.width ?? 150) / 2, GROUND - 3, p.x + (p.width ?? 150) / 2, GROUND]
    case 'bar':
      return [p.x - 40, p.y - 4, p.x + 40, p.y + 4]
  }
}

/** A fixed camera that keeps the whole movement (every phase, both sides) in frame. */
export function viewBoxFor(m: Motion, aspect = 4 / 3, pad = 14): ViewBox {
  const hit = cache.get(m)
  if (hit) return hit
  const D = cycleDuration(m)
  const cycles = m.alternate ? 2 : 1
  const N = 48 * cycles
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const grow = (x: number, y: number, r: number) => {
    minX = Math.min(minX, x - r)
    minY = Math.min(minY, y - r)
    maxX = Math.max(maxX, x + r)
    maxY = Math.max(maxY, y + r)
  }
  for (let i = 0; i <= N; i++) {
    const s = sampleMotion(m, (i / N) * D * cycles - 1e-6)
    const sk = solvePose(m.pose(s.u, s.side), m.view)
    for (const p of skeletonPoints(sk)) grow(p[0], p[1], 7)
    grow(sk.head[0], sk.head[1], L.headR + 2)
  }
  for (const p of m.props ?? []) {
    const [x0, y0, x1, y1] = propBounds(p)
    grow(x0, y0, 2)
    grow(x1, y1, 2)
  }
  if (m.view !== 'top') maxY = Math.max(maxY, GROUND + 6)
  minX -= pad
  maxX += pad
  minY -= pad
  maxY += pad * 0.5
  let w = maxX - minX
  let h = maxY - minY
  if (w / h > aspect) {
    const nh = w / aspect
    // Mostly grow upward so the floor stays in the lower part of the frame.
    const extra = nh - h
    minY -= extra * 0.72
    h = nh
  } else {
    const nw = h * aspect
    minX -= (nw - w) / 2
    w = nw
  }
  const vb = { x: round(minX), y: round(minY), w: round(w), h: round(h) }
  cache.set(m, vb)
  return vb
}

const round = (n: number) => Math.round(n * 10) / 10
