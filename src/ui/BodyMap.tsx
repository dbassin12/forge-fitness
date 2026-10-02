import type { Muscle } from '@/data/exercises/types'

type Shape = { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number } | { kind: 'path'; d: string } | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number }

const mirror = (s: Shape, axis: number): Shape => {
  if (s.kind === 'ellipse') return { ...s, cx: 2 * axis - s.cx }
  if (s.kind === 'rect') return { ...s, x: 2 * axis - s.x - s.w }
  // Mirror simple absolute paths (M/L/Q/Z with x,y pairs).
  const d = s.d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${2 * axis - Number(x)},${y}`)
  return { kind: 'path', d }
}

const both = (s: Shape, axis: number): Shape[] => [s, mirror(s, axis)]

/** Muscle regions for the front figure (centre x = 50) and back figure (centre x = 170). */
const FRONT: Partial<Record<Muscle, Shape[]>> = {
  shoulders: both({ kind: 'ellipse', cx: 29.5, cy: 43, rx: 7, ry: 6.5 }, 50),
  chest: both({ kind: 'path', d: 'M36,40 Q44,36 49,40 L49,55 Q42,59 35,54 Z' }, 50),
  biceps: both({ kind: 'ellipse', cx: 25, cy: 57, rx: 4.6, ry: 9 }, 50),
  forearms: both({ kind: 'ellipse', cx: 20, cy: 82, rx: 4, ry: 10 }, 50),
  abs: [{ kind: 'rect', x: 44, y: 58, w: 12, h: 33, r: 3 }],
  obliques: both({ kind: 'path', d: 'M37,60 L42.5,60 L42.5,91 L39,91 Q36,78 37,60 Z' }, 50),
  hip_flexors: both({ kind: 'ellipse', cx: 44.5, cy: 99, rx: 3.6, ry: 4.2 }, 50),
  adductors: both({ kind: 'ellipse', cx: 47.3, cy: 115, rx: 2.6, ry: 10 }, 50),
  quads: both({ kind: 'ellipse', cx: 41.5, cy: 122, rx: 6, ry: 17 }, 50),
  calves: both({ kind: 'ellipse', cx: 40, cy: 160, rx: 3.8, ry: 12 }, 50),
}

const BACK: Partial<Record<Muscle, Shape[]>> = {
  traps: [{ kind: 'path', d: 'M160,34 Q170,30 180,34 L176,47 Q170,51 164,47 Z' }],
  shoulders: both({ kind: 'ellipse', cx: 149.5, cy: 43, rx: 7, ry: 6.5 }, 170),
  upper_back: [{ kind: 'path', d: 'M161,47 L179,47 L177,62 L163,62 Z' }],
  lats: both({ kind: 'path', d: 'M152,49 L160.5,50 L162,79 Q156,74 152,62 Z' }, 170),
  triceps: both({ kind: 'ellipse', cx: 145, cy: 57, rx: 4.6, ry: 9 }, 170),
  forearms: both({ kind: 'ellipse', cx: 140, cy: 82, rx: 4, ry: 10 }, 170),
  lower_back: [{ kind: 'rect', x: 163, y: 64, w: 14, h: 26, r: 3 }],
  glutes: both({ kind: 'ellipse', cx: 163.5, cy: 104, rx: 7, ry: 7.5 }, 170),
  hamstrings: both({ kind: 'ellipse', cx: 161.5, cy: 128, rx: 6, ry: 14 }, 170),
  calves: both({ kind: 'ellipse', cx: 160, cy: 160, rx: 5, ry: 12 }, 170),
}

function silhouette(cx: number) {
  const dx = cx - 50
  const t = (x: number) => x + dx
  return (
    <g fill="var(--color-surface-3)">
      <circle cx={t(50)} cy={18} r={11} />
      <rect x={t(45)} y={27} width={10} height={9} rx={3} />
      <path d={`M${t(31)},37 Q${t(50)},30 ${t(69)},37 L${t(70)},62 Q${t(68)},84 ${t(63)},97 L${t(37)},97 Q${t(32)},84 ${t(30)},62 Z`} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <line x1={t(50 + s * 20.5)} y1={41} x2={t(50 + s * 26)} y2={70} stroke="var(--color-surface-3)" strokeWidth={10} strokeLinecap="round" />
          <line x1={t(50 + s * 26)} y1={70} x2={t(50 + s * 31)} y2={96} stroke="var(--color-surface-3)" strokeWidth={8} strokeLinecap="round" />
          <line x1={t(50 + s * 8)} y1={99} x2={t(50 + s * 9.5)} y2={141} stroke="var(--color-surface-3)" strokeWidth={14} strokeLinecap="round" />
          <line x1={t(50 + s * 9.5)} y1={141} x2={t(50 + s * 10.5)} y2={183} stroke="var(--color-surface-3)" strokeWidth={10} strokeLinecap="round" />
        </g>
      ))}
    </g>
  )
}

function renderShape(s: Shape, key: string, fill: string, opacity: number) {
  if (s.kind === 'ellipse') return <ellipse key={key} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill} opacity={opacity} />
  if (s.kind === 'rect') return <rect key={key} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r ?? 0} fill={fill} opacity={opacity} />
  return <path key={key} d={s.d} fill={fill} opacity={opacity} />
}

export function BodyMap({ primary, secondary = [], className }: { primary: Muscle[]; secondary?: Muscle[]; className?: string }) {
  const draw = (map: Partial<Record<Muscle, Shape[]>>, prefix: string) =>
    Object.entries(map).flatMap(([m, shapes]) => {
      const muscle = m as Muscle
      const isP = primary.includes(muscle)
      const isS = !isP && secondary.includes(muscle)
      const fill = isP ? 'var(--color-ember)' : isS ? 'var(--color-amber)' : 'var(--color-line)'
      const op = isP ? 0.95 : isS ? 0.6 : 0.9
      return (shapes ?? []).map((s, i) => renderShape(s, `${prefix}-${m}-${i}`, fill, op))
    })
  return (
    <svg viewBox="0 0 220 200" className={className} role="img" aria-label={`Muscles worked: ${primary.join(', ')}`}>
      {silhouette(50)}
      {silhouette(170)}
      {draw(FRONT, 'f')}
      {draw(BACK, 'b')}
      <text x={50} y={197} textAnchor="middle" fontSize={8} fill="var(--color-faint)">
        Front
      </text>
      <text x={170} y={197} textAnchor="middle" fontSize={8} fill="var(--color-faint)">
        Back
      </text>
    </svg>
  )
}
