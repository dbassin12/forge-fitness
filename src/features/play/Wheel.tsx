import { forwardRef } from 'react'

export const WHEEL_COLORS = ['#ff6a3d', '#ffb547', '#2dd4bf', '#38bdf8', '#a78bfa', '#a3e635', '#fb7185', '#4ade80']

/** A prize wheel. Slices start at the top and run clockwise; rotate the inner group to spin it. */
export const Wheel = forwardRef<SVGGElement, { labels: string[]; size?: number; className?: string; hub?: React.ReactNode }>(function Wheel(
  { labels, size = 300, className, hub },
  ref,
) {
  const n = Math.max(1, labels.length)
  const R = 100
  const slice = (i: number) => {
    const a0 = ((i / n) * 360 - 90) * (Math.PI / 180)
    const a1 = (((i + 1) / n) * 360 - 90) * (Math.PI / 180)
    const large = 360 / n > 180 ? 1 : 0
    return `M0 0 L${R * Math.cos(a0)} ${R * Math.sin(a0)} A${R} ${R} 0 ${large} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`
  }
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox="-110 -110 220 220" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id="wheel-shine" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(-30 -40) scale(130)">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="108" fill="var(--color-surface-2)" stroke="var(--color-line)" strokeWidth="2" />
        <g ref={ref} style={{ transformOrigin: '0 0', willChange: 'transform' }}>
          {labels.map((label, i) => {
            const mid = ((i + 0.5) / n) * 360
            return (
              <g key={i}>
                <path d={slice(i)} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="var(--color-surface)" strokeWidth="2" />
                <g transform={`rotate(${mid}) translate(0 -70) rotate(${-mid})`}>
                  <text textAnchor="middle" dominantBaseline="central" fontSize="22">
                    {label}
                  </text>
                </g>
              </g>
            )
          })}
          {/* Rim studs. */}
          {Array.from({ length: n * 2 }, (_, i) => {
            const a = ((i / (n * 2)) * 360 - 90) * (Math.PI / 180)
            return <circle key={i} cx={104 * Math.cos(a)} cy={104 * Math.sin(a)} r="2.2" fill="#fff" opacity="0.7" />
          })}
        </g>
        <circle r="100" fill="url(#wheel-shine)" pointerEvents="none" />
      </svg>
      {hub ? <div className="absolute inset-0 grid place-items-center">{hub}</div> : null}
    </div>
  )
})

/** The pointer that sits above the wheel. */
export function WheelPointer() {
  return (
    <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]">
      <path d="M17 38 L3 10 A15 15 0 1 1 31 10 Z" fill="var(--color-ink)" />
      <circle cx="17" cy="14" r="5" fill="var(--color-ember)" />
    </svg>
  )
}
