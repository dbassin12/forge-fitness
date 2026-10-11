import { isBloom } from '@/app/brand'
import { getExercise } from '@/data/exercises'
import { coachLine, type CoachMoment } from '@/voice/coachLines'
import { howToSteps, introLines, type HowToDepth } from './howto'
import type { RestStep, Step } from './steps'

/**
 * What the coach says as a rest or transition starts, sentence by sentence: the rest itself, then
 * what's next. Before an exercise's first set, `depth` decides how much of its how-to is read out.
 */
export function restLines(st: RestStep, prev: Step | undefined, depth: HowToDepth, coach: (m: CoachMoment) => string = coachLine): string[] {
  const n = st.next
  const ex = n ? getExercise(n.item.exerciseId) : undefined
  if (!n || !ex) return st.reason === 'side' ? ['Switch sides.'] : []
  const sameEx = prev?.kind === 'work' && prev.item.exerciseId === n.item.exerciseId
  const intro = (opening: 'first' | 'next') => introLines(ex, n, st.first ? depth : 'name', opening)
  const lastRound = n.round === n.rounds && n.rounds > 1
  switch (st.reason) {
    case 'ready':
      return [isBloom ? 'Find your space.' : 'Get ready.', ...intro('first')]
    case 'side':
      // (After a skip, a side switch can end up leading into a different exercise.)
      return sameEx ? ['Switch sides.'] : intro('next')
    case 'switch':
      return intro('next')
    case 'set': {
      const out = [`Rest for ${st.seconds} seconds.`]
      if (sameEx) out.push(`Then ${isBloom ? 'round' : 'set'} ${n.round} of ${n.rounds}.`)
      else out.push(...intro('next'))
      if (lastRound) out.push(coach('lastRound'))
      else if (st.seconds >= 30) out.push(coach('rest'))
      return out
    }
    case 'round':
      return ['Round done.', `Rest for ${st.seconds} seconds.`, ...intro('next'), ...(lastRound ? [coach('lastRound')] : [])]
    case 'block': {
      const needsDb = ex.equipment.some((e) => e.startsWith('db'))
      return [isBloom ? 'Lovely.' : 'Nice work.', ...(needsDb ? ['Grab your dumbbells.'] : []), ...intro('next')]
    }
  }
}

/** Whether the countdown waits for the coach to finish introducing the next exercise. */
export function holdsForIntro(st: RestStep, depth: HowToDepth): boolean {
  return !!st.first && !!st.next && depth !== 'name'
}

/** Everything the coach may say during these steps (to download the natural voice ahead of time). */
export function sessionLines(steps: Step[], depthOf: (exerciseId: string) => HowToDepth, coach: string[]): string[] {
  const out = ['Go!', 'Resume.', ...coach]
  const seen = new Set<string>()
  steps.forEach((st, i) => {
    if (st.kind === 'rest') {
      const id = st.next?.item.exerciseId
      out.push(...restLines(st, steps[i - 1], id ? depthOf(id) : 'name', () => '').filter(Boolean))
      return
    }
    for (let n = 1; n <= (st.reps ?? 0); n++) out.push(String(n))
    if (seen.has(st.item.exerciseId)) return
    seen.add(st.item.exerciseId)
    const ex = getExercise(st.item.exerciseId)
    if (ex) out.push(...ex.copy.cues, ...howToSteps(ex))
  })
  return out
}
