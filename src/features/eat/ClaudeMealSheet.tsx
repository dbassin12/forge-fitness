import { useState } from 'react'
import { AlertTriangle, Check, ClipboardPaste, ExternalLink } from 'lucide-react'
import { storageKey } from '@/app/brand'
import type { MealSlot } from '@/db/db'
import type { NewEntry } from '@/state/nutrition'
import { Button } from '@/ui/Button'
import { Tag } from '@/ui/Chip'
import { Sheet } from '@/ui/Sheet'
import { Stepper } from '@/ui/Stepper'
import { cx } from '@/ui/cx'
import { mealPrompt, parseEstimate, sendToClaude, type FoodEstimateItem } from '../claude/handoff'
import { MEAL_LABEL } from './labels'

interface Row {
  item: FoodEstimateItem
  name: string
  on: boolean
  /** Portion multiplier the user can nudge (½ plate, seconds…). */
  mult: number
}

type Stage = { kind: 'prepare' } | { kind: 'paste' } | { kind: 'review'; notes: string; rows: Row[] }

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

// Switching to the Claude app can unload Forge on a phone; remembering the pending estimate lets
// the Add food page reopen this sheet at the paste step when the user comes back.
const PENDING_KEY = storageKey('claudeMeal')
const PENDING_MAX_MS = 45 * 60_000

export function pendingClaudeMeal(now = Date.now()): { meal: MealSlot; date: string } | null {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null') as { meal: MealSlot; date: string; at: number } | null
    return p && now - p.at < PENDING_MAX_MS ? { meal: p.meal, date: p.date } : null
  } catch {
    return null
  }
}

function setPending(v: { meal: MealSlot; date: string } | null) {
  try {
    if (v) localStorage.setItem(PENDING_KEY, JSON.stringify({ ...v, at: Date.now() }))
    else localStorage.removeItem(PENDING_KEY)
  } catch {
    /* storage unavailable: the user can still paste in this session */
  }
}

/**
 * Meal estimates through the user's own Claude app: Forge copies a prompt and opens Claude, the
 * user adds a photo there if they have one, then pastes Claude's answer back here to review.
 * Render with a fresh `key` per opening so each estimate starts clean.
 */
export function ClaudeMealSheet({
  open,
  resume,
  meal,
  date,
  onClose,
  onLog,
}: {
  open: boolean
  /** Reopened after a trip to Claude: start at the paste step. */
  resume?: boolean
  meal: MealSlot
  date: string
  onClose: () => void
  onLog: (entries: Omit<NewEntry, 'date' | 'meal'>[]) => void
}) {
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(true)
  const [answer, setAnswer] = useState('')
  const [stage, setStage] = useState<Stage>({ kind: resume ? 'paste' : 'prepare' })
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean | null>(null)

  const close = () => {
    setPending(null)
    onClose()
  }

  const read = (pasted: string) => {
    const r = parseEstimate(pasted)
    if (!r.ok) return setError(r.error)
    setError(null)
    setStage({ kind: 'review', notes: r.estimate.notes, rows: r.estimate.items.map((item) => ({ item, name: item.name, on: true, mult: 1 })) })
  }

  const rows = stage.kind === 'review' ? stage.rows : []
  const chosen = rows.filter((r) => r.on)
  const total = chosen.reduce((t, r) => ({ kcal: t.kcal + r.item.kcal * r.mult, protein: t.protein + r.item.protein * r.mult }), { kcal: 0, protein: 0 })
  const setRow = (i: number, patch: Partial<Row>) => {
    if (stage.kind !== 'review') return
    setStage({ ...stage, rows: stage.rows.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  }
  const canSend = photo || text.trim().length >= 2

  return (
    <Sheet open={open} onClose={close} title="Estimate with Claude">
      {stage.kind === 'prepare' ? (
        <div>
          <p className="text-sm text-muted">Claude estimates the calories and protein in your own Claude app, on your subscription. Then you paste its answer back here to check and log.</p>
          <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-3 py-3 text-sm">
            <span>I’ll add a photo in Claude</span>
            <input type="checkbox" className="h-5 w-5 accent-[var(--color-ember)]" checked={photo} onChange={(e) => setPhoto(e.target.checked)} />
          </label>
          <label className="mt-3 block text-sm text-muted" htmlFor="meal-text">
            {photo ? 'Anything the photo won’t show? (optional)' : 'What did you eat? Include amounts if you know them.'}
          </label>
          <textarea
            id="meal-text"
            value={text}
            rows={3}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
            placeholder={photo ? 'e.g. cooked in olive oil, I ate half' : 'e.g. 2 scrambled eggs, a slice of whole-wheat toast with butter, coffee with milk'}
            className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-surface px-3 py-2.5 outline-none placeholder:text-faint focus:border-ember"
          />
          <Button
            className="mt-4"
            block
            icon={<ExternalLink size={16} />}
            disabled={!canSend}
            onClick={() => {
              setPending({ meal, date })
              // A photo is attached in Claude before sending, so the chat isn't pre-filled then.
              void sendToClaude(mealPrompt(text, photo), { prefill: !photo }).then(setCopied)
              setStage({ kind: 'paste' })
            }}
          >
            Open Claude
          </Button>
          <button type="button" className="mt-1 w-full py-2.5 text-center text-sm text-muted underline" onClick={() => setStage({ kind: 'paste' })}>
            I already have Claude’s answer
          </button>
        </div>
      ) : stage.kind === 'paste' ? (
        <div>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
            {copied === false ? <li>Copying wasn’t allowed here. Go back and try again, or ask Claude for a meal estimate in Forge’s format.</li> : null}
            <li>In Claude, {photo ? 'attach your meal photo, ' : ''}paste the request{copied ? ' (it’s copied)' : ''} and send it.</li>
            <li>Copy Claude’s reply. The copy button on its code box works best.</li>
            <li>Come back here and paste it below.</li>
          </ol>
          <Button
            className="mt-4"
            block
            variant="secondary"
            icon={<ClipboardPaste size={16} />}
            onClick={async () => {
              try {
                const t = await navigator.clipboard.readText()
                setAnswer(t)
                read(t)
              } catch {
                setError('Your browser didn’t allow reading the clipboard. Long-press the box below and choose Paste.')
              }
            }}
          >
            Paste Claude’s answer
          </Button>
          <textarea
            value={answer}
            rows={5}
            aria-label="Claude’s answer"
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="…or paste it here"
            className="mt-3 w-full resize-none rounded-2xl border border-line bg-surface px-3 py-2.5 font-mono text-xs outline-none placeholder:font-sans placeholder:text-faint focus:border-ember"
          />
          {error ? (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-bad" role="alert">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
            <Button variant="secondary" onClick={() => setStage({ kind: 'prepare' })}>
              Back
            </Button>
            <Button disabled={!answer.trim()} onClick={() => read(answer)}>
              Read estimate
            </Button>
          </div>
        </div>
      ) : (
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
            <Button variant="secondary" onClick={() => setStage({ kind: 'paste' })}>
              Back
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
      )}
    </Sheet>
  )
}
