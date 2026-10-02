import { useMemo, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { groceryList, groceryText } from '@/engines/meals/grocery'
import { todayISO } from '@/lib/dates'
import { toggleGrocery, useGroceryChecks, useMealPlan } from '@/state/meals'
import { useProfile } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Segmented } from '@/ui/Segmented'

export default function GroceryPage() {
  const profile = useProfile()
  const plan = useMealPlan(profile)
  const checks = useGroceryChecks(plan?.weekOf)
  const [range, setRange] = useState<'week' | 'rest'>('rest')
  const [copied, setCopied] = useState(false)
  const aisles = useMemo(() => {
    if (!plan) return []
    const today = todayISO()
    return groceryList(plan, range === 'rest' ? plan.days.filter((d) => d.date >= today).map((d) => d.date) : undefined)
  }, [plan, range])

  if (!plan) return <PageHeader title="Grocery list" back="/eat/plan" />
  const text = groceryText(aisles)
  const total = aisles.reduce((n, a) => n + a.items.length, 0)
  const done = aisles.reduce((n, a) => n + a.items.filter((i) => checks?.has(i.foodId)).length, 0)

  return (
    <>
      <PageHeader title="Grocery list" subtitle={`${done}/${total} in the cart`} back="/eat/plan" />
      <div className="px-4">
        <Segmented
          label="Which days"
          value={range}
          onChange={setRange}
          options={[
            { value: 'rest', label: 'Rest of the week' },
            { value: 'week', label: 'Whole week' },
          ]}
        />
        {aisles.map((a) => (
          <section key={a.category}>
            <SectionTitle>{a.label}</SectionTitle>
            <Card className="py-1">
              <ul className="divide-y divide-line/60">
                {a.items.map((i) => {
                  const on = checks?.has(i.foodId) ?? false
                  return (
                    <li key={i.foodId}>
                      <button type="button" onClick={() => void toggleGrocery(plan.weekOf, i.foodId)} className="flex w-full items-center gap-3 py-2.5 text-left" aria-pressed={on}>
                        <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-lg border', on ? 'border-good bg-good text-on-accent' : 'border-line')}>
                          {on ? <Check size={15} strokeWidth={3} /> : null}
                        </span>
                        <span className={cx('flex-1', on && 'text-faint line-through')}>
                          <span className="block text-sm font-medium">{i.name}</span>
                          <span className="block text-xs text-muted">{i.display}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          </section>
        ))}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            icon={copied ? <Check size={16} /> : <Copy size={16} />}
            onClick={async () => {
              await navigator.clipboard?.writeText(text)
              setCopied(true)
              window.setTimeout(() => setCopied(false), 1800)
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="secondary"
            icon={<Share2 size={16} />}
            disabled={typeof navigator.share !== 'function'}
            onClick={() => void navigator.share?.({ title: 'Grocery list', text }).catch(() => undefined)}
          >
            Share
          </Button>
        </div>
      </div>
    </>
  )
}
