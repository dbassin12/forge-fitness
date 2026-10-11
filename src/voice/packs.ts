import { isBloom } from '@/app/brand'

/**
 * Natural voices: every sentence the coach says, recorded ahead of time with Kokoro (an open
 * neural text-to-speech model, Apache-2.0) and shipped as small audio files in /voice/<id>/.
 * `npm run voice` records whatever is new after the coaching copy changes. Re-recording a sentence
 * keeps its file name (the service worker would keep serving the old take), so a different
 * recording of the same voice needs a new pack id.
 */
export interface VoicePack {
  id: string
  /** Shown in the voice picker. */
  name: string
  blurb: string
  /** Kokoro voice used to record it. */
  kokoro: string
}

/**
 * Forge's natural voices; the first is the default. To add one, list it here (any Kokoro voice) and
 * run `npm run voice`. (Bloom's lines aren't recorded, so it keeps the phone's voices.)
 */
export const VOICE_PACKS: VoicePack[] = isBloom ? [] : [{ id: 'heart', name: 'Heart', blurb: 'Warm and clear (female)', kokoro: 'af_heart' }]

/** What the voice settings preview says (recorded in every pack). */
export const VOICE_PREVIEW = 'Let’s go! Ten push-ups. Keep your body in one straight line.'

export function voicePack(id: string | undefined): VoicePack | undefined {
  return VOICE_PACKS.find((p) => p.id === id)
}
