import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { buildShapes, DARK_PALETTE, type Palette, type SegmentGroup, type Shape } from './draw'
import { viewBoxFor } from './frame'
import { sampleMotion, type MotionSample } from './motion'
import { solvePose } from './rig'
import type { Motion, PhaseLabel } from './types'

export interface MannequinProps {
  motion: Motion
  /** Animate (default true). When false the figure freezes at `time` (or wherever it stopped). */
  playing?: boolean
  speed?: number
  /** Render a fixed moment (seconds into the motion). Used for thumbnails and scrubbing. */
  time?: number
  /** External clock in seconds — lets the workout player, voice and animation share one timeline. */
  clock?: () => number
  /** Base muscle-highlight intensity per group (0..1). */
  highlight?: Partial<Record<SegmentGroup, number>>
  /** Groups that pulse brighter during effort phases. */
  pulse?: SegmentGroup[]
  effortLabels?: PhaseLabel[]
  tint?: string | null
  palette?: Palette
  className?: string
  style?: CSSProperties
  title?: string
  onSample?: (s: MotionSample) => void
}

const SVGNS = 'http://www.w3.org/2000/svg'

function tagFor(s: Shape): string {
  return s.kind
}

function attrsOf(s: Shape): Record<string, string | number> {
  const a: Record<string, string | number> = { opacity: s.opacity ?? 1 }
  switch (s.kind) {
    case 'line':
      Object.assign(a, { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, stroke: s.stroke, 'stroke-width': s.width, 'stroke-linecap': 'round' })
      break
    case 'circle':
      Object.assign(a, { cx: s.cx, cy: s.cy, r: s.r, fill: s.fill })
      if (s.stroke) Object.assign(a, { stroke: s.stroke, 'stroke-width': s.width ?? 1 })
      break
    case 'ellipse':
      Object.assign(a, { cx: s.cx, cy: s.cy, rx: s.rx, ry: s.ry, fill: s.fill })
      break
    case 'path':
      Object.assign(a, { d: s.d, fill: s.fill ?? 'none' })
      if (s.stroke) Object.assign(a, { stroke: s.stroke, 'stroke-width': s.width ?? 1, 'stroke-linecap': s.cap ?? 'round', 'stroke-linejoin': s.join ?? 'round' })
      break
    case 'rect':
      Object.assign(a, { x: s.x, y: s.y, width: s.w, height: s.h, rx: s.rx ?? 0, fill: s.fill })
      if (s.stroke) Object.assign(a, { stroke: s.stroke, 'stroke-width': s.width ?? 1 })
      break
    case 'polygon':
      Object.assign(a, { points: s.points, fill: s.fill })
      if (s.stroke) Object.assign(a, { stroke: s.stroke, 'stroke-width': s.width ?? 1, 'stroke-linejoin': 'round' })
      break
  }
  return a
}

/**
 * Animated exercise demonstration. React renders the <svg> once; a requestAnimationFrame loop
 * patches element attributes directly (no React re-render per frame).
 */
export function Mannequin({
  motion,
  playing = true,
  speed = 1,
  time,
  clock,
  highlight,
  pulse,
  effortLabels = ['up'],
  tint = null,
  palette = DARK_PALETTE,
  className,
  style,
  title,
  onSample,
}: MannequinProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const vb = useMemo(() => viewBoxFor(motion), [motion])
  const latest = useRef({ playing, speed, time, clock, highlight, pulse, effortLabels, tint, palette, onSample })
  latest.current = { playing, speed, time, clock, highlight, pulse, effortLabels, tint, palette, onSample }

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const els = new Map<string, SVGElement>()
    const last = new Map<string, string>()
    let raf = 0
    let visible = true
    let localT = latest.current.time ?? 0
    let prevNow = performance.now()

    const render = (t: number) => {
      const L = latest.current
      const s = sampleMotion(motion, t)
      const pose = motion.pose(s.u, s.side)
      const sk = solvePose(pose, motion.view)
      const hl: Partial<Record<SegmentGroup, number>> = { ...(L.highlight ?? {}) }
      if (L.pulse?.length) {
        const effort = s.label && L.effortLabels.includes(s.label)
        const hold = s.label === 'hold'
        const k = effort ? 0.45 + 0.55 * Math.sin(Math.min(1, s.phaseProgress) * Math.PI) : hold ? 0.55 : 0.28
        for (const g of L.pulse) hl[g] = Math.max(hl[g] ?? 0, k)
      }
      const shapes = buildShapes(sk, pose, {
        palette: L.palette,
        props: motion.props,
        floor: motion.floor,
        floorFrom: vb.x,
        floorTo: vb.x + vb.w,
        highlight: hl,
        tint: L.tint,
      })
      for (const sh of shapes) {
        let el = els.get(sh.id)
        if (!el) {
          el = document.createElementNS(SVGNS, tagFor(sh)) as SVGElement
          svg.appendChild(el)
          els.set(sh.id, el)
        }
        const attrs = attrsOf(sh)
        const sig = JSON.stringify(attrs)
        if (last.get(sh.id) === sig) continue
        last.set(sh.id, sig)
        for (const [k, val] of Object.entries(attrs)) el.setAttribute(k, String(val))
      }
      L.onSample?.(s)
    }

    const loop = (now: number) => {
      const L = latest.current
      const dt = Math.min(0.1, (now - prevNow) / 1000)
      prevNow = now
      let t: number
      if (L.clock) t = L.clock()
      else if (L.time !== undefined && !L.playing) t = L.time
      else {
        if (L.playing) localT += dt * L.speed
        t = localT
      }
      if (visible) render(t)
      raf = requestAnimationFrame(loop)
    }

    // First paint synchronously so static thumbnails never flash empty.
    render(latest.current.time ?? 0)
    raf = requestAnimationFrame(loop)

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => {
            visible = entries.some((e) => e.isIntersecting)
          })
        : null
    io?.observe(svg)

    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
      els.forEach((el) => el.remove())
    }
  }, [motion, vb])

  return (
    <svg
      ref={svgRef}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className={className}
      style={style}
      role="img"
      aria-label={title ?? 'Exercise demonstration'}
      preserveAspectRatio="xMidYMid meet"
    />
  )
}
