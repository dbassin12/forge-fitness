import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import type { CustomFood, MealSlot } from '@/db/db'
import type { FoodItem } from '@/data/foods/types'
import type { Recipe } from '@/data/recipes/types'
import { foodMacros, recipeMacros, roundMacros, type Macros } from '@/engines/nutrition/foods'
import { PRODUCE_SERVING_G, type NewEntry } from '@/state/nutrition'
import { Button } from '@/ui/Button'
import { Sheet } from '@/ui/Sheet'
import { Stepper } from '@/ui/Stepper'
import { cx } from '@/ui/cx'
import type { OffProduct } from './off'
import { MEAL_LABEL } from './labels'

export type Pickable =
  | { kind: 'db'; food: FoodItem }
  | { kind: 'custom'; food: CustomFood }
  | { kind: 'recipe'; recipe: Recipe }
  | { kind: 'off'; product: OffProduct }

interface ServingOpt {
  label: string
  /** grams/ml per serving (db & OFF) — undefined for per-serving sources. */
  amount?: number
}

export function pickableKey(p: Pickable): string {
  switch (p.kind) {
    case 'db':
      return `db:${p.food.id}`
    case 'custom':
      return `custom:${p.food.id}`
    case 'recipe':
      return `recipe:${p.recipe.id}`
    case 'off':
      return `barcode:${p.product.code}`
  }
}

function servingsOf(p: Pickable): ServingOpt[] {
  switch (p.kind) {
    case 'db': {
      const base = p.food.servings.map((s) => ({ label: s.label, amount: s.amount }))
      return [...base, { label: `100 ${p.food.unit}`, amount: 100 }, { label: `1 ${p.food.unit}`, amount: 1 }]
    }
    case 'off': {
      const out: ServingOpt[] = []
      if (p.product.servingG) out.push({ label: p.product.servingLabel ?? `${p.product.servingG} ${p.product.unit}`, amount: p.product.servingG })
      out.push({ label: `100 ${p.product.unit}`, amount: 100 }, { label: `1 ${p.product.unit}`, amount: 1 })
      return out
    }
    case 'custom':
      return [{ label: p.food.servingLabel }]
    case 'recipe':
      return [{ label: '1 serving' }]
  }
}

function macrosFor(p: Pickable, s: ServingOpt, qty: number): Macros {
  switch (p.kind) {
    case 'db':
      return roundMacros(foodMacros(p.food, (s.amount ?? 100) * qty))
    case 'off': {
      const k = ((s.amount ?? 100) * qty) / 100
      const n = p.product.per100
      return roundMacros({ kcal: n.kcal * k, protein: n.protein * k, carbs: n.carbs * k, fat: n.fat * k, fiber: n.fiber * k })
    }
    case 'custom':
      return roundMacros({ kcal: p.food.kcal * qty, protein: p.food.protein * qty, carbs: p.food.carbs * qty, fat: p.food.fat * qty, fiber: (p.food.fiber ?? 0) * qty })
    case 'recipe': {
      const m = recipeMacros(p.recipe)
      return roundMacros({ kcal: m.kcal * qty, protein: m.protein * qty, carbs: m.carbs * qty, fat: m.fat * qty, fiber: m.fiber * qty })
    }
  }
}

function titleOf(p: Pickable): string {
  switch (p.kind) {
    case 'db':
    case 'custom':
      return p.food.name
    case 'recipe':
      return p.recipe.name
    case 'off':
      return p.product.brand ? `${p.product.name} (${p.product.brand})` : p.product.name
  }
}

/** Pick a serving and quantity, see the nutrition update live, then log it. */
export function FoodSheet({
  item,
  meal,
  date,
  favorite,
  onToggleFavorite,
  onClose,
  onAdd,
}: {
  item: Pickable | null
  meal: MealSlot
  date: string
  favorite: boolean
  onToggleFavorite: () => void
  onClose: () => void
  onAdd: (e: NewEntry) => void
}) {
  const options = useMemo(() => (item ? servingsOf(item) : []), [item])
  const [sel, setSel] = useState(0)
  const [qty, setQty] = useState(1)
  const s = options[Math.min(sel, options.length - 1)]
  const isGram = !!s && s.amount === 1
  const m = item && s ? macrosFor(item, s, qty) : null

  const reset = () => {
    setSel(0)
    setQty(1)
    onClose()
  }

  const add = () => {
    if (!item || !s || !m) return
    const produceG = item.kind === 'db' && item.food.produce ? (s.amount ?? 0) * qty : 0
    const entry: NewEntry = {
      date,
      meal,
      name: titleOf(item),
      source: item.kind === 'off' ? 'barcode' : item.kind === 'custom' ? 'custom' : item.kind === 'recipe' ? 'recipe' : 'db',
      refId: item.kind === 'db' || item.kind === 'custom' ? item.food.id : item.kind === 'recipe' ? item.recipe.id : item.product.code,
      servings: isGram ? 1 : qty,
      servingLabel: isGram ? `${qty} ${item.kind === 'db' ? item.food.unit : 'g'}` : s.label,
      ...m,
      veg: produceG > 0 ? true : undefined,
      produceServings: produceG > 0 ? Math.max(0.5, Math.round((produceG / PRODUCE_SERVING_G) * 2) / 2) : undefined,
    }
    onAdd(entry)
    reset()
  }

  return (
    <Sheet open={!!item} onClose={reset} title={item ? titleOf(item) : ''}>
      {item && s && m ? (
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{item.kind === 'off' ? 'From Open Food Facts' : item.kind === 'recipe' ? 'Recipe' : item.kind === 'custom' ? 'My food' : 'Forge food database'}</span>
            <button type="button" onClick={onToggleFavorite} aria-pressed={favorite} aria-label="Favorite" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-2">
              <Star size={20} className={favorite ? 'fill-amber text-amber' : 'text-faint'} />
            </button>
          </div>
          {options.length > 1 ? (
            <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
              {options.map((o, i) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => {
                    setSel(i)
                    setQty(o.amount === 1 ? Math.round(s.amount ?? 100) : 1)
                  }}
                  className={cx('h-9 shrink-0 rounded-full border px-3 text-sm', i === sel ? 'border-ember bg-ember/15 text-ember' : 'border-line text-muted')}
                >
                  {o.label}
                  {o.amount && o.amount !== 100 && o.amount !== 1 ? <span className="text-faint"> · {Math.round(o.amount)} g</span> : null}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-5 flex justify-center">
            <Stepper value={qty} onChange={setQty} min={isGram ? 1 : 0.25} max={isGram ? 2000 : 20} step={isGram ? 5 : 0.25} label="quantity" unit={isGram ? (item.kind === 'db' ? item.food.unit : 'g') : '×'} />
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            {[
              { k: 'kcal', v: Math.round(m.kcal) },
              { k: 'protein', v: `${Math.round(m.protein)} g` },
              { k: 'carbs', v: `${Math.round(m.carbs)} g` },
              { k: 'fat', v: `${Math.round(m.fat)} g` },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl bg-surface-2 py-2">
                <div className="font-display text-lg font-bold tabular">{x.v}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted">{x.k}</div>
              </div>
            ))}
          </div>
          <Button block size="lg" className="mt-5" onClick={add}>
            Add to {MEAL_LABEL[meal].toLowerCase()}
          </Button>
        </div>
      ) : null}
    </Sheet>
  )
}
