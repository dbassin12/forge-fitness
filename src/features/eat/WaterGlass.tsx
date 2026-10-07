import { useId } from 'react'

/** A tumbler that fills with a gently moving wave (0..1, overflow shows a full glass). */
export function WaterGlass({ level, className }: { level: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  const pct = Math.max(0, Math.min(1, level))
  // Glass interior spans y = 8..92; water top moves from 92 (empty) to 10 (full).
  const top = 92 - pct * 82
  return (
    <svg viewBox="0 0 80 100" className={className} role="img" aria-label={`Water glass ${Math.round(pct * 100)}% full`}>
      <defs>
        <clipPath id={`glass-${id}`}>
          <path d="M10 6 L70 6 L63 94 Q62 97 58 97 L22 97 Q18 97 17 94 Z" />
        </clipPath>
        <linearGradient id={`water-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#glass-${id})`}>
        <rect x="0" y="0" width="80" height="100" fill="var(--color-surface-2)" />
        <g style={{ transform: `translateY(${top}px)`, transition: 'transform 800ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
          <g className="animate-[wave_2.6s_linear_infinite]">
            <path d="M0 4 Q10 0 20 4 T40 4 T60 4 T80 4 T100 4 T120 4 T140 4 T160 4 V120 H0 Z" fill={`url(#water-${id})`} />
          </g>
          <g className="animate-[wave_3.8s_linear_infinite_reverse]" opacity="0.45">
            <path d="M0 6 Q10 2 20 6 T40 6 T60 6 T80 6 T100 6 T120 6 T140 6 T160 6 V120 H0 Z" fill="#bae6fd" />
          </g>
        </g>
        {pct > 0.02 ? (
          <g fill="#e0f2fe" opacity="0.7">
            <circle cx="30" cy="80" r="1.6" className="animate-[bubble_3s_ease-in_infinite]" />
            <circle cx="46" cy="86" r="1.2" className="animate-[bubble_2.4s_ease-in_infinite_0.8s]" />
            <circle cx="54" cy="78" r="1" className="animate-[bubble_3.4s_ease-in_infinite_1.5s]" />
          </g>
        ) : null}
      </g>
      <path d="M10 6 L70 6 L63 94 Q62 97 58 97 L22 97 Q18 97 17 94 Z" fill="none" stroke="var(--color-line)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M17 14 L21 86" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
