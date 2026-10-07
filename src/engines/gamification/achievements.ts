/** Lifetime numbers the achievements look at (anything unknown is 0). */
export interface Stats {
  workouts: number
  snacks: number
  minutes: number
  pushupReps: number
  squatReps: number
  bestPlankSec: number
  prs: number
  levelUps: number
  reachedPushup: boolean
  weeklyStreak: number
  dailyStreak: number
  earlyBird: boolean
  nightOwl: boolean
  tests: number
  foodLogs: number
  proteinDays: number
  waterDays: number
  weighIns: number
  photos: number
  /** Daily quests completed (all time). */
  quests: number
  /** Days with all three quests done. */
  perfectDays: number
  /** Play-tab games finished. */
  plays: number
  /** Full 52-card decks finished. */
  fullDecks: number
}

export const EMPTY_STATS: Stats = {
  workouts: 0,
  snacks: 0,
  minutes: 0,
  pushupReps: 0,
  squatReps: 0,
  bestPlankSec: 0,
  prs: 0,
  levelUps: 0,
  reachedPushup: false,
  weeklyStreak: 0,
  dailyStreak: 0,
  earlyBird: false,
  nightOwl: false,
  tests: 0,
  foodLogs: 0,
  proteinDays: 0,
  waterDays: 0,
  weighIns: 0,
  photos: 0,
  quests: 0,
  perfectDays: 0,
  plays: 0,
  fullDecks: 0,
}

export type AchievementTier = 'bronze' | 'silver' | 'gold'

export interface Achievement {
  id: string
  title: string
  description: string
  /** Emoji badge (rendered large on the trophy shelf). */
  badge: string
  tier: AchievementTier
  check: (s: Stats) => boolean
}

const a = (id: string, title: string, description: string, badge: string, tier: AchievementTier, check: (s: Stats) => boolean): Achievement => ({
  id,
  title,
  description,
  badge,
  tier,
  check,
})

export const ACHIEVEMENTS: Achievement[] = [
  a('first-rep', 'First Rep', 'Finish your first workout', '🔥', 'bronze', (s) => s.workouts >= 1),
  a('three-done', 'Getting Going', 'Finish 3 workouts', '👟', 'bronze', (s) => s.workouts >= 3),
  a('ten-done', 'Habit Forming', 'Finish 10 workouts', '🧱', 'bronze', (s) => s.workouts >= 10),
  a('twentyfive-done', 'Committed', 'Finish 25 workouts', '⚙️', 'silver', (s) => s.workouts >= 25),
  a('fifty-done', 'Forged', 'Finish 50 workouts', '🛡️', 'silver', (s) => s.workouts >= 50),
  a('hundred-done', 'Centurion', 'Finish 100 workouts', '🏛️', 'gold', (s) => s.workouts >= 100),
  a('snack-1', 'Snack Attack', 'Do your first movement snack', '🍿', 'bronze', (s) => s.snacks >= 1),
  a('snack-10', 'Desk Escape Artist', 'Do 10 movement snacks', '🪑', 'silver', (s) => s.snacks >= 10),
  a('pushups-100', '100 Push-ups', 'Do 100 push-ups in total (any variation)', '💪', 'bronze', (s) => s.pushupReps >= 100),
  a('pushups-1000', '1,000 Push-ups', 'Do 1,000 push-ups in total', '🦾', 'gold', (s) => s.pushupReps >= 1000),
  a('squats-500', '500 Squats', 'Do 500 squats and lunges in total', '🦵', 'silver', (s) => s.squatReps >= 500),
  a('plank-60', 'Iron Core', 'Hold a plank for 60 seconds', '🧲', 'silver', (s) => s.bestPlankSec >= 60),
  a('plank-120', 'Plank Pro', 'Hold a plank for 2 minutes', '🗿', 'gold', (s) => s.bestPlankSec >= 120),
  a('minutes-60', 'First Hour', 'Train for 60 minutes in total', '⏱️', 'bronze', (s) => s.minutes >= 60),
  a('minutes-600', 'Ten Hours Strong', 'Train for 10 hours in total', '⌛', 'gold', (s) => s.minutes >= 600),
  a('pr-1', 'Personal Best', 'Set your first personal record', '⭐', 'bronze', (s) => s.prs >= 1),
  a('pr-10', 'Record Breaker', 'Set 10 personal records', '🌟', 'silver', (s) => s.prs >= 10),
  a('level-up', 'Level Up', 'Move up to a harder exercise', '📈', 'bronze', (s) => s.levelUps >= 1),
  a('level-up-10', 'Climber', 'Level up 10 times', '🧗', 'gold', (s) => s.levelUps >= 10),
  a('real-pushup', 'The Real Deal', 'Graduate to full push-ups', '🏅', 'silver', (s) => s.reachedPushup),
  a('streak-2', 'Two in a Row', 'Hit your weekly goal 2 weeks running', '📅', 'bronze', (s) => s.weeklyStreak >= 2),
  a('streak-4', 'Month Strong', 'Hit your weekly goal 4 weeks running', '🗓️', 'silver', (s) => s.weeklyStreak >= 4),
  a('streak-12', 'Quarter Beast', 'Hit your weekly goal 12 weeks running', '🏆', 'gold', (s) => s.weeklyStreak >= 12),
  a('daily-7', 'Seven Days', 'Be active 7 days in a row', '✨', 'silver', (s) => s.dailyStreak >= 7),
  a('early-bird', 'Early Bird', 'Finish a workout before 7 am', '🌅', 'bronze', (s) => s.earlyBird),
  a('night-owl', 'Night Owl', 'Finish a workout after 9 pm', '🦉', 'bronze', (s) => s.nightOwl),
  a('retest', 'Progress Check', 'Retake the fitness test', '📊', 'silver', (s) => s.tests >= 2),
  a('food-1', 'First Bite', 'Log your first food', '🥑', 'bronze', (s) => s.foodLogs >= 1),
  a('food-100', 'Food Detective', 'Log 100 foods', '🔍', 'silver', (s) => s.foodLogs >= 100),
  a('protein-7', 'Protein Pro', 'Hit your protein target on 7 days', '🥚', 'silver', (s) => s.proteinDays >= 7),
  a('water-7', 'Well Watered', 'Hit your water goal on 7 days', '💧', 'bronze', (s) => s.waterDays >= 7),
  a('weigh-4', 'Scale Regular', 'Log your weight 4 times', '⚖️', 'bronze', (s) => s.weighIns >= 4),
  a('photo-1', 'Day One Photo', 'Take your first progress photo', '📸', 'bronze', (s) => s.photos >= 1),
  a('quest-1', 'Quest Starter', 'Complete your first daily quest', '🗺️', 'bronze', (s) => s.quests >= 1),
  a('quest-50', 'Quest Master', 'Complete 50 daily quests', '🧭', 'gold', (s) => s.quests >= 50),
  a('perfect-1', 'Perfect Day', 'Finish all three daily quests in one day', '💎', 'bronze', (s) => s.perfectDays >= 1),
  a('perfect-7', 'Perfect Seven', 'Have 7 perfect days', '👑', 'gold', (s) => s.perfectDays >= 7),
  a('play-1', 'Game On', 'Finish a game in the Play tab', '🎮', 'bronze', (s) => s.plays >= 1),
  a('play-20', 'Player One', 'Finish 20 games in the Play tab', '🕹️', 'silver', (s) => s.plays >= 20),
  a('deck-52', 'Full Deck', 'Work through a full 52-card deck', '🃏', 'gold', (s) => s.fullDecks >= 1),
]

/** Achievements earned by these stats that aren't in `unlocked` yet. */
export function newlyUnlocked(stats: Stats, unlocked: ReadonlySet<string>): Achievement[] {
  return ACHIEVEMENTS.filter((x) => !unlocked.has(x.id) && x.check(stats))
}

/** What each countable achievement measures, so the trophy shelf can show progress. */
const NEED: Record<string, [keyof Stats, number]> = {
  'first-rep': ['workouts', 1],
  'three-done': ['workouts', 3],
  'ten-done': ['workouts', 10],
  'twentyfive-done': ['workouts', 25],
  'fifty-done': ['workouts', 50],
  'hundred-done': ['workouts', 100],
  'snack-1': ['snacks', 1],
  'snack-10': ['snacks', 10],
  'pushups-100': ['pushupReps', 100],
  'pushups-1000': ['pushupReps', 1000],
  'squats-500': ['squatReps', 500],
  'plank-60': ['bestPlankSec', 60],
  'plank-120': ['bestPlankSec', 120],
  'minutes-60': ['minutes', 60],
  'minutes-600': ['minutes', 600],
  'pr-1': ['prs', 1],
  'pr-10': ['prs', 10],
  'level-up': ['levelUps', 1],
  'level-up-10': ['levelUps', 10],
  'streak-2': ['weeklyStreak', 2],
  'streak-4': ['weeklyStreak', 4],
  'streak-12': ['weeklyStreak', 12],
  'daily-7': ['dailyStreak', 7],
  retest: ['tests', 2],
  'food-1': ['foodLogs', 1],
  'food-100': ['foodLogs', 100],
  'protein-7': ['proteinDays', 7],
  'water-7': ['waterDays', 7],
  'weigh-4': ['weighIns', 4],
  'photo-1': ['photos', 1],
  'quest-1': ['quests', 1],
  'quest-50': ['quests', 50],
  'perfect-1': ['perfectDays', 1],
  'perfect-7': ['perfectDays', 7],
  'play-1': ['plays', 1],
  'play-20': ['plays', 20],
  'deck-52': ['fullDecks', 1],
}

/** Progress toward an achievement (null for yes/no ones like "Early Bird"). */
export function achievementProgress(id: string, s: Stats): { value: number; target: number } | null {
  const need = NEED[id]
  if (!need) return null
  const v = s[need[0]]
  return { value: Math.min(need[1], typeof v === 'number' ? v : v ? 1 : 0), target: need[1] }
}
