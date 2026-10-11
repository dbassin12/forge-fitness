/**
 * The natural voice is a set of recorded sentences. Anything the app says is split into sentences
 * the same way the recordings were made, and each sentence is looked up by a normalized key.
 */

/** Sentence-sized pieces: "Rest for 45 seconds. Then set 2 of 3." → two sentences. */
export function sentencesOf(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]).map((s) => s.trim()).filter(Boolean)
}

/** Case, quotes, spacing and the closing punctuation don't change which recording fits. */
export function voiceKey(sentence: string): string {
  return sentence
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s.!?,;:…]+$/u, '')
}

/** cyrb53: a small, fast 53-bit string hash. */
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** File name (without extension) of the recording for a sentence. */
export function clipId(sentence: string): string {
  return cyrb53(voiceKey(sentence)).toString(36)
}
