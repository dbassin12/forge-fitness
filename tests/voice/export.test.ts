import { writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { voiceSentences } from '@/voice/catalog'
import { VOICE_PACKS } from '@/voice/packs'

// `npm run voice:lines` writes the sentences to record for scripts/voice/record.py.
describe.skipIf(!process.env.VOICE_LINES)('export voice lines', () => {
  it('writes the catalog', () => {
    const sentences = voiceSentences()
    writeFileSync(process.env.VOICE_LINES!, JSON.stringify({ packs: VOICE_PACKS, sentences }, null, 1))
    console.log(`${sentences.length} sentences → ${process.env.VOICE_LINES}`)
  })
})
