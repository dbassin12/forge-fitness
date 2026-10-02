import { Dumbbell, Plus, Trash2 } from 'lucide-react'
import type { Dumbbell as DumbbellT, Equipment } from '@/domain/types'
import { uid } from '@/lib/id'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Segmented } from '@/ui/Segmented'
import { Stepper } from '@/ui/Stepper'
import { Toggle } from '@/ui/Toggle'

/** Dumbbells (with "can't find it yet"), other gear and quiet mode. Shared by onboarding and settings. */
export function EquipmentEditor({
  equipment,
  quietMode,
  onChange,
  onQuietMode,
}: {
  equipment: Equipment
  quietMode: boolean
  onChange: (e: Equipment) => void
  onQuietMode: (v: boolean) => void
}) {
  const updateDb = (id: string, patch: Partial<DumbbellT>) => onChange({ ...equipment, dumbbells: equipment.dumbbells.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  return (
    <>
      <Card>
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <Dumbbell size={18} className="text-ember" /> Dumbbells
        </div>
        {equipment.dumbbells.length === 0 ? <p className="py-2 text-sm text-muted">No dumbbells — that's fine, your plan will be all bodyweight.</p> : null}
        <ul className="divide-y divide-line/70">
          {equipment.dumbbells.map((x) => (
            <li key={x.id} className="py-3">
              <div className="flex items-center gap-2">
                <Segmented
                  label="How many"
                  className="w-28"
                  value={x.count}
                  onChange={(v) => updateDb(x.id, { count: v })}
                  options={[
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                  ]}
                />
                <span className="text-muted">×</span>
                <Stepper value={x.weightLb} min={2.5} max={100} step={2.5} unit="lb" label="dumbbell weight" onChange={(v) => updateDb(x.id, { weightLb: v })} />
                <button
                  type="button"
                  aria-label="Remove"
                  className="ml-auto grid h-9 w-9 place-items-center rounded-full text-faint hover:text-bad"
                  onClick={() => onChange({ ...equipment, dumbbells: equipment.dumbbells.filter((y) => y.id !== x.id) })}
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <Toggle
                checked={x.found}
                onChange={(v) => updateDb(x.id, { found: v })}
                label={x.found ? 'Found it — use it' : "Can't find it yet"}
                description={x.found ? undefined : "We'll plan around it and switch it in when you find it."}
              />
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          size="sm"
          icon={<Plus size={16} />}
          onClick={() => onChange({ ...equipment, dumbbells: [...equipment.dumbbells, { id: uid(), weightLb: 15, count: 2, found: true }] })}
        >
          Add dumbbells
        </Button>
      </Card>
      <Card className="mt-3">
        <Toggle checked={equipment.chair} onChange={(v) => onChange({ ...equipment, chair: v })} label="Sturdy chair, bench or couch" />
        <Toggle checked={equipment.wall} onChange={(v) => onChange({ ...equipment, wall: v })} label="Clear wall space" />
        <Toggle checked={equipment.table} onChange={(v) => onChange({ ...equipment, table: v })} label="Very sturdy table" description="For inverted rows — it must hold your weight" />
        <Toggle checked={equipment.stairs} onChange={(v) => onChange({ ...equipment, stairs: v })} label="Stairs or a sturdy step" />
        <Toggle checked={equipment.mat} onChange={(v) => onChange({ ...equipment, mat: v })} label="Exercise mat or rug" />
      </Card>
      <Card className="mt-3">
        <Toggle checked={quietMode} onChange={onQuietMode} label="Quiet mode" description="No jumping — kind to neighbors and joints" />
      </Card>
    </>
  )
}
