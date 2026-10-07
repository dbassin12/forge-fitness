import type { Intention } from '@/domain/types'
import type { PlanInputs, SessionTemplate, StrengthTemplateId, TemplateId, YogaTemplateId } from './types'

export const TEMPLATES: Record<TemplateId, SessionTemplate> = {
  full_a: {
    id: 'full_a',
    name: 'Full Body A',
    focus: 'full',
    slots: [
      { ladder: 'squat', priority: 1 },
      { ladder: 'h_push', priority: 1 },
      { ladder: 'h_pull', priority: 1 },
      { ladder: 'hinge', priority: 2 },
      { ladder: 'core_ext', priority: 3 },
      { ladder: 'cond', priority: 4 },
    ],
  },
  full_b: {
    id: 'full_b',
    name: 'Full Body B',
    focus: 'full',
    slots: [
      { ladder: 'lunge', priority: 1 },
      { ladder: 'v_push', priority: 1 },
      { ladder: 'h_pull', priority: 1 },
      { ladder: 'bridge', priority: 2 },
      { ladder: 'core_lat', priority: 3 },
      { ladder: 'cond', priority: 4 },
    ],
  },
  full_c: {
    id: 'full_c',
    name: 'Full Body C',
    focus: 'full',
    slots: [
      { ladder: 'hinge', priority: 1 },
      { ladder: 'h_push', priority: 1 },
      { ladder: 'v_pull', priority: 2 },
      { ladder: 'lunge', priority: 2 },
      { ladder: 'core_flex', priority: 3 },
      { ladder: 'cond', priority: 4 },
    ],
  },
  upper_a: {
    id: 'upper_a',
    name: 'Upper Body A',
    focus: 'upper',
    slots: [
      { ladder: 'h_push', priority: 1 },
      { ladder: 'h_pull', priority: 1 },
      { ladder: 'v_push', priority: 2 },
      { ladder: 'biceps', priority: 3 },
      { ladder: 'triceps', priority: 3 },
      { ladder: 'core_ext', priority: 4 },
    ],
  },
  upper_b: {
    id: 'upper_b',
    name: 'Upper Body B',
    focus: 'upper',
    slots: [
      { ladder: 'v_push', priority: 1 },
      { ladder: 'h_pull', priority: 1 },
      { ladder: 'h_push', priority: 2 },
      { ladder: 'v_pull', priority: 2 },
      { ladder: 'triceps', priority: 3 },
      { ladder: 'core_flex', priority: 4 },
    ],
  },
  lower_a: {
    id: 'lower_a',
    name: 'Lower Body A',
    focus: 'lower',
    slots: [
      { ladder: 'squat', priority: 1 },
      { ladder: 'hinge', priority: 1 },
      { ladder: 'lunge', priority: 2 },
      { ladder: 'bridge', priority: 3 },
      { ladder: 'core_lat', priority: 3 },
      { ladder: 'cond', priority: 4 },
    ],
  },
  lower_b: {
    id: 'lower_b',
    name: 'Lower Body B',
    focus: 'lower',
    slots: [
      { ladder: 'hinge', priority: 1 },
      { ladder: 'lunge', priority: 1 },
      { ladder: 'squat', priority: 2 },
      { ladder: 'bridge', priority: 2 },
      { ladder: 'core_ext', priority: 3 },
      { ladder: 'cond', priority: 4 },
    ],
  },
  cond_core: {
    id: 'cond_core',
    name: 'Cardio & Core',
    focus: 'conditioning',
    slots: [
      { ladder: 'cond', priority: 1 },
      { ladder: 'core_ext', priority: 1 },
      { ladder: 'cond', priority: 2 },
      { ladder: 'core_flex', priority: 2 },
      { ladder: 'cond', priority: 3 },
      { ladder: 'core_lat', priority: 3 },
    ],
  },

  // ---- Bloom's practice themes (the full sequence of each lives in ./yoga.ts) ----
  y_morning: {
    id: 'y_morning',
    name: 'Morning Flow',
    focus: 'yoga',
    slots: [
      { ladder: 'y_flow', priority: 1 },
      { ladder: 'y_standing', priority: 1 },
      { ladder: 'y_balance', priority: 2 },
      { ladder: 'y_hip', priority: 3 },
    ],
  },
  y_strength: {
    id: 'y_strength',
    name: 'Strength & Balance',
    focus: 'yoga',
    slots: [
      { ladder: 'y_standing', priority: 1 },
      { ladder: 'y_balance', priority: 1 },
      { ladder: 'y_core', priority: 2 },
      { ladder: 'y_back', priority: 3 },
    ],
  },
  y_hips: {
    id: 'y_hips',
    name: 'Hips & Hamstrings',
    focus: 'yoga',
    slots: [
      { ladder: 'y_fold', priority: 1 },
      { ladder: 'y_hip', priority: 1 },
      { ladder: 'y_flow', priority: 2 },
    ],
  },
  y_back: {
    id: 'y_back',
    name: 'Back & Shoulders',
    focus: 'yoga',
    slots: [
      { ladder: 'y_back', priority: 1 },
      { ladder: 'y_core', priority: 3 },
    ],
  },
  y_unwind: {
    id: 'y_unwind',
    name: 'Evening Unwind',
    focus: 'yoga',
    slots: [{ ladder: 'y_hip', priority: 1 }],
  },
}

/** What each intention adds to a theme's place in the week. */
const YOGA_PULL: Record<Intention, Partial<Record<YogaTemplateId, number>>> = {
  flexibility: { y_hips: 2.5, y_morning: 0.5 },
  calm: { y_unwind: 2, y_back: 0.5 },
  sleep: { y_unwind: 2.5 },
  strength: { y_strength: 2.5, y_morning: 0.5 },
  balance: { y_strength: 1.5, y_morning: 1 },
  back: { y_back: 3, y_hips: 0.5 },
  energy: { y_morning: 2, y_strength: 0.5 },
}

/** A natural order through the week: wake up, build, open, release, rest. */
const YOGA_ORDER: YogaTemplateId[] = ['y_morning', 'y_strength', 'y_hips', 'y_back', 'y_unwind']
const YOGA_BASE: Record<YogaTemplateId, number> = { y_morning: 3, y_unwind: 2.6, y_strength: 2.2, y_hips: 2.1, y_back: 1.6 }

/** Bloom's weekly rotation: the themes that best fit her intentions, in a gentle order. */
export function yogaRotation(daysPerWeek: number, intentions: readonly Intention[] = []): YogaTemplateId[] {
  const d = Math.max(1, Math.min(7, Math.round(daysPerWeek)))
  const score = { ...YOGA_BASE }
  for (const i of intentions) for (const [t, w] of Object.entries(YOGA_PULL[i] ?? {})) score[t as YogaTemplateId] += w
  const ranked = [...YOGA_ORDER].sort((a, b) => score[b] - score[a] || YOGA_ORDER.indexOf(a) - YOGA_ORDER.indexOf(b))
  const picked = ranked.slice(0, Math.min(d, ranked.length)).sort((a, b) => YOGA_ORDER.indexOf(a) - YOGA_ORDER.indexOf(b))
  // Six or seven days: the favourite themes come round twice.
  for (let k = 0; picked.length < d; k++) picked.splice(Math.min(picked.length - 1, 1 + k * 2), 0, ranked[k])
  return picked
}

/** The rotation for whichever program the plan uses. */
export function rotationFor(inputs: Pick<PlanInputs, 'daysPerWeek' | 'sessionMinutes' | 'program' | 'intentions'>): TemplateId[] {
  return inputs.program === 'yoga' ? yogaRotation(inputs.daysPerWeek, inputs.intentions) : splitFor(inputs.daysPerWeek, inputs.sessionMinutes)
}

/** Short name of the weekly plan ("Full body A/B/C", or Bloom's themes). */
export function programName(inputs: Pick<PlanInputs, 'daysPerWeek' | 'sessionMinutes' | 'program' | 'intentions'>): string {
  if (inputs.program !== 'yoga') return splitName(inputs.daysPerWeek, inputs.sessionMinutes)
  const themes = [...new Set(yogaRotation(inputs.daysPerWeek, inputs.intentions))]
  return themes.length <= 2 ? themes.map((t) => TEMPLATES[t].name).join(' & ') : `${themes.length} gentle themes`
}

/**
 * The weekly rotation. Sessions form a rolling queue: a missed day simply shifts the queue, so
 * nothing is ever "failed".
 */
export function splitFor(daysPerWeek: number, sessionMinutes: number): StrengthTemplateId[] {
  const d = Math.max(1, Math.min(7, Math.round(daysPerWeek)))
  if (d <= 2) return ['full_a', 'full_b']
  if (d === 3 || sessionMinutes <= 15) return ['full_a', 'full_b', 'full_c']
  if (d === 4) return ['upper_a', 'lower_a', 'upper_b', 'lower_b']
  if (d === 5) return ['upper_a', 'lower_a', 'cond_core', 'upper_b', 'lower_b']
  return ['upper_a', 'lower_a', 'full_c', 'upper_b', 'lower_b', 'cond_core']
}

export function splitName(daysPerWeek: number, sessionMinutes: number): string {
  const s = splitFor(daysPerWeek, sessionMinutes)
  if (s[0] === 'full_a') return s.length === 2 ? 'Full body A/B' : 'Full body A/B/C'
  if (s.length === 4) return 'Upper / Lower'
  return 'Upper / Lower + cardio & core'
}
