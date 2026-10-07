import type { Ache, Equipment, Program } from '@/domain/types'
import type { ExerciseDef } from '@/data/exercises/types'

/** What the user can actually use right now (unfound dumbbells don't count). */
export interface Availability {
  /** Weight per hand for two-dumbbell moves. */
  pairLb?: number
  /** A light single dumbbell (front raises, twists). */
  singleLb?: number
  /** Heaviest dumbbell on hand (goblet squats, one-arm rows). */
  heavyLb?: number
  /** A heavier dumbbell the user owns but hasn't found — we fall back to `heavyLb` meanwhile. */
  missingHeavyLb?: number
  chair: boolean
  wall: boolean
  table: boolean
  stairs: boolean
}

export interface PlanContext {
  av: Availability
  aches: Ache[]
  quietMode: boolean
  /** Yoga practices word their cautions differently and never stack "harder" modifiers. */
  program?: Program
}

export function availability(eq: Equipment): Availability {
  const weights = eq.dumbbells
    .filter((d) => d.found && d.weightLb > 0 && d.count > 0)
    .flatMap((d) => Array.from({ length: Math.min(d.count, 4) }, () => d.weightLb))
    .sort((a, b) => b - a)
  const counts = new Map<number, number>()
  for (const w of weights) counts.set(w, (counts.get(w) ?? 0) + 1)
  // A real pair is two equal dumbbells; otherwise use the lighter of the two heaviest.
  let pairLb = [...counts.entries()].filter(([, c]) => c >= 2).map(([w]) => w)[0]
  if (pairLb === undefined && weights.length >= 2) pairLb = weights[1]
  const heavyLb = weights[0]
  const missing = eq.dumbbells.filter((d) => !d.found && d.count > 0 && d.weightLb > (heavyLb ?? 0))
  return {
    pairLb,
    singleLb: weights.length ? weights[weights.length - 1] : undefined,
    heavyLb,
    missingHeavyLb: missing.length ? Math.max(...missing.map((d) => d.weightLb)) : undefined,
    chair: eq.chair,
    wall: eq.wall,
    table: eq.table,
    stairs: eq.stairs,
  }
}

export function hasEquipment(ex: ExerciseDef, av: Availability): boolean {
  return ex.equipment.every((e) => {
    switch (e) {
      case 'db_pair':
        return av.pairLb !== undefined
      case 'db_single':
      case 'db_heavy':
        return av.heavyLb !== undefined
      case 'chair':
        return av.chair
      case 'wall':
        return av.wall
      case 'table':
        return av.table
      case 'stairs':
        return av.stairs
    }
  })
}

export type BlockReason = 'equipment' | 'ache' | 'impact'

/** Why an exercise is excluded for this user (undefined = allowed). */
export function blockReason(ex: ExerciseDef, ctx: PlanContext): BlockReason | undefined {
  if (!hasEquipment(ex, ctx.av)) return 'equipment'
  if (ex.avoidIf?.some((a) => ctx.aches.includes(a))) return 'ache'
  if (ctx.quietMode && ex.impact === 'high') return 'impact'
  return undefined
}

export function isAllowed(ex: ExerciseDef, ctx: PlanContext): boolean {
  return blockReason(ex, ctx) === undefined
}

/** Suggested dumbbell weight per hand. */
export function loadFor(ex: ExerciseDef, av: Availability): number | undefined {
  if (ex.equipment.includes('db_pair')) return av.pairLb
  if (ex.equipment.includes('db_heavy')) return av.heavyLb
  if (ex.equipment.includes('db_single')) return av.singleLb
  return undefined
}

const ACHE_NOTE: Record<Ache, string> = {
  knees: 'Knee-friendly: only go as deep as feels good',
  lower_back: 'Brace your core and keep your back neutral',
  shoulders: 'Stay in a pain-free shoulder range',
  wrists: 'Wrists complaining? Use fists or dumbbell handles',
  neck: 'Keep your neck long and relaxed; skip any head turns that pinch',
  hips: 'Hips: ease in slowly and stay where it feels like a gentle stretch',
  pregnancy: 'Pregnant: keep room for your belly, use a wall for balance, rest on your side',
}

/** Bloom's gentler wording for the same cautions. */
const YOGA_ACHE_NOTE: Record<Ache, string> = {
  knees: 'Knees: pad them with a folded blanket and bend only as far as feels kind',
  lower_back: 'Lower back: move slowly, soften your knees and stay out of any pinch',
  shoulders: 'Shoulders: keep them soft and low; lower your arms if they complain',
  wrists: 'Wrists: spread your fingers wide, or come down onto your forearms',
  neck: 'Neck: keep it long and look straight ahead or down',
  hips: 'Hips: stay where it feels like a gentle stretch, with cushions under you',
  pregnancy: 'Pregnant: keep room for your belly, stay near a wall and rest on your side',
}

/** Equipment fallbacks and ache cautions worth saying out loud. */
export function contextNotes(ex: ExerciseDef, ctx: PlanContext): string[] {
  const notes: string[] = []
  if (ex.equipment.includes('db_heavy') && ctx.av.missingHeavyLb && ctx.av.heavyLb) {
    notes.push(`Using the ${ctx.av.heavyLb} lb dumbbell until you find the heavier one: lower it slowly`)
  }
  const text = ctx.program === 'yoga' ? YOGA_ACHE_NOTE : ACHE_NOTE
  for (const a of ex.cautionIf ?? []) if (ctx.aches.includes(a)) notes.push(text[a])
  return notes
}
