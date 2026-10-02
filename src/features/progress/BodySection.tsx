import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Plus, Ruler, Trash2 } from 'lucide-react'
import type { Measurement, ProgressPhoto } from '@/db/db'
import { formatShortDate, todayISO } from '@/lib/dates'
import { cmToIn, inToCm } from '@/lib/units'
import { addMeasurement, addPhoto, deletePhoto, useMeasurements, usePhotos } from '@/state/body'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { Segmented } from '@/ui/Segmented'
import { Sheet } from '@/ui/Sheet'

const FIELDS: { key: keyof Pick<Measurement, 'waistCm' | 'chestCm' | 'hipsCm' | 'armCm' | 'thighCm'>; label: string }[] = [
  { key: 'waistCm', label: 'Waist (at the navel)' },
  { key: 'chestCm', label: 'Chest' },
  { key: 'hipsCm', label: 'Hips' },
  { key: 'armCm', label: 'Upper arm (flexed)' },
  { key: 'thighCm', label: 'Thigh' },
]

function useObjectUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

function Thumb({ photo, onOpen }: { photo: ProgressPhoto; onOpen: () => void }) {
  const url = useObjectUrl(photo.blob)
  return (
    <button type="button" onClick={onOpen} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2">
      {url ? <img src={url} alt={`${photo.pose} photo ${photo.date}`} className="h-full w-full object-cover" /> : null}
      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 text-[10px] text-white">{formatShortDate(photo.date)}</span>
    </button>
  )
}

/** Before/after slider: drag to reveal the newer photo over the older one. */
function Compare({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const a = useObjectUrl(before.blob)
  const b = useObjectUrl(after.blob)
  const [pos, setPos] = useState(50)
  return (
    <div>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-surface-2">
        {a ? <img src={a} alt={`Before, ${before.date}`} className="absolute inset-0 h-full w-full object-cover" /> : null}
        {b ? <img src={b} alt={`After, ${after.date}`} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} /> : null}
        <div className="absolute inset-y-0 w-0.5 bg-white/90" style={{ left: `${pos}%` }} />
        <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{formatShortDate(before.date)}</span>
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">{formatShortDate(after.date)}</span>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare before and after" className="mt-3 w-full accent-[var(--color-ember)]" />
    </div>
  )
}

export function BodySection({ imperial }: { imperial: boolean }) {
  const measurements = useMeasurements()
  const photos = usePhotos()
  const [open, setOpen] = useState(false)
  const [vals, setVals] = useState<Record<string, string>>({})
  const [pose, setPose] = useState<ProgressPhoto['pose']>('front')
  const [viewer, setViewer] = useState<ProgressPhoto | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const latest = measurements?.[measurements.length - 1]
  const first = measurements?.[0]
  const fmt = (cm?: number) => (cm === undefined ? '—' : imperial ? `${cmToIn(cm).toFixed(1)}″` : `${cm.toFixed(1)} cm`)
  const samePose = useMemo(() => (photos ?? []).filter((p) => p.pose === (viewer?.pose ?? 'front')), [photos, viewer])

  return (
    <>
      <SectionTitle
        action={
          <Button size="sm" variant="ghost" icon={<Ruler size={15} />} onClick={() => setOpen(true)}>
            Measure
          </Button>
        }
      >
        Body
      </SectionTitle>
      <Card className="py-1">
        {latest ? (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-2 text-left font-medium">Measurement</th>
                <th className="py-2 text-right font-medium">{formatShortDate(latest.date)}</th>
                <th className="py-2 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {FIELDS.filter((f) => latest[f.key] !== undefined).map((f) => {
                const now = latest[f.key]!
                const then = first && first !== latest ? first[f.key] : undefined
                const d = then !== undefined ? now - then : undefined
                return (
                  <tr key={f.key} className="border-t border-line/60">
                    <td className="py-2">{f.label.split(' (')[0]}</td>
                    <td className="py-2 text-right">{fmt(now)}</td>
                    <td className="py-2 text-right text-muted">{d === undefined ? '—' : `${d > 0 ? '+' : ''}${imperial ? cmToIn(d).toFixed(1) : d.toFixed(1)}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="py-4 text-center text-sm text-muted">Measurements often change before the scale does. Add a few once a month.</p>
        )}
      </Card>
      <Card className="mt-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Progress photos</div>
            <div className="text-xs text-muted">Private — they never leave your phone.</div>
          </div>
          <Button size="sm" variant="secondary" icon={<Camera size={15} />} onClick={() => fileRef.current?.click()}>
            Add
          </Button>
        </div>
        <Segmented
          className="mt-3"
          label="Pose"
          value={pose}
          onChange={setPose}
          options={[
            { value: 'front', label: 'Front' },
            { value: 'side', label: 'Side' },
            { value: 'back', label: 'Back' },
          ]}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void addPhoto(f, pose)
            e.target.value = ''
          }}
        />
        {photos?.length ? (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {photos
              .slice()
              .reverse()
              .map((p) => (
                <Thumb key={p.id} photo={p} onOpen={() => setViewer(p)} />
              ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Same spot, same light, every 2–4 weeks. Future you will love the comparison.</p>
        )}
      </Card>

      <Sheet open={open} onClose={() => setOpen(false)} title="Measurements">
        <p className="-mt-1 mb-3 text-sm text-muted">Use a soft tape, snug but not tight. Leave blank anything you skip.</p>
        <div className="space-y-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-3">
              <span className="flex-1 text-sm">{f.label}</span>
              <input
                inputMode="decimal"
                className="h-11 w-28 rounded-xl border border-line bg-surface px-3 text-right outline-none focus:border-ember"
                placeholder={imperial ? 'in' : 'cm'}
                value={vals[f.key] ?? ''}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <Button
          block
          size="lg"
          className="mt-4"
          icon={<Plus size={18} />}
          onClick={async () => {
            const m: Omit<Measurement, 'id' | 'at'> = { date: todayISO() }
            for (const f of FIELDS) {
              const n = Number((vals[f.key] ?? '').replace(',', '.'))
              if (Number.isFinite(n) && n > 0) m[f.key] = imperial ? inToCm(n) : n
            }
            await addMeasurement(m)
            setVals({})
            setOpen(false)
          }}
        >
          Save
        </Button>
      </Sheet>

      <Sheet open={!!viewer} onClose={() => setViewer(null)} title={viewer ? `${viewer.pose[0].toUpperCase()}${viewer.pose.slice(1)} · ${formatShortDate(viewer.date)}` : ''}>
        {viewer ? (
          <div>
            {samePose.length >= 2 && samePose[0].id !== viewer.id ? <Compare before={samePose[0]} after={viewer} /> : <Compare before={viewer} after={viewer} />}
            {samePose.length >= 2 ? <p className="mt-2 text-center text-xs text-muted">Drag to compare with your first {viewer.pose} photo.</p> : null}
            <Button
              block
              variant="danger"
              className="mt-4"
              icon={<Trash2 size={16} />}
              onClick={async () => {
                await deletePhoto(viewer.id)
                setViewer(null)
              }}
            >
              Delete photo
            </Button>
          </div>
        ) : null}
      </Sheet>
    </>
  )
}
