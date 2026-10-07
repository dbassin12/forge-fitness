import { describe, expect, it } from 'vitest'
import { localISODate, personalize, type SwContext } from '@/sw-bridge'

const ctx: SwContext = {
  date: localISODate(),
  nextWorkout: { title: 'Full Body A', minutes: 15, exercises: ['Squat', 'Push-up', 'Row', 'Plank'] },
  workoutDone: false,
  waterMl: 500,
  waterTargetMl: 2700,
  imperial: true,
  mealsLogged: [],
  streakWeeks: 3,
  thisWeek: 1,
  weekTarget: 3,
}

describe('notification text', () => {
  it('keeps the plain wording without a coach style', () => {
    expect(personalize('workout', ctx)).toEqual({ title: '💪 Full Body A · 15 min', body: 'Squat, Push-up, Row…' })
  })

  it('speaks in the chosen coach voice for workouts and streaks', () => {
    expect(personalize('workout', { ...ctx, coach: 'drill' })?.title).toBe('🪖 Full Body A · 15 min')
    expect(personalize('workout', { ...ctx, coach: 'drill' })?.body).toContain('Move it')
    expect(personalize('streak', { ...ctx, coach: 'hype' })?.title).toBe('🔥 3-week streak on the line!')
    expect(personalize('streak', { ...ctx, coach: 'zen', streakWeeks: 0 })?.title).toBe('🧘 A moment for you')
  })

  it('still says the workout is done regardless of style', () => {
    expect(personalize('streak', { ...ctx, coach: 'drill', workoutDone: true })?.title).toBe('🔥 Streak safe')
  })
})
