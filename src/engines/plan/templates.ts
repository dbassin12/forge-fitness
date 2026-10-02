import type { SessionTemplate, TemplateId } from './types'

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
}

/**
 * The weekly rotation. Sessions form a rolling queue: a missed day simply shifts the queue, so
 * nothing is ever "failed".
 */
export function splitFor(daysPerWeek: number, sessionMinutes: number): TemplateId[] {
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
