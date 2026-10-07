import { describe, expect, it, vi } from 'vitest'

// Run the app's modules as Bloom: everything reads the flavor from '@/app/brand' at import time.
vi.mock('@/app/brand', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/app/brand')>()
  const APP = real.BRANDS.bloom
  return { ...real, APP, isBloom: true, W: APP.words, storageKey: (name: string) => `${APP.storagePrefix}.${name}`, asset: (p: string) => `${APP.base}${p.replace(/^\//, '')}` }
})

const { ACHIEVEMENTS, BLOOM_ACHIEVEMENTS, levelTitle } = await import('@/engines/gamification')
const { BLOOM_TIPS, TIPS } = await import('@/data/tips')
const { EXERCISES, getExercise } = await import('@/data/exercises')
const { describeTarget, makeTarget, repWord } = await import('@/engines/plan')
const { coachPrompt, mealPrompt } = await import('@/features/claude/handoff')
const { COACH_STYLES } = await import('@/app/prefs')

describe('Bloom mode', () => {
  it('uses Bloom’s badges, levels, tips and voice guides', () => {
    expect(ACHIEVEMENTS).toBe(BLOOM_ACHIEVEMENTS)
    expect(levelTitle(1)).toBe('Seed')
    expect(levelTitle(30)).toBe('Garden')
    expect(TIPS).toBe(BLOOM_TIPS)
    expect(COACH_STYLES.map((c) => c.id)).toEqual(['zen', 'calm', 'sunny'])
  })

  it('offers only yoga poses and gentle shared stretches', () => {
    expect(EXERCISES.length).toBeGreaterThan(40)
    for (const e of EXERCISES) expect(e.apps ?? ['forge'], e.id).toContain('bloom')
    expect(EXERCISES.some((e) => e.id === 'pushup')).toBe(false)
    expect(EXERCISES.some((e) => e.id === 'tree-pose')).toBe(true)
  })

  it('counts flows in rounds and other moves in times', () => {
    expect(repWord('sun-salutation', 3)).toBe('rounds')
    expect(repWord('sun-salutation', 1)).toBe('round')
    expect(repWord('locust-pose', 4)).toBe('times')
    const ex = getExercise('half-sun-salutation')!
    expect(describeTarget({ exerciseId: ex.id, target: makeTarget(ex, 3), perSide: false, workSec: 60, notes: [] })).toBe('3 rounds')
  })

  it('asks Claude as a gentle yoga guide, with Bloom’s data', () => {
    const p = coachPrompt('Program: gentle yoga.', 'Something for my back?')
    expect(p).toContain('gentle yoga and wellbeing guide')
    expect(p).toContain('<bloom_data>\nProgram: gentle yoga.\n</bloom_data>')
    expect(p).not.toContain('Forge')
    expect(mealPrompt('a bowl of soup', false)).toContain('my food log (Bloom)')
  })
})
