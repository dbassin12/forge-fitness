import { useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { Clock, Utensils } from 'lucide-react'
import { recipeById } from '@/engines/meals/planner'
import { recipeKosher, recipeMacros } from '@/engines/nutrition/foods'
import { todayISO } from '@/lib/dates'
import { addEntry, entryForRecipe } from '@/state/nutrition'
import { useProfile } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { Tag } from '@/ui/Chip'
import { PageHeader } from '@/ui/PageHeader'
import { Stepper } from '@/ui/Stepper'
import { mealForHour } from './labels'

export default function RecipePage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const profile = useProfile()
  const r = recipeById(id)
  const [servings, setServings] = useState(Number(params.get('servings')) || 1)
  const [done, setDone] = useState(false)
  if (!r) return <PageHeader title="Recipe not found" back />
  const m = recipeMacros(r)
  const k = recipeKosher(r)
  return (
    <>
      <PageHeader title={r.name} subtitle={r.blurb} back />
      <div className="px-4">
        <div className="flex flex-wrap gap-2">
          <Tag tone="ember">
            <Clock size={13} /> {r.prepMin + r.cookMin} min
          </Tag>
          {r.noCook ? <Tag tone="teal">No cooking</Tag> : null}
          {k === 'meat' || k === 'dairy' ? <Tag tone="sky">{k === 'meat' ? 'Meat' : 'Dairy'}</Tag> : <Tag tone="sky">Pareve</Tag>}
          {r.tags.includes('high-protein') ? <Tag tone="violet">High protein</Tag> : null}
        </div>
        <Card className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            { k: 'kcal', v: Math.round(m.kcal * servings) },
            { k: 'protein', v: `${Math.round(m.protein * servings)} g` },
            { k: 'carbs', v: `${Math.round(m.carbs * servings)} g` },
            { k: 'fat', v: `${Math.round(m.fat * servings)} g` },
          ].map((x) => (
            <div key={x.k}>
              <div className="font-display text-lg font-bold tabular">{x.v}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted">{x.k}</div>
            </div>
          ))}
        </Card>
        <SectionTitle>
          Ingredients{r.servings > 1 ? ` (makes ${r.servings} servings)` : ''}
        </SectionTitle>
        <Card className="py-1">
          <ul className="divide-y divide-line/60">
            {r.ingredients.map((i) => (
              <li key={i.foodId + i.display} className="py-2.5 text-sm">
                {i.display}
              </li>
            ))}
          </ul>
        </Card>
        <SectionTitle>Steps</SectionTitle>
        <ol className="space-y-3">
          {r.steps.map((s, n) => (
            <li key={n} className="flex gap-3 text-[15px]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ember/15 text-sm font-bold text-ember">{n + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        {profile ? (
          <Card className="mt-6">
            <div className="flex items-center justify-between">
              <span className="font-semibold">I ate</span>
              <Stepper value={servings} onChange={setServings} min={0.25} max={6} step={0.25} unit="×" label="servings" />
            </div>
            <Button
              block
              className="mt-3"
              icon={<Utensils size={16} />}
              disabled={done}
              onClick={async () => {
                const e = entryForRecipe(r.id, servings, todayISO(), mealForHour(new Date().getHours()))
                if (e) await addEntry(e, profile)
                setDone(true)
              }}
            >
              {done ? 'Logged' : 'Log it'}
            </Button>
          </Card>
        ) : null}
        <div className="h-6" />
      </div>
    </>
  )
}
