import { GROUND, L, STROKE } from './rig'
import { add, angleOf, dir, lerpV, polar, scale } from './math'
import type { DumbbellMode, Pose, PropSpec, Skeleton, Vec } from './types'

/** Drawing primitives — one stable list per motion so the live renderer can patch attributes. */
export type Shape =
  | { id: string; kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; width: number; opacity?: number }
  | { id: string; kind: 'circle'; cx: number; cy: number; r: number; fill: string; stroke?: string; width?: number; opacity?: number }
  | { id: string; kind: 'path'; d: string; fill?: string; stroke?: string; width?: number; opacity?: number; cap?: 'round' | 'butt'; join?: 'round' | 'miter' }
  | { id: string; kind: 'rect'; x: number; y: number; w: number; h: number; rx?: number; fill: string; stroke?: string; width?: number; opacity?: number }
  | { id: string; kind: 'polygon'; points: string; fill: string; stroke?: string; width?: number; opacity?: number }
  | { id: string; kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; opacity?: number }

export type SegmentGroup =
  | 'chest'
  | 'back'
  | 'core'
  | 'shoulders'
  | 'upperArms'
  | 'forearms'
  | 'glutes'
  | 'thighs'
  | 'calves'

export interface Palette {
  near: string
  far: string
  torso: string
  head: string
  face: string
  highlight: string
  prop: string
  propEdge: string
  iron: string
  ironRim: string
  floor: string
  shadow: string
}

export const DARK_PALETTE: Palette = {
  near: '#d9e0ea',
  far: '#7d8898',
  torso: '#e8edf4',
  head: '#e8edf4',
  face: '#2b323c',
  highlight: '#ff6a3d',
  prop: '#2f3742',
  propEdge: '#4a5563',
  iron: '#5b6573',
  ironRim: '#9aa4b2',
  floor: '#2a313b',
  shadow: '#000000',
}

export const LIGHT_PALETTE: Palette = {
  near: '#3b4452',
  far: '#9aa4b2',
  torso: '#2b323c',
  head: '#2b323c',
  face: '#e8edf4',
  highlight: '#f0532a',
  prop: '#d5dae1',
  propEdge: '#b4bcc7',
  iron: '#4b5563',
  ironRim: '#1f2937',
  floor: '#cdd3db',
  shadow: '#000000',
}

export interface DrawOptions {
  palette?: Palette
  /** Highlight intensity per group, 0..1. */
  highlight?: Partial<Record<SegmentGroup, number>>
  props?: PropSpec[]
  floor?: boolean
  /** Horizontal extent for the floor line. */
  floorFrom?: number
  floorTo?: number
  /** Tint the whole figure (used for "wrong form" demos). */
  tint?: string | null
}

const f = (n: number) => Math.round(n * 100) / 100

function line(id: string, a: Vec, b: Vec, stroke: string, width: number, opacity?: number): Shape {
  return { id, kind: 'line', x1: f(a[0]), y1: f(a[1]), x2: f(b[0]), y2: f(b[1]), stroke, width, opacity }
}

function hexagon(c: Vec, r: number, rot = 0): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const p = polar(c, rot + i * 60, r)
    pts.push(`${f(p[0])},${f(p[1])}`)
  }
  return pts.join(' ')
}

/** Dumbbell shapes (always 4 shapes so the list stays stable). */
function dumbbell(id: string, at: Vec | null, mode: DumbbellMode | null | undefined, pal: Palette, dim: boolean): Shape[] {
  const hidden = !at || !mode
  const c: Vec = at ?? [0, 0]
  const op = hidden ? 0 : 1
  const iron = dim ? '#3d4550' : pal.iron
  const rim = dim ? '#6b7584' : pal.ironRim
  if (mode === 'vertical' || mode === 'horizontal') {
    const axis = mode === 'vertical' ? 90 : 0
    const a = polar(c, axis, -9)
    const b = polar(c, axis, 9)
    const plate = (p: Vec) => {
      const d = dir(axis + 90)
      const p1 = add(p, scale(d, 7.5))
      const p2 = add(p, scale(d, -7.5))
      return { p1, p2 }
    }
    const pa = plate(a)
    const pb = plate(b)
    return [
      line(`${id}-h`, a, b, rim, 3.2, op),
      line(`${id}-p1`, pa.p1, pa.p2, iron, 6.5, op),
      line(`${id}-p2`, pb.p1, pb.p2, iron, 6.5, op),
      { id: `${id}-c`, kind: 'circle', cx: f(c[0]), cy: f(c[1]), r: 0.01, fill: rim, opacity: 0 },
    ]
  }
  return [
    { id: `${id}-h`, kind: 'polygon', points: hexagon(c, 8, 0), fill: iron, stroke: rim, width: 1.4, opacity: op },
    { id: `${id}-p1`, kind: 'circle', cx: f(c[0]), cy: f(c[1]), r: 3.2, fill: rim, opacity: op },
    { id: `${id}-p2`, kind: 'circle', cx: f(c[0]), cy: f(c[1]), r: 1.4, fill: iron, opacity: op },
    { id: `${id}-c`, kind: 'circle', cx: f(c[0]), cy: f(c[1]), r: 0.01, fill: rim, opacity: 0 },
  ]
}

export function propShapes(props: PropSpec[] | undefined, pal: Palette): Shape[] {
  const out: Shape[] = []
  ;(props ?? []).forEach((p, i) => {
    const id = `prop${i}`
    switch (p.kind) {
      case 'chair': {
        const seatY = GROUND - 42
        const w = 40
        const x = p.x - w / 2
        const back = (p.facing ?? 1) === 1 ? x : x + w
        out.push({ id: `${id}-seat`, kind: 'rect', x, y: seatY, w, h: 5, rx: 2, fill: pal.prop, stroke: pal.propEdge, width: 1 })
        out.push(line(`${id}-l1`, [x + 4, seatY + 5], [x + 4, GROUND], pal.propEdge, 3))
        out.push(line(`${id}-l2`, [x + w - 4, seatY + 5], [x + w - 4, GROUND], pal.propEdge, 3))
        out.push(line(`${id}-back`, [back + ((p.facing ?? 1) === 1 ? 2 : -2), seatY], [back + ((p.facing ?? 1) === 1 ? 2 : -2), seatY - 40], pal.propEdge, 4))
        break
      }
      case 'bench': {
        const h = p.height ?? 42
        const w = p.width ?? 60
        const x = p.x - w / 2
        out.push({ id: `${id}-top`, kind: 'rect', x, y: GROUND - h, w, h: 6, rx: 2, fill: pal.prop, stroke: pal.propEdge, width: 1 })
        out.push(line(`${id}-l1`, [x + 6, GROUND - h + 6], [x + 6, GROUND], pal.propEdge, 3))
        out.push(line(`${id}-l2`, [x + w - 6, GROUND - h + 6], [x + w - 6, GROUND], pal.propEdge, 3))
        break
      }
      case 'wall':
        out.push({ id: `${id}-wall`, kind: 'rect', x: p.x, y: 0, w: 14, h: GROUND, fill: pal.prop, stroke: pal.propEdge, width: 1 })
        break
      case 'table': {
        const w = p.width ?? 90
        const x = p.x - w / 2
        const top = GROUND - 68
        out.push({ id: `${id}-top`, kind: 'rect', x, y: top, w, h: 6, rx: 2, fill: pal.prop, stroke: pal.propEdge, width: 1 })
        out.push(line(`${id}-l1`, [x + 5, top + 6], [x + 5, GROUND], pal.propEdge, 3.5))
        out.push(line(`${id}-l2`, [x + w - 5, top + 6], [x + w - 5, GROUND], pal.propEdge, 3.5))
        break
      }
      case 'step': {
        const h = p.height ?? 20
        const w = p.width ?? 50
        out.push({ id: `${id}-step`, kind: 'rect', x: p.x - w / 2, y: GROUND - h, w, h, rx: 2, fill: pal.prop, stroke: pal.propEdge, width: 1 })
        break
      }
      case 'mat': {
        const w = p.width ?? 150
        out.push({ id: `${id}-mat`, kind: 'rect', x: p.x - w / 2, y: GROUND - 2.5, w, h: 3, rx: 1.5, fill: '#33507a', opacity: 0.55 })
        break
      }
      case 'bar':
        out.push(line(`${id}-bar`, [p.x - 40, p.y], [p.x + 40, p.y], pal.ironRim, 3.5))
        break
    }
  })
  return out
}

/** Point on the quadratic spine curve hip → ctrl → shoulder. */
function spineAt(s: Skeleton, t: number): Vec {
  const a = lerpV(s.hip, s.spineCtrl, t)
  const b = lerpV(s.spineCtrl, s.shoulder, t)
  return lerpV(a, b, t)
}

/** Side-view torso: a tapered silhouette (chest fuller than the waist) around the spine curve. */
function sideTorsoPath(s: Skeleton): string {
  // [t along spine, front half-width (chest side), back half-width]
  const prof: Array<[number, number, number]> = [
    [0, 8.6, 9.4],
    [0.22, 7.6, 8.8],
    [0.45, 8.4, 8.6],
    [0.68, 10.6, 9.2],
    [0.86, 10.4, 9.6],
    [1, 8.2, 8.6],
  ]
  const fwd = dir(s.torsoAngle + 90)
  const front: string[] = []
  const back: string[] = []
  for (const [t, wf, wb] of prof) {
    const p = spineAt(s, t)
    front.push(`${f(p[0] + fwd[0] * wf)},${f(p[1] + fwd[1] * wf)}`)
    back.push(`${f(p[0] - fwd[0] * wb)},${f(p[1] - fwd[1] * wb)}`)
  }
  return `M${front.join(' L')} L${back.reverse().join(' L')} Z`
}

/** Front-view torso: shoulders wider than the waist, hips in between. */
function frontTorsoPoints(s: Skeleton): string {
  const across = dir(s.torsoAngle + 90)
  const pts: Vec[] = []
  const prof: Array<[number, number]> = [
    [0, 11],
    [0.42, 11.5],
    [0.78, 15.5],
    [1, 15],
  ]
  for (const [t, w] of prof) {
    const p = lerpV(s.hip, s.shoulder, t)
    pts.push(add(p, scale(across, w)))
  }
  for (const [t, w] of [...prof].reverse()) {
    const p = lerpV(s.hip, s.shoulder, t)
    pts.push(add(p, scale(across, -w)))
  }
  return pts.map((p) => `${f(p[0])},${f(p[1])}`).join(' ')
}

/** Points that touch (or nearly touch) the floor — used for the soft shadow. */
function contacts(s: Skeleton): Vec[] {
  const pts = [s.toeN, s.heelN, s.toeF, s.heelF, s.handN, s.handF, s.kneeN, s.kneeF, s.hip, s.shoulder, s.head]
  return pts.filter((p) => p[1] > GROUND - 14)
}

export function buildShapes(s: Skeleton, pose: Pose, opts: DrawOptions = {}): Shape[] {
  const pal = opts.palette ?? DARK_PALETTE
  const hl = opts.highlight ?? {}
  const tint = opts.tint ?? null
  const near = tint ?? pal.near
  const far = tint ? tint : pal.far
  const torsoC = tint ?? pal.torso
  const out: Shape[] = []
  const side = s.view === 'side'

  // Floor & shadow.
  if (opts.floor !== false && s.view !== 'top') {
    out.push(line('floor', [opts.floorFrom ?? -400, GROUND + 0.5], [opts.floorTo ?? 800, GROUND + 0.5], pal.floor, 1.5))
  }
  const cs = contacts(s)
  const xs = cs.length ? cs.map((p) => p[0]) : [s.hip[0]]
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  out.push({
    id: 'shadow',
    kind: 'ellipse',
    cx: f((minX + maxX) / 2),
    cy: GROUND + 1,
    rx: f(Math.max(14, (maxX - minX) / 2 + 12)),
    ry: 3.2,
    fill: pal.shadow,
    opacity: s.view === 'top' ? 0 : 0.35,
  })

  out.push(...propShapes(opts.props, pal))

  const limbShapes = (k: 'N' | 'F', color: string, prefix: string) => {
    const sh = k === 'N' ? s.shoulderN : s.shoulderF
    const el = k === 'N' ? s.elbowN : s.elbowF
    const wr = k === 'N' ? s.wristN : s.wristF
    const hd = k === 'N' ? s.handN : s.handF
    return [
      line(`${prefix}-ua`, sh, el, color, STROKE.upperArm),
      line(`${prefix}-fa`, el, wr, color, STROKE.forearm),
      line(`${prefix}-hand`, wr, hd, color, 6.5),
    ]
  }
  const legShapes = (k: 'N' | 'F', color: string, prefix: string) => {
    const hp = k === 'N' ? s.hipN : s.hipF
    const kn = k === 'N' ? s.kneeN : s.kneeF
    const an = k === 'N' ? s.ankleN : s.ankleF
    const toe = k === 'N' ? s.toeN : s.toeF
    const heel = k === 'N' ? s.heelN : s.heelF
    return [
      line(`${prefix}-th`, hp, kn, color, STROKE.thigh),
      line(`${prefix}-sh`, kn, an, color, STROKE.shin),
      line(`${prefix}-ft`, heel, toe, color, STROKE.foot),
    ]
  }

  // Muscle highlight overlays (always present; opacity carries the intensity). Each overlay is
  // layered right after the body part it belongs to, so nearer limbs correctly cover it.
  const H = pal.highlight
  const torsoFront = dir(s.torsoAngle + 90)
  const offsetPath = (offset: number, from = 0, to = 1) => {
    const a = add(lerpV(s.hip, s.shoulder, from), scale(torsoFront, offset))
    const b = add(lerpV(s.hip, s.shoulder, to), scale(torsoFront, offset))
    const c = add(lerpV(s.spineCtrl, lerpV(s.hip, s.shoulder, (from + to) / 2), 0.15), scale(torsoFront, offset))
    return `M${f(a[0])},${f(a[1])} Q${f(c[0])},${f(c[1])} ${f(b[0])},${f(b[1])}`
  }
  const op = (g: SegmentGroup, visible = true) => (visible ? Math.max(0, Math.min(1, hl[g] ?? 0)) * 0.9 : 0)
  const torsoOverlays = (): Shape[] => {
    const t = (id: string, g: SegmentGroup, offset: number, from: number, to: number, width: number): Shape => ({
      id,
      kind: 'path',
      d: offsetPath(side ? offset : 0, from, to),
      stroke: H,
      width,
      cap: 'round',
      fill: 'none',
      opacity: op(g),
    })
    return [
      t('hl-chest', 'chest', 4.5, 0.55, 0.95, 9),
      t('hl-back', 'back', -4.5, 0.35, 0.95, 9),
      t('hl-core', 'core', 4, 0.12, 0.55, 9),
      { id: 'hl-glutes', kind: 'circle', cx: f(s.hip[0] - torsoFront[0] * 3), cy: f(s.hip[1] - torsoFront[1] * 3), r: 7, fill: H, opacity: op('glutes') },
    ]
  }
  const armOverlays = (k: 'N' | 'F', visible: boolean): Shape[] => {
    const sh = k === 'N' ? s.shoulderN : s.shoulderF
    const el = k === 'N' ? s.elbowN : s.elbowF
    const wr = k === 'N' ? s.wristN : s.wristF
    return [
      line(`hl-sh${k}`, sh, lerpV(sh, el, 0.35), H, 9, op('shoulders', visible)),
      line(`hl-ua${k}`, lerpV(sh, el, 0.25), el, H, 6, op('upperArms', visible)),
      line(`hl-fa${k}`, el, wr, H, 5, op('forearms', visible)),
    ]
  }
  const legOverlays = (k: 'N' | 'F', visible: boolean): Shape[] => {
    const hp = k === 'N' ? s.hipN : s.hipF
    const kn = k === 'N' ? s.kneeN : s.kneeF
    const an = k === 'N' ? s.ankleN : s.ankleF
    return [
      line(`hl-th${k}`, lerpV(hp, kn, 0.15), lerpV(hp, kn, 0.9), H, 8, op('thighs', visible)),
      line(`hl-ca${k}`, lerpV(kn, an, 0.15), lerpV(kn, an, 0.75), H, 7, op('calves', visible)),
    ]
  }

  // Back layer.
  if (side) {
    out.push(...legShapes('F', far, 'legF'), ...legOverlays('F', false))
    out.push(...limbShapes('F', far, 'armF'), ...armOverlays('F', false))
    out.push(...dumbbell('dbF', lerpV(s.wristF, s.handF, 0.45), pose.dbF, pal, true))
  } else {
    out.push(...legShapes('F', near, 'legF'), ...legOverlays('F', true))
    out.push(...legShapes('N', near, 'legN'), ...legOverlays('N', true))
  }

  // Torso.
  if (side) {
    out.push({ id: 'torso', kind: 'path', d: sideTorsoPath(s), fill: torsoC, stroke: torsoC, width: 2.5, join: 'round' })
    out.push({ id: 'pelvis', kind: 'circle', cx: f(s.hip[0]), cy: f(s.hip[1]), r: 9.2, fill: torsoC })
    out.push({ id: 'shcap', kind: 'circle', cx: f(s.shoulder[0]), cy: f(s.shoulder[1]), r: 8.6, fill: torsoC })
  } else {
    out.push({ id: 'torso', kind: 'polygon', points: frontTorsoPoints(s), fill: torsoC, stroke: torsoC, width: 9 })
    out.push({ id: 'pelvis', kind: 'circle', cx: f(s.hip[0]), cy: f(s.hip[1]), r: 0.01, fill: torsoC, opacity: 0 })
    out.push({ id: 'shcap', kind: 'circle', cx: f(s.shoulder[0]), cy: f(s.shoulder[1]), r: 0.01, fill: torsoC, opacity: 0 })
  }
  out.push(...torsoOverlays())
  out.push(line('neck', s.neck, polar(s.neck, s.headAngle, L.neck + 2), torsoC, STROKE.neck))
  out.push({ id: 'head', kind: 'circle', cx: f(s.head[0]), cy: f(s.head[1]), r: L.headR, fill: tint ?? pal.head })
  // Face cue: one eye toward the facing direction (side), two eyes (front), none from the top.
  if (side) {
    const eye = add(polar(s.head, s.headAngle + 90, 4.6), scale(dir(s.headAngle), 1.6))
    out.push({ id: 'eye1', kind: 'circle', cx: f(eye[0]), cy: f(eye[1]), r: 1.35, fill: pal.face })
    out.push({ id: 'eye2', kind: 'circle', cx: f(eye[0]), cy: f(eye[1]), r: 0.01, fill: pal.face, opacity: 0 })
  } else {
    const across = dir(s.headAngle + 90)
    const up = scale(dir(s.headAngle), 1.2)
    const e1 = add(add(s.head, scale(across, 3.4)), up)
    const e2 = add(add(s.head, scale(across, -3.4)), up)
    const eo = s.view === 'top' ? 0 : 1
    out.push({ id: 'eye1', kind: 'circle', cx: f(e1[0]), cy: f(e1[1]), r: 1.25, fill: pal.face, opacity: eo })
    out.push({ id: 'eye2', kind: 'circle', cx: f(e2[0]), cy: f(e2[1]), r: 1.25, fill: pal.face, opacity: eo })
  }

  // Front layer.
  if (side) {
    out.push(...legShapes('N', near, 'legN'), ...legOverlays('N', true))
    out.push(...limbShapes('N', near, 'armN'), ...armOverlays('N', true))
    out.push(...dumbbell('dbN', lerpV(s.wristN, s.handN, 0.45), pose.dbN, pal, false))
  } else {
    out.push(...limbShapes('F', near, 'armF'), ...armOverlays('F', true))
    out.push(...limbShapes('N', near, 'armN'), ...armOverlays('N', true))
    out.push(...dumbbell('dbF', lerpV(s.wristF, s.handF, 0.45), pose.dbF, pal, false))
    out.push(...dumbbell('dbN', lerpV(s.wristN, s.handN, 0.45), pose.dbN, pal, false))
  }
  const both = pose.dbBoth ? lerpV(lerpV(s.wristN, s.handN, 0.5), lerpV(s.wristF, s.handF, 0.5), 0.5) : null
  out.push(...dumbbell('dbB', both, pose.dbBoth, pal, false))

  return out
}

/** Angle helper re-exported for families that orient props. */
export { angleOf }
