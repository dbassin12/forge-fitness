import type { Ache, Intention } from '@/domain/types'

/** What Bloom can help with (picked during onboarding, editable in Settings). */
export const INTENTIONS: { id: Intention; title: string; emoji: string }[] = [
  { id: 'calm', title: 'Feel calmer', emoji: '🌿' },
  { id: 'sleep', title: 'Sleep better', emoji: '🌙' },
  { id: 'flexibility', title: 'More flexible', emoji: '🦋' },
  { id: 'strength', title: 'Gentle strength', emoji: '💪' },
  { id: 'balance', title: 'Better balance', emoji: '🌳' },
  { id: 'back', title: 'Ease my back', emoji: '🌊' },
  { id: 'energy', title: 'More energy', emoji: '☀️' },
]

/** Forge's aches. */
export const ACHES: { id: Ache; label: string }[] = [
  { id: 'knees', label: 'Knees' },
  { id: 'lower_back', label: 'Lower back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'wrists', label: 'Wrists' },
]

/** Bloom's "be gentle with" list (pregnancy has its own toggle). */
export const BLOOM_ACHES: { id: Ache; label: string }[] = [
  { id: 'knees', label: 'Knees' },
  { id: 'lower_back', label: 'Lower back' },
  { id: 'neck', label: 'Neck' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'wrists', label: 'Wrists' },
  { id: 'hips', label: 'Hips' },
]

export const PREGNANCY_NOTE =
  'Please check with your doctor or midwife before you start, and tell them what you’ll be doing. Rest on your side instead of flat on your back, keep a wall near you for balance, and stop anything that doesn’t feel right.'
