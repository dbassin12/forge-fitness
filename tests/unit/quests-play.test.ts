import { describe, expect, it } from 'vitest'
import { getExercise } from '@/data/exercises'
import { DEFAULT_EQUIPMENT, type Equipment } from '@/domain/types'
import { isAllowed, planContext, type PlanInputs } from '@/engines/plan'
import {
  buildDeck,
  cardReps,
  CHALLENGES,
  challengeXp,
  deckPlan,
  deckTotals,
  recordResult,
  SUITS,
  wheelSlices,
  wheelXp,
} from '@/engines/play'
import { PERFECT_DAY_XP, pickQuests, QUESTS, questProgress, type QuestFacts } from '@/engines/quests'
import { initialProgress } from '@/engines/progression/progress'

const facts: QuestFacts = {
  trainingDay: true,
  planDone: false,
  snacks: 0,
  plays: 0,
  activeMinutes: 0,
  protein: 0,
  proteinTarget: 145,
  waterMl: 0,
  waterTargetMl: 2700,
  imperial: true,
  mealsLogged: 0,
  breakfastLogged: false,
  produce: 0,
  tutorials: 0,
  weighedIn: false,
  lite: false,
  weekday: 3,
  daysSinceWeighIn: null,
}

const inputs: PlanInputs = {
  goal: 'general_fitness',
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 15,
  aches: [],
  equipment: DEFAULT_EQUIPMENT,
  quietMode: false,
  bodyWeightKg: 80,
}
const NO_GEAR: Equipment = { dumbbells: [], chair: false, wall: false, table: false, stairs: false, pullupBar: false, mat: false }

describe('daily quests', () => {
  it('pick one move, one eat and one bonus quest, all different and stable per date', () => {
    for (let d = 1; d <= 28; d++) {
      const date = `2026-10-${String(d).padStart(2, '0')}`
      const ids = pickQuests(date, { ...facts, trainingDay: d % 2 === 0 })
      expect(ids).toHaveLength(3)
      expect(new Set(ids).size).toBe(3)
      expect(QUESTS[ids[0]].kind).toBe('move')
      expect(QUESTS[ids[1]].kind).toBe('eat')
      expect(pickQuests(date, { ...facts, trainingDay: d % 2 === 0 })).toEqual(ids)
    }
  })

  it('makes the workout the move quest on training days', () => {
    expect(pickQuests('2026-10-07', facts)[0]).toBe('workout')
    expect(pickQuests('2026-10-07', { ...facts, trainingDay: false })[0]).not.toBe('workout')
  })

  it('asks for a weigh-in on Saturdays and after a week without one', () => {
    expect(pickQuests('2026-10-10', { ...facts, weekday: 6 })[2]).toBe('weighin')
    expect(pickQuests('2026-10-08', { ...facts, weekday: 4, daysSinceWeighIn: 9 })[2]).toBe('weighin')
  })

  it('never offers breakfast logging in lite mode', () => {
    for (let d = 1; d <= 28; d++) expect(pickQuests(`2026-11-${String(d).padStart(2, '0')}`, { ...facts, lite: true })).not.toContain('breakfast')
  })

  it('tracks progress and completion', () => {
    expect(questProgress('protein', { ...facts, protein: 80 })).toMatchObject({ value: 80, target: 145, done: false })
    expect(questProgress('protein', { ...facts, protein: 150 }).done).toBe(true)
    expect(questProgress('water', { ...facts, waterMl: 2700 }).done).toBe(true)
    expect(questProgress('water', { ...facts, imperial: false, waterMl: 1350 })).toMatchObject({ value: 1.35, target: 2.7, done: false })
    expect(questProgress('workout', { ...facts, planDone: true }).done).toBe(true)
    expect(questProgress('move20', { ...facts, activeMinutes: 25 })).toMatchObject({ value: 20, done: true })
    expect(PERFECT_DAY_XP).toBeGreaterThan(0)
  })
})

describe('play: deck of cards', () => {
  const progress = initialProgress(inputs)
  const ctx = planContext(inputs)

  it('maps every suit to an allowed exercise', () => {
    for (const gear of [DEFAULT_EQUIPMENT, NO_GEAR]) {
      const c = planContext({ ...inputs, equipment: gear })
      const plan = deckPlan(progress, c)
      for (const s of SUITS) expect(isAllowed(plan.suits[s], c)).toBe(true)
    }
  })

  it('swaps jumping for quiet cardio with sore knees or quiet mode', () => {
    expect(deckPlan(progress, planContext({ ...inputs, quietMode: true })).suits.clubs.impact).not.toBe('high')
    expect(deckPlan(progress, planContext({ ...inputs, aches: ['knees'] })).suits.clubs.id).not.toBe('jumping-jacks')
  })

  it('shuffles a fair deck of the chosen size', () => {
    const full = buildDeck(52, 1)
    expect(new Set(full.map((c) => `${c.suit}${c.rank}`)).size).toBe(52)
    expect(buildDeck(13, 'x')).toHaveLength(13)
    expect(buildDeck(26, 5)).toEqual(buildDeck(26, 5))
  })

  it('scores cards: faces 10, aces 11, easy halves, cardio doubles', () => {
    const plan = deckPlan(progress, ctx)
    expect(cardReps({ suit: 'spades', rank: 7 }, 'normal', plan.suits.spades)).toBe(7)
    expect(cardReps({ suit: 'spades', rank: 12 }, 'normal', plan.suits.spades)).toBe(10)
    expect(cardReps({ suit: 'spades', rank: 1 }, 'normal', plan.suits.spades)).toBe(11)
    expect(cardReps({ suit: 'spades', rank: 7 }, 'easy', plan.suits.spades)).toBe(4)
    expect(cardReps({ suit: 'clubs', rank: 5 }, 'normal', plan.suits.clubs)).toBe(10)
    const totals = deckTotals(buildDeck(52, 3), plan, 'normal')
    expect(Object.values(totals.reps).reduce((a, b) => a + b, 0)).toBeGreaterThan(300)
  })
})

describe('play: wheel and challenges', () => {
  const progress = initialProgress(inputs)

  it('builds eight allowed, distinct slices for any setup', () => {
    for (const setup of [inputs, { ...inputs, equipment: NO_GEAR }, { ...inputs, aches: ['knees', 'wrists'] as PlanInputs['aches'], quietMode: true }]) {
      const ctx = planContext(setup)
      const slices = wheelSlices(progress, ctx, '2026-10-07')
      expect(slices.length).toBeGreaterThanOrEqual(6)
      expect(new Set(slices.map((s) => s.exerciseId)).size).toBe(slices.length)
      for (const s of slices) {
        const ex = getExercise(s.exerciseId)!
        expect(isAllowed(ex, ctx)).toBe(true)
        expect(s.amount).toBeGreaterThan(0)
      }
    }
  })

  it('rewards combos', () => {
    expect(wheelXp(1)).toBe(10)
    expect(wheelXp(2)).toBe(25)
    expect(wheelXp(3)).toBeGreaterThan(wheelXp(2) + 10)
  })

  it('records personal bests per exercise', () => {
    let r = recordResult(undefined, { date: '2026-10-07', value: 40, exerciseId: 'forearm-plank' })
    expect(r.isBest).toBe(true)
    r = recordResult(r.record, { date: '2026-10-08', value: 35, exerciseId: 'forearm-plank' })
    expect(r.isBest).toBe(false)
    expect(r.previous).toBe(40)
    r = recordResult(r.record, { date: '2026-10-09', value: 20, exerciseId: 'knee-plank' })
    expect(r.isBest).toBe(true)
    expect(r.record.best).toEqual({ 'forearm-plank': 40, 'knee-plank': 20 })
    expect(r.record.history).toHaveLength(3)
  })

  it('has an exercise for every challenge and pays more for records', () => {
    const ctx = planContext(inputs)
    for (const c of CHALLENGES) {
      expect(c.exercise(progress, ctx)).toBeDefined()
      expect(challengeXp(c, 30, true)).toBeGreaterThan(challengeXp(c, 30, false))
    }
  })
})
