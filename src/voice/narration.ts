import type { Exercise } from '@/data/exercises'

export type ChapterId = 'intro' | 'setup' | 'movement' | 'breathing' | 'mistakes' | 'variations'

export interface Segment {
  chapter: ChapterId
  text: string
  /** Show this fault animation (wrong form) while speaking. */
  fault?: string
  /** Badge shown over the animation. */
  badge?: 'wrong' | 'right'
  /** Slow the demo down during this line. */
  slow?: boolean
}

export const CHAPTER_TITLE: Record<ChapterId, string> = {
  intro: 'Overview',
  setup: 'Setup',
  movement: 'Movement',
  breathing: 'Breathing',
  mistakes: 'Common mistakes',
  variations: 'Easier & harder',
}

/** The voiced tutorial script for an exercise, as a list of spoken segments. */
export function tutorialScript(ex: Exercise): Segment[] {
  const c = ex.copy
  const out: Segment[] = []
  out.push({ chapter: 'intro', text: `${ex.name}. ${c.summary}` })
  c.setup.forEach((t) => out.push({ chapter: 'setup', text: t }))
  c.steps.forEach((t) => out.push({ chapter: 'movement', text: t, slow: true }))
  out.push({ chapter: 'breathing', text: c.breathing })
  c.mistakes.forEach((m) => {
    out.push({ chapter: 'mistakes', text: `Common mistake: ${m.text}`, fault: m.fault, badge: 'wrong' })
    out.push({ chapter: 'mistakes', text: `Instead, ${lowerFirst(m.fix)}`, badge: 'right' })
  })
  out.push({ chapter: 'variations', text: `To make it easier: ${lowerFirst(c.easier)}` })
  out.push({ chapter: 'variations', text: `Ready for more? ${c.harder}` })
  if (c.safety) out.push({ chapter: 'variations', text: c.safety })
  return out
}

function lowerFirst(s: string): string {
  if (!s) return s
  // Keep "I", acronyms and proper nouns that start with two capitals.
  if (/^[A-Z][A-Z]/.test(s) || /^I\b/.test(s)) return s
  return s[0].toLowerCase() + s.slice(1)
}
