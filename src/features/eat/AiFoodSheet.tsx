import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react'
import type { MealSlot } from '@/db/db'
import { estimateFromPhoto, estimateFromText, type FoodEstimate, type FoodEstimateItem } from '@/state/ai'
import type { NewEntry } from '@/state/nutrition'
import { Button } from '@/ui/Button'
import { Tag } from '@/ui/Chip'
import { Sheet } from '@/ui/Sheet'
import { Stepper } from '@/ui/Stepper'
import { cx } from '@/ui/cx'
import { PasscodeForm } from '../settings/PasscodeForm'
import { MEAL_LABEL } from './labels'

/** Render with a fresh `key` per request so every request starts clean. */
export type AiRequest = { mode: 'text' } | { mode: 'photo'; photo: Blob }

interface Row {
  item: FoodEstimateItem
  name: string
  on: boolean
  /** Portion multiplier the user can nudge (½ plate, seconds…). */
  mult: number
}

type Stage = { kind: 'input' } | { kind: 'loading' } | { kind: 'review'; notes: string; rows: Row[] } | { kind: 'empty'; notes: string }

const r1 = (n: number) => Math.round(n * 10) / 10

/** One review row → a diary entry (the estimate × the chosen portion). */
export function entryFromEstimate(item: FoodEstimateItem, name: string, mult: number): Omit<NewEntry, 'date' | 'meal'> {
  return {
    name: name.trim() || item.name,
    source: 'ai',
    servings: mult,
    servingLabel: item.portion || `${item.grams} g`,
    kcal: Math.round(item.kcal * mult),
    protein: r1(item.protein * mult),
    carbs: r1(item.carbs * mult),
    fat: r1(item.fat * mult),
    fiber: r1(item.fiber * mult),
    veg: item.produceServings > 0 || undefined,
    produceServings: item.produceServings > 0 ? r1(item.produceServings * mult) : undefined,
  }
}

export function AiFoodSheet({
  request,
  meal,
  needsCode,
  onClose,
  onLog,
}: {
  request: AiRequest | null
  meal: MealSlot
  needsCode: boolean
  onClose: () => void
  onLog: (entries: Omit<NewEntry, 'date' | 'meal'>[]) => void
}) {
  const [text, setText] = useState('')
  const [note, setNote] = useState('')
  const [stage, setStage] = useState<Stage>({ kind: 'input' })
  const [error, setError] = useState<string | null>(null)
  const abort = useRef<AbortController | null>(null)
  const photo = request?.mode === 'photo' ? request.photo : null
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!photo) return
    const url = URL.createObjectURL(photo)
    setPhotoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const close = () => {
    abort.current?.abort()
    onClose()
  }

  const run = async () => {
    if (!request) return
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setError(null)
    setStage({ kind: 'loading' })
    const r = request.mode === 'photo' ? await estimateFromPhoto(request.photo, note, ctl.signal) : await estimateFromText(text, ctl.signal)
    if (ctl.signal.aborted) return
    if (!r.ok) {
      setError(r.error)
      setStage({ kind: 'input' })
      return
    }
    const e: FoodEstimate = r.data.estimate
    if (!e.isFood || !e.items.length) setStage({ kind: 'empty', notes: e.notes })
    else setStage({ kind: 'review', notes: e.notes, rows: e.items.map((item) => ({ item, name: item.name, on: true, mult: 1 })) })
  }

  const rows = stage.kind === 'review' ? stage.rows : []
  const chosen = rows.filter((r) => r.on)
  const total = chosen.reduce((t, r) => ({ kcal: t.kcal + r.item.kcal * r.mult, protein: t.protein + r.item.protein * r.mult }), { kcal: 0, protein: 0 })
  const setRow = (i: number, patch: Partial<Row>) => {
    if (stage.kind !== 'review') return
    setStage({ ...stage, rows: stage.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  }

  return (
    <Sheet open={!!request} onClose={close} title={request?.mode === 'photo' ? 'Meal photo' : 'Describe your meal'}>
      {needsCode ? (
        <div>
          <p className="text-sm text-muted">AI logging is set up on your server. Enter your access code once to use it on this phone.</p>
          <PasscodeForm className="mt-4" />
        </div>
      ) : stage.kind === 'loading' ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="animate-spin text-ember" size={28} />
          <div className="font-medium">Estimating…</div>
          <p className="max-w-xs text-sm text-muted">{request?.mode === 'photo' ? 'Claude is looking at your photo. This takes a few seconds.' : 'Claude is working out the portions.'}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              abort.current?.abort()
              setStage({ kind: 'input' })
            }}
          >
            Cancel
          </Button>
        </div>
      ) : stage.kind === 'review' ? (
        <div>
          {stage.notes ? <p className="mb-3 rounded-2xl bg-surface-2 px-3 py-2.5 text-sm text-muted">{stage.notes}</p> : null}
          <ul className="space-y-2.5">
            {stage.rows.map((r, i) => (
              <li key={i} className={cx('rounded-2xl border p-3 transition', r.on ? 'border-line bg-surface' : 'border-line/50 opacity-55')}>
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    aria-label={r.on ? `Leave out ${r.name}` : `Include ${r.name}`}
                    aria-pressed={r.on}
                    onClick={() => setRow(i, { on: !r.on })}
                    className={cx('mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md border', r.on ? 'border-ember bg-ember text-on-accent' : 'border-line')}
                  >
                    {r.on ? <Check size={15} strokeWidth={3} /> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <input
                      value={r.name}
                      aria-label="Food name"
                      onChange={(e) => setRow(i, { name: e.target.value })}
                      className="w-full bg-transparent font-medium outline-none focus:underline"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <span>{r.item.portion}</span>
                      {r.item.confidence === 'low' ? <Tag tone="amber">rough guess</Tag> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted tabular">
                      <span className="font-semibold text-ink">{Math.round(r.item.kcal * r.mult)} kcal</span> · P {Math.round(r.item.protein * r.mult)} g · C {Math.round(r.item.carbs * r.mult)} g · F{' '}
                      {Math.round(r.item.fat * r.mult)} g
                    </div>
                  </div>
                </div>
                {r.on ? (
                  <div className="mt-2 flex items-center justify-between gap-2 pl-8">
                    <span className="text-xs text-muted">Portion</span>
                    <Stepper value={r.mult} onChange={(v) => setRow(i, { mult: v })} min={0.25} max={5} step={0.25} unit="×" />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted">Total</span>
            <span className="font-semibold tabular">
              {Math.round(total.kcal)} kcal · {Math.round(total.protein)} g protein
            </span>
          </div>
          <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
            <Button variant="secondary" onClick={() => setStage({ kind: 'input' })}>
              Redo
            </Button>
            <Button
              disabled={!chosen.length}
              onClick={() => {
                onLog(chosen.map((r) => entryFromEstimate(r.item, r.name, r.mult)))
                close()
              }}
            >
              Add {chosen.length} to {MEAL_LABEL[meal].toLowerCase()}
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-faint">Estimates can be off. Adjust portions if something looks wrong.</p>
        </div>
      ) : (
        <div>
          {stage.kind === 'empty' ? (
            <p className="mb-3 rounded-2xl bg-surface-2 px-3 py-2.5 text-sm text-muted">{stage.notes || 'No food found. Try again with a clearer photo or a description.'}</p>
          ) : null}
          {photoUrl ? (
            <>
              <img src={photoUrl} alt="Your meal" className="max-h-56 w-full rounded-2xl object-cover" />
              <label className="mt-3 block text-sm text-muted" htmlFor="ai-note">
                Anything the photo doesn’t show? <span className="text-faint">(optional)</span>
              </label>
              <input
                id="ai-note"
                value={note}
                maxLength={200}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. cooked in olive oil, ate half"
                className="mt-1.5 h-11 w-full rounded-2xl border border-line bg-surface px-3 outline-none placeholder:text-faint focus:border-ember"
              />
            </>
          ) : (
            <>
              <label className="block text-sm text-muted" htmlFor="ai-text">
                What did you eat? Include amounts if you know them.
              </label>
              <textarea
                id="ai-text"
                value={text}
                rows={3}
                maxLength={500}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. 2 scrambled eggs, a slice of whole-wheat toast with butter, coffee with milk"
                className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-surface px-3 py-2.5 outline-none placeholder:text-faint focus:border-ember"
              />
            </>
          )}
          {error ? (
            <p className="mt-3 flex items-start gap-1.5 text-sm text-bad" role="alert">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          ) : null}
          <Button className="mt-4" block icon={<Sparkles size={16} />} disabled={request?.mode === 'text' && text.trim().length < 2} onClick={() => void run()}>
            Estimate
          </Button>
          <p className="mt-3 text-center text-xs text-faint">Sent to Claude (Anthropic) for the estimate. You review everything before it’s logged.</p>
        </div>
      )}
    </Sheet>
  )
}
