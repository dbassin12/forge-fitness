import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { Barcode, ChefHat, Clock, Globe, Loader2, PenLine, Plus, Search, Star, Zap } from 'lucide-react'
import { db, type CustomFood, type MealSlot } from '@/db/db'
import { FOOD_BY_ID } from '@/data/foods'
import { RECIPES } from '@/data/recipes'
import { defaultServing, foodMacros, recipeFits, recipeMacros, searchFoods } from '@/engines/nutrition/foods'
import { todayISO } from '@/lib/dates'
import { uid } from '@/lib/id'
import { useProfile } from '@/state/store'
import { addEntry, toggleFavorite, useFavorites, useRecents, type NewEntry } from '@/state/nutrition'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Chip } from '@/ui/Chip'
import { PageHeader } from '@/ui/PageHeader'
import { Sheet } from '@/ui/Sheet'
import { cx } from '@/ui/cx'
import { BarcodeScanner } from './BarcodeScanner'
import { FoodSheet, pickableKey, type Pickable } from './FoodSheet'
import { MEAL_LABEL, mealForHour } from './labels'
import { lookupBarcode, searchOnline, type OffProduct } from './off'

type Tab = 'recent' | 'favorites' | 'recipes' | 'mine'

const inputCls = 'h-11 w-full rounded-2xl border border-line bg-surface px-3 text-ink outline-none focus:border-ember'

function Row({ title, sub, kcal, onClick, star }: { title: string; sub: string; kcal?: number; onClick: () => void; star?: boolean }) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate font-medium">
            {star ? <Star size={13} className="shrink-0 fill-amber text-amber" /> : null}
            <span className="truncate">{title}</span>
          </div>
          <div className="truncate text-xs text-muted">{sub}</div>
        </div>
        {kcal !== undefined ? <div className="text-sm font-semibold tabular">{Math.round(kcal)}</div> : null}
        <Plus size={18} className="shrink-0 text-ember" />
      </button>
    </li>
  )
}

export default function AddFoodPage() {
  const profile = useProfile()
  const [params] = useSearchParams()
  const date = params.get('d') ?? todayISO()
  const [meal, setMeal] = useState<MealSlot>((params.get('meal') as MealSlot) || mealForHour(new Date().getHours()))
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('recent')
  const [picked, setPicked] = useState<Pickable | null>(null)
  const [scan, setScan] = useState(false)
  const [quick, setQuick] = useState(false)
  const [custom, setCustom] = useState<{ barcode?: string } | null>(null)
  const [online, setOnline] = useState<{ state: 'idle' | 'loading' | 'done' | 'error'; items: OffProduct[] }>({ state: 'idle', items: [] })
  const [toast, setToast] = useState<string | null>(null)
  const recents = useRecents()
  const favorites = useFavorites()
  const customFoods = useLiveQuery(() => db.customFoods.orderBy('name').toArray(), [])
  const abort = useRef<AbortController | null>(null)

  // Deep link from a nudge: open that food straight away.
  useEffect(() => {
    const id = params.get('food')
    const f = id ? FOOD_BY_ID.get(id) : undefined
    if (f) setPicked({ kind: 'db', food: f })
  }, [params])

  useEffect(() => {
    setOnline({ state: 'idle', items: [] })
    abort.current?.abort()
  }, [q])

  const local = useMemo(() => (q.trim() ? searchFoods(q, { diet: profile?.diet, limit: 25 }) : []), [q, profile?.diet])
  const recipeHits = useMemo(() => {
    const n = q.trim().toLowerCase()
    return n ? RECIPES.filter((r) => r.name.toLowerCase().includes(n) && (!profile || recipeFits(r, profile.diet))).slice(0, 6) : []
  }, [q, profile])
  const customHits = useMemo(() => {
    const n = q.trim().toLowerCase()
    return n ? (customFoods ?? []).filter((c) => c.name.toLowerCase().includes(n)) : []
  }, [q, customFoods])

  if (!profile) return <PageHeader title="Add food" back />

  const log = async (e: NewEntry) => {
    await addEntry({ ...e, meal, date }, profile)
    setToast(`Added ${e.name.split(',')[0]} to ${MEAL_LABEL[meal].toLowerCase()}`)
    window.setTimeout(() => setToast(null), 2200)
  }

  const runOnline = async () => {
    abort.current?.abort()
    const ctl = new AbortController()
    abort.current = ctl
    setOnline({ state: 'loading', items: [] })
    try {
      const items = await searchOnline(q, ctl.signal)
      setOnline({ state: 'done', items })
    } catch {
      if (!ctl.signal.aborted) setOnline({ state: 'error', items: [] })
    }
  }

  const onBarcode = async (code: string) => {
    setScan(false)
    const known = await db.customFoods.where('barcode').equals(code).first()
    if (known) return setPicked({ kind: 'custom', food: known })
    setToast('Looking up barcode…')
    try {
      const p = await lookupBarcode(code)
      setToast(null)
      if (p) setPicked({ kind: 'off', product: p })
      else setCustom({ barcode: code })
    } catch {
      setToast(null)
      setCustom({ barcode: code })
    }
  }

  const favSet = favorites ?? new Set<string>()
  const favoriteItems: Pickable[] = [...favSet].flatMap((key): Pickable[] => {
    const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)]
    if (kind === 'db') {
      const f = FOOD_BY_ID.get(id)
      return f ? [{ kind: 'db', food: f }] : []
    }
    if (kind === 'recipe') {
      const r = RECIPES.find((x) => x.id === id)
      return r ? [{ kind: 'recipe', recipe: r }] : []
    }
    if (kind === 'custom') {
      const c = customFoods?.find((x) => x.id === id)
      return c ? [{ kind: 'custom', food: c }] : []
    }
    return []
  })

  return (
    <>
      <PageHeader title="Add food" subtitle={date === todayISO() ? 'Today' : date} back />
      <div className="px-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealSlot[]).map((m) => (
            <Chip key={m} active={meal === m} onClick={() => setMeal(m)}>
              {MEAL_LABEL[m]}
            </Chip>
          ))}
        </div>
        <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl border border-line bg-surface px-3 text-muted focus-within:border-ember">
          <Search size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search foods, e.g. eggs, banana" className="h-full flex-1 bg-transparent text-ink outline-none placeholder:text-faint" />
        </label>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="secondary" size="sm" icon={<Barcode size={16} />} onClick={() => setScan(true)}>
            Scan
          </Button>
          <Button variant="secondary" size="sm" icon={<Zap size={16} />} onClick={() => setQuick(true)}>
            Quick add
          </Button>
          <Button variant="secondary" size="sm" icon={<PenLine size={16} />} onClick={() => setCustom({})}>
            New food
          </Button>
        </div>

        {q.trim() ? (
          <>
            {customHits.length || recipeHits.length || local.length ? (
              <Card className="mt-4 py-1">
                <ul className="divide-y divide-line/60">
                  {customHits.map((c) => (
                    <Row key={c.id} title={c.name} sub={`My food · ${c.servingLabel}`} kcal={c.kcal} onClick={() => setPicked({ kind: 'custom', food: c })} />
                  ))}
                  {recipeHits.map((r) => (
                    <Row key={r.id} title={r.name} sub="Recipe · 1 serving" kcal={recipeMacros(r).kcal} onClick={() => setPicked({ kind: 'recipe', recipe: r })} />
                  ))}
                  {local.map((f) => {
                    const s = defaultServing(f)
                    return <Row key={f.id} title={f.name} sub={s.label} kcal={foodMacros(f, s.amount).kcal} star={favSet.has(`db:${f.id}`)} onClick={() => setPicked({ kind: 'db', food: f })} />
                  })}
                </ul>
              </Card>
            ) : (
              <p className="mt-4 px-1 text-sm text-muted">No match in the built-in list.</p>
            )}
            <div className="mt-3">
              {online.state === 'idle' ? (
                <Button variant="ghost" block icon={<Globe size={16} />} onClick={() => void runOnline()}>
                  Search packaged foods online
                </Button>
              ) : online.state === 'loading' ? (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted">
                  <Loader2 size={16} className="animate-spin" /> Searching Open Food Facts…
                </div>
              ) : online.state === 'error' ? (
                <p className="py-3 text-center text-sm text-muted">Online search isn't available right now. Try scanning the barcode instead.</p>
              ) : online.items.length ? (
                <Card className="py-1">
                  <ul className="divide-y divide-line/60">
                    {online.items.map((p) => (
                      <Row key={p.code || p.name} title={p.name} sub={`${p.brand ?? 'Packaged food'} · per 100 ${p.unit}`} kcal={p.per100.kcal} onClick={() => setPicked({ kind: 'off', product: p })} />
                    ))}
                  </ul>
                </Card>
              ) : (
                <p className="py-3 text-center text-sm text-muted">Nothing found online either.</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4">
              {(
                [
                  ['recent', 'Recent', Clock],
                  ['favorites', 'Favorites', Star],
                  ['recipes', 'Recipes', ChefHat],
                  ['mine', 'My foods', PenLine],
                ] as const
              ).map(([id, label, Icon]) => (
                <Chip key={id} active={tab === id} onClick={() => setTab(id)}>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon size={14} /> {label}
                  </span>
                </Chip>
              ))}
            </div>
            <Card className="mt-3 py-1">
              <ul className="divide-y divide-line/60">
                {tab === 'recent' &&
                  (recents ?? []).map(({ key, entry }) => (
                    <Row
                      key={key}
                      title={entry.name}
                      sub={`${entry.servings !== 1 && !entry.servingLabel.includes('serving') ? `${entry.servings} × ` : ''}${entry.servingLabel}`}
                      kcal={entry.kcal}
                      onClick={() => {
                        const { id: _i, createdAt: _c, ...rest } = entry
                        void _i
                        void _c
                        void log(rest)
                      }}
                    />
                  ))}
                {tab === 'favorites' &&
                  favoriteItems.map((p) => (
                    <Row
                      key={pickableKey(p)}
                      star
                      title={p.kind === 'recipe' ? p.recipe.name : p.kind === 'off' ? p.product.name : p.food.name}
                      sub={p.kind === 'recipe' ? 'Recipe' : p.kind === 'custom' ? p.food.servingLabel : p.kind === 'db' ? defaultServing(p.food).label : ''}
                      onClick={() => setPicked(p)}
                    />
                  ))}
                {tab === 'recipes' &&
                  RECIPES.filter((r) => recipeFits(r, profile.diet, profile.avoidFoods) && r.meals.includes(meal === 'snack' ? 'snack' : meal)).map((r) => (
                    <Row key={r.id} title={r.name} sub={`${r.prepMin + r.cookMin} min · ${Math.round(recipeMacros(r).protein)} g protein`} kcal={recipeMacros(r).kcal} onClick={() => setPicked({ kind: 'recipe', recipe: r })} />
                  ))}
                {tab === 'mine' &&
                  (customFoods ?? []).map((c) => <Row key={c.id} title={c.name} sub={c.servingLabel} kcal={c.kcal} onClick={() => setPicked({ kind: 'custom', food: c })} />)}
              </ul>
              {(tab === 'recent' && !recents?.length) || (tab === 'favorites' && !favoriteItems.length) || (tab === 'mine' && !customFoods?.length) ? (
                <p className="py-4 text-center text-sm text-muted">
                  {tab === 'recent' ? 'Foods you log show up here for one-tap re-logging.' : tab === 'favorites' ? 'Tap the star on any food to keep it here.' : 'Foods you create or scan appear here.'}
                </p>
              ) : null}
            </Card>
          </>
        )}
        <div className="h-6" />
      </div>

      <FoodSheet
        item={picked}
        meal={meal}
        date={date}
        favorite={picked ? favSet.has(pickableKey(picked)) : false}
        onToggleFavorite={() => picked && void toggleFavorite(pickableKey(picked))}
        onClose={() => setPicked(null)}
        onAdd={(e) => {
          void log(e)
          if (picked?.kind === 'off') {
            // Remember scanned products so they work offline next time.
            const p = picked.product
            const s = p.servingG ?? 100
            const k = s / 100
            void db.customFoods.add({
              id: uid('cf'),
              name: p.brand ? `${p.name} (${p.brand})` : p.name,
              servingLabel: p.servingLabel ?? `${s} ${p.unit}`,
              kcal: Math.round(p.per100.kcal * k),
              protein: Math.round(p.per100.protein * k * 10) / 10,
              carbs: Math.round(p.per100.carbs * k * 10) / 10,
              fat: Math.round(p.per100.fat * k * 10) / 10,
              fiber: Math.round(p.per100.fiber * k * 10) / 10,
              barcode: p.code || undefined,
              createdAt: Date.now(),
            })
          }
        }}
      />
      {scan ? <BarcodeScanner onCode={(c) => void onBarcode(c)} onClose={() => setScan(false)} /> : null}
      <QuickAddSheet open={quick} onClose={() => setQuick(false)} onAdd={(e) => void log({ ...e, date, meal })} />
      <CustomFoodSheet
        open={!!custom}
        barcode={custom?.barcode}
        onClose={() => setCustom(null)}
        onSave={async (c, logIt) => {
          await db.customFoods.add(c)
          if (logIt)
            void log({ date, meal, name: c.name, source: 'custom', refId: c.id, servings: 1, servingLabel: c.servingLabel, kcal: c.kcal, protein: c.protein, carbs: c.carbs, fat: c.fat, fiber: c.fiber })
          setCustom(null)
        }}
      />
      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4" style={{ bottom: 'calc(var(--tabbar-h) + var(--safe-bottom) + 12px)' }}>
          <div className="animate-fade-up rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg shadow-xl" role="status">
            {toast}
          </div>
        </div>
      ) : null}
    </>
  )
}

function num(v: string): number {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function QuickAddSheet({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (e: Omit<NewEntry, 'date' | 'meal'>) => void }) {
  const [name, setName] = useState('')
  const [kcal, setKcal] = useState('')
  const [p, setP] = useState('')
  const [c, setC] = useState('')
  const [f, setF] = useState('')
  const close = () => {
    setName('')
    setKcal('')
    setP('')
    setC('')
    setF('')
    onClose()
  }
  return (
    <Sheet open={open} onClose={close} title="Quick add">
      <div className="space-y-3">
        <input className={inputCls} placeholder="What was it? (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} inputMode="numeric" placeholder="Calories" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <input className={inputCls} inputMode="decimal" placeholder="Protein g" value={p} onChange={(e) => setP(e.target.value)} />
          <input className={inputCls} inputMode="decimal" placeholder="Carbs g" value={c} onChange={(e) => setC(e.target.value)} />
          <input className={inputCls} inputMode="decimal" placeholder="Fat g" value={f} onChange={(e) => setF(e.target.value)} />
        </div>
        <Button
          block
          size="lg"
          disabled={!num(kcal) && !num(p)}
          onClick={() => {
            onAdd({ name: name.trim() || 'Quick add', source: 'quick', servings: 1, servingLabel: '1 entry', kcal: num(kcal) || num(p) * 4 + num(c) * 4 + num(f) * 9, protein: num(p), carbs: num(c), fat: num(f) })
            close()
          }}
        >
          Add
        </Button>
      </div>
    </Sheet>
  )
}

function CustomFoodSheet({ open, barcode, onClose, onSave }: { open: boolean; barcode?: string; onClose: () => void; onSave: (c: CustomFood, logIt: boolean) => void }) {
  const [name, setName] = useState('')
  const [serving, setServing] = useState('1 serving')
  const [kcal, setKcal] = useState('')
  const [p, setP] = useState('')
  const [c, setC] = useState('')
  const [f, setF] = useState('')
  const [fiber, setFiber] = useState('')
  const valid = name.trim() && num(kcal) > 0
  const build = (): CustomFood => ({
    id: uid('cf'),
    name: name.trim(),
    servingLabel: serving.trim() || '1 serving',
    kcal: num(kcal),
    protein: num(p),
    carbs: num(c),
    fat: num(f),
    fiber: num(fiber),
    barcode,
    createdAt: Date.now(),
  })
  return (
    <Sheet open={open} onClose={onClose} title={barcode ? 'New product' : 'Create a food'}>
      {barcode ? <p className="-mt-1 mb-3 text-sm text-muted">We couldn't find barcode {barcode}. Copy the numbers from the label once and Forge will remember it.</p> : null}
      <div className="space-y-3">
        <input className={inputCls} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={inputCls} placeholder="Serving (e.g. 1 bar, 30 g)" value={serving} onChange={(e) => setServing(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} inputMode="numeric" placeholder="Calories" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          <input className={inputCls} inputMode="decimal" placeholder="Protein g" value={p} onChange={(e) => setP(e.target.value)} />
          <input className={inputCls} inputMode="decimal" placeholder="Carbs g" value={c} onChange={(e) => setC(e.target.value)} />
          <input className={inputCls} inputMode="decimal" placeholder="Fat g" value={f} onChange={(e) => setF(e.target.value)} />
          <input className={cx(inputCls, 'col-span-2')} inputMode="decimal" placeholder="Fiber g (optional)" value={fiber} onChange={(e) => setFiber(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={!valid} onClick={() => onSave(build(), false)}>
            Save
          </Button>
          <Button disabled={!valid} onClick={() => onSave(build(), true)}>
            Save & log
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
