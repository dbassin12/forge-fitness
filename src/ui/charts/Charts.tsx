import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus, Table2 } from 'lucide-react'
import { cx } from '../cx'
import { linear, niceTicks } from './scale'

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null)
  const [w, setW] = useState(320)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.clientWidth || 320)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || 320))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

const AXIS_FONT = 11
const PAD = { top: 14, right: 12, bottom: 24, left: 36 }

/** Card body for a chart: title, optional legend and a table-view toggle (the WCAG twin). */
export function ChartFrame({
  title,
  subtitle,
  legend,
  table,
  children,
}: {
  title: string
  subtitle?: ReactNode
  legend?: ReactNode
  table: { head: string[]; rows: (string | number)[][] }
  children: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  return (
    <figure className="m-0">
      <figcaption className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle ? <div className="text-xs text-muted">{subtitle}</div> : null}
        </div>
        <button
          type="button"
          onClick={() => setShowTable((x) => !x)}
          aria-pressed={showTable}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted hover:bg-surface-2"
        >
          <Table2 size={14} /> {showTable ? 'Chart' : 'Table'}
        </button>
      </figcaption>
      {legend ? <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">{legend}</div> : null}
      <div className="mt-2">
        {showTable ? (
          <div className="max-h-64 overflow-auto rounded-xl border border-line/70">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-2 text-xs text-muted">
                <tr>
                  {table.head.map((h) => (
                    <th key={h} className="px-3 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular">
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-line/50">
                    {r.map((c, j) => (
                      <td key={j} className="px-3 py-1.5">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </figure>
  )
}

export function LegendLine({ label, tone }: { label: string; tone: 'accent' | 'deemph' }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="16" height="8" aria-hidden>
        <line x1="1" y1="4" x2="15" y2="4" stroke={tone === 'accent' ? 'var(--color-viz-1)' : 'var(--color-viz-deemph)'} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  )
}

export function LegendDot({ label, tone }: { label: string; tone: 'accent' | 'deemph' }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="10" height="10" aria-hidden>
        <circle cx="5" cy="5" r="4" fill={tone === 'accent' ? 'var(--color-viz-1)' : 'var(--color-viz-deemph)'} />
      </svg>
      {label}
    </span>
  )
}

export interface TimePoint {
  x: number
  y: number
}

export interface TimeSeries {
  id: string
  label: string
  kind: 'line' | 'dots'
  tone: 'accent' | 'deemph'
  points: TimePoint[]
}

/**
 * Change-over-time chart on one y-axis: an emphasized line (e.g. 7-day average) with optional
 * de-emphasized dots (raw readings) and a labeled reference line (goal). Crosshair + tooltip.
 */
export function TimeChart({
  series,
  height = 180,
  xLabel,
  yFormat,
  reference,
  ariaLabel,
  tickFormat,
}: {
  series: TimeSeries[]
  height?: number
  xLabel: (x: number) => string
  yFormat: (y: number) => string
  reference?: { y: number; label: string }
  ariaLabel: string
  /** Axis tick labels (defaults to `yFormat`). */
  tickFormat?: (y: number) => string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const id = useId()
  const all = series.flatMap((s) => s.points)
  const xs = [...new Set(all.map((p) => p.x))].sort((a, b) => a - b)
  const ys = all.map((p) => p.y).concat(reference ? [reference.y] : [])
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys), 4)
  const x0 = xs[0] ?? 0
  const x1 = xs[xs.length - 1] ?? 1
  const sx = linear(x0, x1 === x0 ? x0 + 1 : x1, PAD.left, width - PAD.right - 40)
  const sy = linear(ticks[0], ticks[ticks.length - 1], height - PAD.bottom, PAD.top)
  const emph = series.find((s) => s.kind === 'line')
  const last = emph?.points[emph.points.length - 1]
  const xTicks = xs.length <= 1 ? xs : [xs[0], xs[Math.floor((xs.length - 1) / 2)], xs[xs.length - 1]]

  const pick = (clientX: number) => {
    const el = ref.current
    if (!el || !xs.length) return
    const px = clientX - el.getBoundingClientRect().left
    let best = 0
    for (let i = 1; i < xs.length; i++) if (Math.abs(sx(xs[i]) - px) < Math.abs(sx(xs[best]) - px)) best = i
    setHover(best)
  }
  const onKey = (e: KeyboardEvent) => {
    if (!xs.length) return
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? xs.length) - 1))
    else if (e.key === 'ArrowRight') setHover((h) => Math.min(xs.length - 1, (h ?? -1) + 1))
    else if (e.key === 'Escape') setHover(null)
    else return
    e.preventDefault()
  }
  const hx = hover !== null ? xs[hover] : null
  const rows = hx === null ? [] : series.map((s) => ({ s, p: s.points.find((p) => p.x === hx) })).filter((r) => r.p)

  return (
    <div
      ref={ref}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-ember/50 rounded-xl"
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      aria-describedby={id}
      onPointerMove={(e) => pick(e.clientX)}
      onPointerDown={(e) => pick(e.clientX)}
      onPointerLeave={() => setHover(null)}
      onKeyDown={onKey}
      onBlur={() => setHover(null)}
      style={{ height }}
    >
      <svg width={width} height={height} className="block" aria-hidden>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} stroke="var(--color-viz-grid)" strokeWidth={1} />
            <text x={PAD.left - 6} y={sy(t)} dy="0.32em" textAnchor="end" fontSize={AXIS_FONT} fill="var(--color-faint)" className="tabular">
              {(tickFormat ?? yFormat)(t)}
            </text>
          </g>
        ))}
        {xTicks.map((x, i) => (
          <text key={x} x={sx(x)} y={height - 6} fontSize={AXIS_FONT} fill="var(--color-faint)" textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}>
            {xLabel(x)}
          </text>
        ))}
        {reference ? (
          <g>
            <line x1={PAD.left} x2={width - PAD.right} y1={sy(reference.y)} y2={sy(reference.y)} stroke="var(--color-muted)" strokeWidth={1} />
            <text x={width - PAD.right} y={sy(reference.y) - 4} textAnchor="end" fontSize={AXIS_FONT} fill="var(--color-muted)">
              {reference.label}
            </text>
          </g>
        ) : null}
        {series
          .filter((s) => s.kind === 'dots')
          .map((s) =>
            s.points.map((p) => (
              <circle key={`${s.id}-${p.x}`} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={s.tone === 'accent' ? 'var(--color-viz-1)' : 'var(--color-viz-deemph)'} stroke="var(--color-surface)" strokeWidth={2} />
            )),
          )}
        {series
          .filter((s) => s.kind === 'line' && s.points.length > 1)
          .map((s) => (
            <path
              key={s.id}
              d={s.points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')}
              fill="none"
              stroke={s.tone === 'accent' ? 'var(--color-viz-1)' : 'var(--color-viz-deemph)'}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        {last ? (
          <g>
            <circle cx={sx(last.x)} cy={sy(last.y)} r={4.5} fill="var(--color-viz-1)" stroke="var(--color-surface)" strokeWidth={2} />
            <text x={sx(last.x) + 8} y={sy(last.y)} dy="0.32em" fontSize={12} fontWeight={600} fill="var(--color-ink)">
              {yFormat(last.y)}
            </text>
          </g>
        ) : null}
        {hx !== null ? <line x1={sx(hx)} x2={sx(hx)} y1={PAD.top} y2={height - PAD.bottom} stroke="var(--color-viz-axis)" strokeWidth={1} /> : null}
        {rows.map(({ s, p }) => (
          <circle key={`h-${s.id}`} cx={sx(p!.x)} cy={sy(p!.y)} r={4.5} fill={s.tone === 'accent' ? 'var(--color-viz-1)' : 'var(--color-viz-deemph)'} stroke="var(--color-surface)" strokeWidth={2} />
        ))}
      </svg>
      {hx !== null && rows.length ? (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-[8rem] rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(Math.max(sx(hx) - 64, 0), width - 140) }}
        >
          <div className="mb-1 text-muted">{xLabel(hx)}</div>
          {rows.map(({ s, p }) => (
            <div key={s.id} className="flex items-center gap-2">
              <svg width="12" height="6" aria-hidden>
                <line x1="1" y1="3" x2="11" y2="3" stroke={s.tone === 'accent' ? 'var(--color-viz-1)' : 'var(--color-viz-deemph)'} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="font-semibold text-ink tabular">{yFormat(p!.y)}</span>
              <span className="text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}
      <span id={id} className="sr-only">
        Use left and right arrow keys to read values. A table view is available.
      </span>
    </div>
  )
}

export interface ColumnDatum {
  key: string
  label: string
  value: number
  /** Extra tooltip line, e.g. "target 2,400". */
  note?: string
}

/**
 * Magnitude per period (one series): ≤24px columns, 4px rounded tops, square at the baseline,
 * optional labeled reference line, per-column hover/focus tooltip, value on the last cap.
 */
export function ColumnChart({
  data,
  height = 170,
  yFormat = (v) => Math.round(v).toLocaleString(),
  reference,
  ariaLabel,
  labelLast = true,
  emphasizeLast = false,
}: {
  data: ColumnDatum[]
  height?: number
  yFormat?: (v: number) => string
  reference?: { y: number; label: string }
  ariaLabel: string
  labelLast?: boolean
  emphasizeLast?: boolean
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value), reference?.y ?? 0)
  const ticks = niceTicks(0, max, 3)
  const top = ticks[ticks.length - 1]
  const sy = linear(0, top, height - PAD.bottom, PAD.top + 6)
  const innerW = width - PAD.left - PAD.right
  const band = innerW / Math.max(1, data.length)
  const barW = Math.max(4, Math.min(24, band * 0.62))
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(innerW / 44)))
  const cx = (i: number) => PAD.left + band * i + band / 2

  const colPath = (i: number, v: number) => {
    const x = cx(i) - barW / 2
    const y0 = sy(0)
    const y1 = sy(v)
    const r = Math.min(4, barW / 2, Math.max(0, y0 - y1))
    if (y0 - y1 < 0.5) return ''
    return `M${x},${y0} L${x},${y1 + r} Q${x},${y1} ${x + r},${y1} L${x + barW - r},${y1} Q${x + barW},${y1} ${x + barW},${y1 + r} L${x + barW},${y0} Z`
  }

  return (
    <div ref={ref} className="relative" role="group" aria-label={ariaLabel} style={{ height }}>
      <svg width={width} height={height} className="block" aria-hidden>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={sy(t)} y2={sy(t)} stroke={t === 0 ? 'var(--color-viz-axis)' : 'var(--color-viz-grid)'} strokeWidth={1} />
            <text x={PAD.left - 6} y={sy(t)} dy="0.32em" textAnchor="end" fontSize={AXIS_FONT} fill="var(--color-faint)" className="tabular">
              {yFormat(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <path
            key={d.key}
            d={colPath(i, d.value)}
            fill={emphasizeLast && i !== data.length - 1 ? 'var(--color-viz-deemph)' : 'var(--color-viz-1)'}
            opacity={hover === null || hover === i ? 1 : 0.55}
          />
        ))}
        {reference ? (
          <g>
            <line x1={PAD.left} x2={width - PAD.right} y1={sy(reference.y)} y2={sy(reference.y)} stroke="var(--color-muted)" strokeWidth={1} />
            <text x={width - PAD.right} y={sy(reference.y) - 4} textAnchor="end" fontSize={AXIS_FONT} fill="var(--color-muted)">
              {reference.label}
            </text>
          </g>
        ) : null}
        {data.map((d, i) =>
          (data.length - 1 - i) % labelEvery === 0 ? (
            <text key={`l-${d.key}`} x={cx(i)} y={height - 6} textAnchor="middle" fontSize={AXIS_FONT} fill="var(--color-faint)">
              {d.label}
            </text>
          ) : null,
        )}
        {labelLast && data.length && data[data.length - 1].value > 0 ? (
          <text x={cx(data.length - 1)} y={sy(data[data.length - 1].value) - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink)">
            {yFormat(data[data.length - 1].value)}
          </text>
        ) : null}
      </svg>
      {data.map((d, i) => (
        <button
          key={`hit-${d.key}`}
          type="button"
          aria-label={`${d.label}: ${yFormat(d.value)}${d.note ? `, ${d.note}` : ''}`}
          className="absolute top-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ember/50"
          style={{ left: PAD.left + band * i, width: Math.max(band, 24), height: height - PAD.bottom }}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          onClick={() => setHover(i)}
        />
      ))}
      {hover !== null && data[hover] ? (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs shadow-xl"
          style={{ left: Math.min(Math.max(cx(hover) - 60, 0), width - 130) }}
        >
          <div className="text-muted">{data[hover].label}</div>
          <div className="font-semibold text-ink tabular">{yFormat(data[hover].value)}</div>
          {data[hover].note ? <div className="text-muted">{data[hover].note}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

/** 12-point sparkline in the de-emphasis gray with the latest point in the accent. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const pts = useMemo(() => values.slice(-12), [values])
  if (pts.length < 2) return null
  const w = 72
  const h = 24
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const sx = linear(0, pts.length - 1, 3, w - 4)
  const sy = linear(min, max === min ? min + 1 : max, h - 3, 3)
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')
  const lx = sx(pts.length - 1)
  const ly = sy(pts[pts.length - 1])
  return (
    <svg width={w} height={h} className={className} aria-hidden>
      <path d={d} fill="none" stroke="var(--color-viz-deemph)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={3} fill="var(--color-viz-1)" stroke="var(--color-surface)" strokeWidth={1.5} />
    </svg>
  )
}

/** Stat tile: label · value · signed delta (direction × whether up is good) · optional sparkline. */
export function StatTile({
  label,
  value,
  unit,
  delta,
  upIsGood,
  trend,
  footnote,
}: {
  label: string
  value: string
  /** Rendered small after the value (keeps "184.0 lb" on one line). */
  unit?: string
  delta?: { value: number; text: string }
  upIsGood?: boolean
  trend?: number[]
  footnote?: string
}) {
  const dir = !delta || Math.abs(delta.value) < 1e-9 ? 0 : delta.value > 0 ? 1 : -1
  const good = upIsGood === undefined ? null : dir === 0 ? null : (dir > 0) === upIsGood
  return (
    <div className="rounded-[var(--radius-card)] border border-line/70 bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className="whitespace-nowrap font-display text-2xl font-bold leading-none">
          {value}
          {unit ? <span className="ml-1 text-sm font-semibold text-muted">{unit}</span> : null}
        </div>
        {trend ? <Sparkline values={trend} /> : null}
      </div>
      {delta ? (
        <div className={cx('mt-1.5 flex items-center gap-1 text-xs', good === null ? 'text-muted' : good ? 'text-good' : 'text-bad')}>
          {dir > 0 ? <ArrowUpRight size={13} /> : dir < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
          {delta.text}
        </div>
      ) : footnote ? (
        <div className="mt-1.5 text-xs text-muted">{footnote}</div>
      ) : null}
    </div>
  )
}
