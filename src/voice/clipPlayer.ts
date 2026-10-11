import { context } from './beeps'
import { clipId, sentencesOf, voiceKey } from './voiceKey'

/** A pack's recordings: clip id → length in ms. */
type Clips = Record<string, number>

interface Segment {
  id: string
  /** Pause after this piece: a breath between sentences, a beat after a comma, none inside a phrase. */
  gapMs: number
}

const FETCH_CONCURRENCY = 6
const MAX_BYTES = 900
/** Decoded audio is big (resampled to the device rate), so only short, often-repeated clips stay. */
const MAX_DECODED = 48
const KEEP_DECODED_SEC = 1.6

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, sleep(ms).then(() => undefined)])
}

function gapAfter(sentence: string): number {
  const end = sentence.trim().slice(-1)
  if (end === '.' || end === '!' || end === '?') return 220
  if (end === ',' || end === ':' || end === ';') return 90
  return 0
}

/**
 * Plays the natural voice: each sentence of a line is a small recorded MP3 under /voice/<pack>/.
 * Recordings are fetched ahead of time (the service worker keeps them for offline use), decoded
 * just before they play, and scheduled back to back on the shared Web Audio context.
 */
class ClipPlayer {
  private manifests = new Map<string, Promise<Clips | null>>()
  private loaded = new Map<string, Clips>()
  private bytes = new Map<string, Promise<ArrayBuffer | null>>()
  private decoded = new Map<string, AudioBuffer>()
  private playing: { sources: AudioBufferSourceNode[]; finish: () => void }[] = []

  private url(pack: string, id: string) {
    return `/voice/${pack}/${id}.mp3`
  }

  /** Load a pack's list of recordings (once). */
  manifest(pack: string): Promise<Clips | null> {
    let p = this.manifests.get(pack)
    if (!p) {
      p = fetch(`/voice/${pack}/manifest.json`)
        .then((r) => (r.ok ? (r.json() as Promise<{ clips: Clips }>) : null))
        .then((m) => {
          if (m?.clips) this.loaded.set(pack, m.clips)
          return m?.clips ?? null
        })
        .catch(() => null)
        .then((clips) => {
          // Try again next time if it failed (offline before it was ever cached).
          if (!clips) this.manifests.delete(pack)
          return clips
        })
      this.manifests.set(pack, p)
    }
    return p
  }

  /** The recordings for a line, or null if any sentence isn't recorded. */
  plan(clips: Clips, text: string): Segment[] | null {
    const out: Segment[] = []
    for (const s of sentencesOf(text)) {
      const id = clipId(s)
      if (id in clips) {
        out.push({ id, gapMs: gapAfter(s) })
        continue
      }
      // "73 seconds", "12 push-ups": a count, then the phrase.
      const m = voiceKey(s).match(/^(\d+) (.+)$/)
      const count = m && clipId(m[1])
      const rest = m && clipId(m[2])
      if (!count || !rest || !(count in clips) || !(rest in clips)) return null
      out.push({ id: count, gapMs: 40 }, { id: rest, gapMs: gapAfter(s) })
    }
    return out.length ? out : null
  }

  /** Can this pack say the whole line? (False until the pack's list has loaded.) */
  covers(pack: string, text: string): boolean {
    const clips = this.loaded.get(pack)
    return !!clips && !!this.plan(clips, text)
  }

  private fetchBytes(pack: string, id: string): Promise<ArrayBuffer | null> {
    const url = this.url(pack, id)
    let p = this.bytes.get(url)
    if (!p) {
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .catch(() => null)
        .then((b) => {
          if (!b) this.bytes.delete(url)
          return b
        })
      this.bytes.set(url, p)
      // Keep memory bounded: forget the oldest downloads (the service worker still has them).
      if (this.bytes.size > MAX_BYTES) this.bytes.delete(this.bytes.keys().next().value!)
    }
    return p
  }

  private async buffer(pack: string, id: string): Promise<AudioBuffer | null> {
    const key = `${pack}/${id}`
    const hit = this.decoded.get(key)
    if (hit) {
      this.decoded.delete(key)
      this.decoded.set(key, hit)
      return hit
    }
    const ctx = context()
    const raw = await this.fetchBytes(pack, id)
    if (!ctx || !raw) return null
    try {
      const buf = await ctx.decodeAudioData(raw.slice(0))
      if (buf.duration <= KEEP_DECODED_SEC) {
        this.decoded.set(key, buf)
        if (this.decoded.size > MAX_DECODED) this.decoded.delete(this.decoded.keys().next().value!)
      }
      return buf
    } catch {
      return null
    }
  }

  /** Download the recordings for these lines now, so they play instantly later. */
  async prefetch(pack: string, lines: string[]): Promise<void> {
    const clips = await this.manifest(pack)
    if (!clips) return
    const ids = [...new Set(lines.flatMap((l) => this.plan(clips, l)?.map((s) => s.id) ?? []))]
    let next = 0
    const worker = async () => {
      while (next < ids.length) await this.fetchBytes(pack, ids[next++])
    }
    await Promise.all(Array.from({ length: Math.min(FETCH_CONCURRENCY, ids.length) }, worker))
  }

  /**
   * Say a line with the pack. Resolves true once it has been said (or was cancelled meanwhile),
   * false if it can't be (not recorded, not downloaded in time, audio unavailable) so the caller
   * can use the phone's voice instead.
   */
  async play(pack: string, text: string, volume: number, current: () => boolean): Promise<boolean> {
    const clips = this.loaded.get(pack) ?? (await withTimeout(this.manifest(pack), 1500))
    const segs = clips ? this.plan(clips, text) : null
    const ctx = context()
    if (!segs || !ctx) return false
    if (ctx.state !== 'running') {
      await withTimeout(ctx.resume().catch(() => undefined), 400)
      if ((ctx.state as AudioContextState) !== 'running') return false
    }
    const buffers = await withTimeout(Promise.all(segs.map((s) => this.buffer(pack, s.id))), 2500)
    if (!buffers || buffers.some((b) => !b)) return false
    if (!current()) return true
    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.connect(ctx.destination)
    let at = ctx.currentTime + 0.02
    const sources = buffers.map((b, i) => {
      const src = ctx.createBufferSource()
      src.buffer = b
      src.connect(gain)
      src.start(at)
      at += b!.duration + segs[i].gapMs / 1000
      return src
    })
    const total = at - ctx.currentTime
    await new Promise<void>((resolve) => {
      let done = false
      const entry = {
        sources,
        finish: () => {
          if (done) return
          done = true
          clearTimeout(watchdog)
          this.playing = this.playing.filter((p) => p !== entry)
          resolve()
        },
      }
      // The last piece's natural end, plus its pause; a watchdog in case the context stalls.
      sources[sources.length - 1].onended = () => setTimeout(entry.finish, segs[segs.length - 1].gapMs)
      const watchdog = setTimeout(entry.finish, total * 1000 + 1500)
      this.playing.push(entry)
    })
    gain.disconnect()
    return true
  }

  /** Stop whatever is being said. */
  stop(): void {
    for (const p of this.playing.splice(0)) {
      for (const s of p.sources) {
        try {
          s.onended = null
          s.stop()
        } catch {
          /* not started yet or already stopped */
        }
      }
      p.finish()
    }
  }
}

export const clips = new ClipPlayer()
