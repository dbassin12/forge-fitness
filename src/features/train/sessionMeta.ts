import { isBloom } from '@/app/brand'
import { getExercise } from '@/data/exercises'
import type { PlannedBlock, PlannedSession } from '@/engines/plan'

export function blockSummary(b: PlannedBlock): string {
  const r = b.rounds
  switch (b.format) {
    case 'straight':
      return `${r} ${r === 1 ? 'set' : 'sets'} · rest ${b.restSec}s`
    case 'superset':
      return `${r} rounds · back to back · rest ${b.restSec}s`
    case 'circuit':
      return `${r} ${r === 1 ? 'round' : 'rounds'} · rest ${b.restSec}s between rounds`
    case 'intervals': {
      const work = b.items[0]?.target.kind === 'time' ? b.items[0].target.seconds : 30
      return `${r} ${r === 1 ? 'round' : 'rounds'} · ${work}s on / ${b.itemRestSec ?? 0}s off`
    }
    case 'flow':
      return `${b.items.length} ${isBloom ? 'poses' : 'moves'} · follow along${r > 1 ? ` · ${r} times through` : ''}`
  }
}

/** What to have nearby before starting ("2 × 20 lb dumbbells, a chair"). */
export function gearFor(s: PlannedSession): string[] {
  const out = new Set<string>()
  let pair: number | undefined
  let single: number | undefined
  for (const b of s.blocks)
    for (const it of b.items) {
      const ex = getExercise(it.exerciseId)
      if (!ex) continue
      if (ex.equipment.includes('db_pair')) pair = it.loadLb
      else if (ex.equipment.includes('db_heavy') || ex.equipment.includes('db_single')) single = it.loadLb
      if (ex.equipment.includes('chair')) out.add('a sturdy chair')
      if (ex.equipment.includes('wall')) out.add('some wall space')
      if (ex.equipment.includes('table')) out.add('a sturdy table')
      if (ex.equipment.includes('stairs')) out.add('a step or stairs')
    }
  const items: string[] = []
  if (pair) items.push(`2 × ${pair} lb dumbbells`)
  else if (single) items.push(`a ${single} lb dumbbell`)
  return [...items, ...out]
}
