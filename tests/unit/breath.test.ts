import { describe, expect, it } from 'vitest'
import { BREATHS, breathAt, breathXp, cyclesFor, cycleSec, getBreath, RELAXATIONS } from '@/engines/breath'

describe('breathing patterns', () => {
  it('walk through in, hold and out with the orb following', () => {
    const box = getBreath('box')!
    expect(cycleSec(box)).toBe(16)
    expect(breathAt(box, 2, 0).phase.kind).toBe('in')
    expect(breathAt(box, 2, 0).fill).toBe(0)
    expect(breathAt(box, 2, 3.99).fill).toBeGreaterThan(0.99)
    expect(breathAt(box, 2, 5).phase.kind).toBe('holdIn')
    expect(breathAt(box, 2, 5).fill).toBe(1)
    const out = breathAt(box, 2, 10)
    expect(out.phase.kind).toBe('out')
    expect(out.fill).toBeCloseTo(0.5, 5)
    expect(breathAt(box, 2, 13).phase.kind).toBe('holdOut')
    expect(breathAt(box, 2, 17).cycle).toBe(1)
    expect(breathAt(box, 2, 32).done).toBe(true)
  })

  it('fit whole breaths into the chosen minutes', () => {
    for (const b of BREATHS)
      for (const m of b.minutes) {
        const n = cyclesFor(b, m)
        expect(n).toBeGreaterThanOrEqual(1)
        expect(Math.abs(n * cycleSec(b) - m * 60)).toBeLessThanOrEqual(cycleSec(b))
      }
    for (const b of BREATHS) expect(b.minutes).toContain(b.defaultMinutes)
  })

  it('speak in plain words', () => {
    for (const b of BREATHS) expect(b.intro).not.toMatch(/\d/)
    for (const r of RELAXATIONS) for (const l of r.lines) expect(l.text).not.toMatch(/\d/)
  })
})

describe('guided relaxations', () => {
  it('have lines in order that end inside the session', () => {
    for (const r of RELAXATIONS) {
      const times = r.lines.map((l) => l.at)
      expect(times).toEqual([...times].sort((a, b) => a - b))
      expect(times[times.length - 1]).toBeLessThan(r.minutes * 60)
      // Leave room to speak each line before the next one starts.
      for (let i = 1; i < r.lines.length; i++) expect(times[i] - times[i - 1], `${r.id} line ${i}`).toBeGreaterThanOrEqual(r.lines[i - 1].text.split(' ').length * 0.45)
    }
  })

  it('earn a little XP for showing up', () => {
    expect(breathXp(1)).toBe(12)
    expect(breathXp(5)).toBeGreaterThan(breathXp(1))
  })
})
