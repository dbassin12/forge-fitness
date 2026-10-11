import { afterEach, describe, expect, it, vi } from 'vitest'
import { clips } from '@/voice/clipPlayer'
import { VOICE_PACKS } from '@/voice/packs'
import { useVoiceSettings } from '@/voice/settings'
import { speech } from '@/voice/speech'
import { clipId, sentencesOf, voiceKey } from '@/voice/voiceKey'

describe('voice keys', () => {
  it('split lines into sentences the way the recordings were made', () => {
    expect(sentencesOf('Rest for 45 seconds. Then set 2 of 3.')).toEqual(['Rest for 45 seconds.', 'Then set 2 of 3.'])
    expect(sentencesOf("Let’s go! Ten push-ups. Keep your body in one straight line.")).toHaveLength(3)
    expect(sentencesOf('7')).toEqual(['7'])
    expect(sentencesOf('Common mistake: Your knees cave inward.')).toEqual(['Common mistake: Your knees cave inward.'])
  })

  it('ignore case, quotes, spacing and closing punctuation', () => {
    expect(voiceKey('Go!')).toBe('go')
    expect(voiceKey('  Go.  ')).toBe('go')
    expect(voiceKey('Let’s  go!')).toBe("let's go")
    expect(clipId('Up next: Goblet squat.')).toBe(clipId('up next: goblet squat'))
    expect(clipId('Up next: Goblet squat.')).not.toBe(clipId('First up: Goblet squat.'))
    expect(clipId('Go!')).toMatch(/^[0-9a-z]+$/)
  })
})

describe('clip plans', () => {
  const manifest = Object.fromEntries(['Rest for 45 seconds.', 'Then set 2 of 3.', '73', 'seconds', '12', 'push-ups', 'Wall sit.'].map((s) => [clipId(s), 900]))

  it('play every sentence of a line, with a breath between sentences', () => {
    const plan = clips.plan(manifest, 'Rest for 45 seconds. Then set 2 of 3.')
    expect(plan?.map((s) => s.id)).toEqual([clipId('Rest for 45 seconds.'), clipId('Then set 2 of 3.')])
    expect(plan?.[0].gapMs).toBeGreaterThan(100)
  })

  it('say a count and a known phrase back to back', () => {
    expect(clips.plan(manifest, '73 seconds.')?.map((s) => s.id)).toEqual([clipId('73'), clipId('seconds')])
    expect(clips.plan(manifest, '12 push-ups.')?.[0].gapMs).toBeLessThan(100)
    expect(clips.plan(manifest, 'Wall sit. 73 seconds.')).toHaveLength(3)
  })

  it('give up on a line with anything unrecorded, so it is said in one voice', () => {
    expect(clips.plan(manifest, 'Rest for 45 seconds. Something new.')).toBeNull()
    expect(clips.plan(manifest, '74 seconds.')).toBeNull()
    expect(clips.plan({}, 'Go!')).toBeNull()
  })
})

describe('speech engine with the natural voice', () => {
  afterEach(() => {
    speech.cancel()
    useVoiceSettings.getState().update({ enabled: true, pack: VOICE_PACKS[0].id })
  })

  it('uses Forge’s natural voice by default', () => {
    expect(VOICE_PACKS.length).toBeGreaterThan(0)
    expect(useVoiceSettings.getState().pack).toBe(VOICE_PACKS[0].id)
  })

  it('says a recorded line with the pack, without waiting for the phone voice', async () => {
    const play = vi.spyOn(clips, 'play').mockResolvedValue(true)
    const t0 = Date.now()
    await speech.speak('Go!')
    expect(play).toHaveBeenCalledWith(VOICE_PACKS[0].id, 'Go!', 1, expect.any(Function))
    expect(Date.now() - t0).toBeLessThan(300)
  })

  it('falls back to the phone voice (here: its timing) when a line can’t be played', async () => {
    vi.useFakeTimers()
    try {
      vi.spyOn(clips, 'play').mockResolvedValue(false)
      let done = false
      void speech.speak('Something the voice pack never recorded.').then(() => (done = true))
      await vi.advanceTimersByTimeAsync(300)
      expect(done).toBe(false)
      await vi.advanceTimersByTimeAsync(5000)
      expect(done).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('skips the pack for the phone voice, a per-line override, or when muted', async () => {
    vi.useFakeTimers()
    try {
      const play = vi.spyOn(clips, 'play').mockResolvedValue(true)
      useVoiceSettings.getState().update({ pack: null })
      const a = speech.speak('Go!')
      await vi.advanceTimersByTimeAsync(2000)
      await a
      useVoiceSettings.getState().update({ pack: VOICE_PACKS[0].id })
      const b = speech.speak('Go!', { pack: null })
      await vi.advanceTimersByTimeAsync(2000)
      await b
      useVoiceSettings.getState().update({ enabled: false })
      const c = speech.speak('Go!')
      await vi.advanceTimersByTimeAsync(2000)
      await c
      expect(play).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
