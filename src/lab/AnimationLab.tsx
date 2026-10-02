import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Pause, Play } from 'lucide-react'
import { DEMO_MOTIONS } from '@/anim/demo'
import { Mannequin } from '@/anim/Mannequin'
import { cycleDuration, type MotionSample } from '@/anim/motion'
import { PageHeader } from '@/ui/PageHeader'
import { Button } from '@/ui/Button'
import { usePalette } from '@/app/theme'

/** Developer page: browse every motion, scrub, change speed. `?ex=id&t=1.2&static=1` freezes a frame. */
export default function AnimationLab() {
  const [params, setParams] = useSearchParams()
  const id = params.get('ex') ?? DEMO_MOTIONS[0].id
  const staticT = params.get('t')
  const isStatic = params.get('static') === '1'
  const entry = DEMO_MOTIONS.find((d) => d.id === id) ?? DEMO_MOTIONS[0]
  const [playing, setPlaying] = useState(!isStatic)
  const [speed, setSpeed] = useState(1)
  const [scrub, setScrub] = useState(staticT ? Number(staticT) : 0)
  const [info, setInfo] = useState<MotionSample | null>(null)
  const palette = usePalette()
  const D = useMemo(() => cycleDuration(entry.motion) * (entry.motion.alternate ? 2 : 1), [entry])

  if (isStatic) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg">
        <Mannequin motion={entry.motion} playing={false} time={scrub} palette={palette} className="w-[640px] max-w-full" />
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Animation Lab" subtitle={`${DEMO_MOTIONS.length} motions`} back="/more" />
      <div className="px-4">
        <div className="rounded-3xl border border-line bg-surface p-2">
          <Mannequin
            motion={entry.motion}
            playing={playing}
            speed={speed}
            time={playing ? undefined : scrub}
            palette={palette}
            pulse={['chest', 'thighs', 'core']}
            onSample={(s) => setInfo((prev) => (prev && prev.label === s.label && Math.abs(prev.u - s.u) < 0.02 ? prev : s))}
            className="aspect-[4/3] w-full"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" onClick={() => setPlaying((p) => !p)} icon={playing ? <Pause size={16} /> : <Play size={16} />}>
            {playing ? 'Pause' : 'Play'}
          </Button>
          {[0.25, 0.5, 1, 1.5].map((s) => (
            <Button key={s} size="sm" variant={speed === s ? 'primary' : 'secondary'} onClick={() => setSpeed(s)}>
              {s}×
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted tabular">
            {info ? `${info.label ?? ''} u=${info.u.toFixed(2)} side ${info.side}` : ''}
          </span>
        </div>
        {!playing ? (
          <input
            aria-label="Scrub"
            type="range"
            min={0}
            max={D}
            step={0.01}
            value={scrub}
            onChange={(e) => setScrub(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-ember)]"
          />
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-2 pb-8">
          {DEMO_MOTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setParams({ ex: d.id })}
              className={`rounded-2xl border p-1 text-left ${d.id === entry.id ? 'border-ember' : 'border-line'} bg-surface`}
            >
              <Mannequin motion={d.motion} playing={false} time={0.6} palette={palette} className="aspect-[4/3] w-full" />
              <div className="truncate px-1 pb-1 text-[11px] text-muted">{d.name}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
