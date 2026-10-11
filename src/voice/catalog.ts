import { COACH_STYLES } from '@/app/prefs'
import { EXERCISES } from '@/data/exercises'
import { pluralName } from '@/engines/play'
import { howToSteps, openingLine } from '@/features/player/howto'
import { COACH_LINES } from './coachLines'
import { tutorialScript } from './narration'
import { VOICE_PREVIEW } from './packs'
import { clipId, sentencesOf, voiceKey } from './voiceKey'

const range = (from: number, to: number, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step)

/**
 * Everything Forge's coach can say, as lines of text: the workout player (announcements, targets,
 * counting, how-tos, cues, coach personalities), tutorials, the games and the fitness test. The
 * natural voices record each sentence once; tests check the player never says anything else.
 */
export function voiceLines(): string[] {
  const out: string[] = []
  const add = (...lines: string[]) => out.push(...lines)

  // The player's own words.
  add('Get ready.', 'Go!', 'Switch sides.', 'Round done.', 'Nice work.', 'Grab your dumbbells.', 'Resume.')
  add(...range(5, 300, 5).map((s) => `Rest for ${s} seconds.`))
  for (const n of range(2, 8)) add(...range(1, n).map((r) => `Then set ${r} of ${n}.`))
  // Targets, the way the player describes them. Rarer numbers are a count plus "reps" or "seconds".
  for (const r of range(1, 40)) {
    const reps = `${r} ${r === 1 ? 'rep' : 'reps'}`
    add(`${reps}.`, `${reps} each side.`)
  }
  add(...[...range(1, 120), ...range(125, 300, 5)].map((s) => `${s} seconds.`))
  add(...range(5, 300, 5).map((s) => `${s} seconds each side.`))
  add('reps', 'reps each side', 'seconds', 'seconds each side', 'seconds left')
  // Counting reps (and the fitness test's tap counter).
  add(...range(1, 100).map(String))

  for (const ex of EXERCISES) {
    add(openingLine(ex, true), openingLine(ex, false), `${ex.name}.`)
    add(...howToSteps(ex), ex.copy.breathing, ...ex.copy.cues)
    add(...tutorialScript(ex).map((s) => s.text))
    // Games: "12 push-ups." is a count, then the move.
    add(pluralName(ex.name, 2), ...(ex.perSide ? [`${pluralName(ex.name, 2)} each side`] : []), pluralName(ex.name, 1))
  }

  // Coach personalities this app offers.
  for (const c of COACH_STYLES) {
    add(c.sample)
    for (const lines of Object.values(COACH_LINES[c.id])) add(...lines)
  }

  // Settings preview, record challenges and the fitness test.
  add(VOICE_PREVIEW, 'Thirty seconds!', 'Time!', 'Stop!', 'Well done.')
  add(...range(1, 10).map((m) => `${m} minute${m === 1 ? '' : 's'}!`))
  add(...[10, 30].map((s) => `${s} seconds left`))
  return out
}

export interface VoiceSentence {
  id: string
  key: string
  /** The text to record (first spelling seen, with closing punctuation). */
  text: string
}

/** The catalog as unique sentences, ready to record. */
export function voiceSentences(lines: string[] = voiceLines()): VoiceSentence[] {
  const byKey = new Map<string, VoiceSentence>()
  for (const line of lines) {
    for (const s of sentencesOf(line)) {
      const key = voiceKey(s)
      if (!key || byKey.has(key)) continue
      byKey.set(key, { id: clipId(s), key, text: /[.!?]$/.test(s) ? s : `${s}.` })
    }
  }
  return [...byKey.values()]
}
