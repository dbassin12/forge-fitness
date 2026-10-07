import { describe, expect, it } from 'vitest'
import { MASCOT_GEAR, mascotMood } from '@/ui/Mascot'

describe('Ember the mascot', () => {
  it('picks a mood from the day', () => {
    expect(mascotMood({ hour: 9, workoutDone: false, perfect: true, anyProgress: true })).toBe('cheer')
    expect(mascotMood({ hour: 9, workoutDone: true, perfect: false, anyProgress: true })).toBe('fired')
    expect(mascotMood({ hour: 23, workoutDone: false, perfect: false, anyProgress: false })).toBe('sleepy')
    expect(mascotMood({ hour: 14, workoutDone: false, perfect: false, anyProgress: true })).toBe('happy')
    expect(mascotMood({ hour: 14, workoutDone: false, perfect: false, anyProgress: false })).toBe('calm')
  })

  it('unlocks gear in level order', () => {
    const levels = MASCOT_GEAR.map((g) => g.level)
    expect(levels).toEqual([...levels].sort((a, b) => a - b))
    expect(new Set(MASCOT_GEAR.map((g) => g.id)).size).toBe(MASCOT_GEAR.length)
  })
})
