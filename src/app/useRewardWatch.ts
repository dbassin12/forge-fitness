import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, kvGet, kvSet } from '@/db/db'
import { ACHIEVEMENTS, levelForXp, levelTitle } from '@/engines/gamification'
import { QUESTS } from '@/engines/quests'
import { addDays, startOfWeek, todayISO } from '@/lib/dates'
import { checkAchievements, useTotalXp } from '@/state/gamification'
import { evaluateQuests, useQuestSignal } from '@/state/quests'
import { useProfile } from '@/state/store'
import { useCelebrate } from './celebrate'
import { MASCOT_GEAR } from '@/ui/Mascot'
import { ACCENTS } from './theme'

// One reward check at a time (StrictMode and fast taps can fire effects back to back).
let chain: Promise<unknown> = Promise.resolve()
function serial(fn: () => Promise<void>) {
  chain = chain.then(fn, fn).catch(() => undefined)
}

/**
 * Watches for rewards anywhere in the app and celebrates them: daily quests completing, new
 * achievements (food, water, photos… not only workouts), level-ups and XP gains.
 */
export function useRewardWatch({ floaters, badgeScreen }: { floaters: boolean; badgeScreen: boolean }) {
  const profile = useProfile()
  const today = todayISO()
  const signal = useQuestSignal(profile, today)
  const xp = useTotalXp()
  const unlocked = useLiveQuery(() => db.achievements.toArray(), [])
  const recentXp = useLiveQuery(() => db.xpEvents.where('date').equals(today).toArray(), [today])
  const monday = startOfWeek(today)
  const weekDone = useLiveQuery(() => db.workouts.where('date').between(monday, addDays(monday, 6), true, true).filter((w) => w.kind === 'plan').count(), [monday])
  const mountedAt = useRef(Date.now())
  const floated = useRef(new Set<string>())

  // Quests: pay out and toast whenever today's activity changes.
  useEffect(() => {
    if (!profile || signal === undefined) return
    serial(async () => {
      const { completed, perfect, facts } = await evaluateQuests(profile, today)
      const { toast } = useCelebrate.getState()
      for (const id of completed) {
        const q = QUESTS[id]
        toast({ tone: 'quest', title: 'Quest complete!', text: q.title(facts), xp: q.xp, emoji: q.emoji })
      }
      if (perfect) toast({ tone: 'perfect', title: 'Perfect day!', text: 'All three quests done. Bonus XP!', xp: 40, emoji: '💎' })
      // Logging food, water, weight and photos can unlock achievements too.
      await checkAchievements()
    })
  }, [profile, signal, today])

  // Achievements: celebrate the ones not seen yet (batched: several can unlock at once).
  useEffect(() => {
    if (!unlocked) return
    const timer = window.setTimeout(() => serial(async () => {
      const seen = await kvGet<string[]>('achievements.seen')
      const ids = unlocked.map((a) => a.id)
      if (!seen) {
        await kvSet('achievements.seen', ids)
        return
      }
      const fresh = ids.filter((id) => !seen.includes(id))
      if (!fresh.length) return
      await kvSet('achievements.seen', [...seen, ...fresh])
      const badges = fresh.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter((a): a is (typeof ACHIEVEMENTS)[number] => !!a)
      if (!badges.length) return
      const c = useCelebrate.getState()
      // After a workout (or for a gold badge) it gets the full screen; mid-task it's a toast.
      if (badgeScreen || badges.some((b) => b.tier === 'gold')) c.push({ kind: 'badges', badges: badges.map(({ id, title, description, badge, tier }) => ({ id, title, description, badge, tier })) })
      else for (const b of badges) c.toast({ tone: 'badge', title: `Achievement: ${b.title}`, text: b.description, xp: 20, emoji: b.badge })
    }), 450)
    return () => window.clearTimeout(timer)
  }, [unlocked, badgeScreen])

  // Level-ups (from any source of XP).
  useEffect(() => {
    if (xp === undefined) return
    serial(async () => {
      const level = levelForXp(xp).level
      const seen = await kvGet<number>('level.seen')
      if (seen === undefined || level < seen) {
        await kvSet('level.seen', level)
        return
      }
      if (level === seen) return
      await kvSet('level.seen', level)
      const unlocks = ACCENTS.filter((a) => a.unlockLevel > seen && a.unlockLevel <= level)
      const gear = MASCOT_GEAR.filter((g) => g.level > seen && g.level <= level).map(({ id, name }) => ({ id, name }))
      useCelebrate.getState().push({ kind: 'level', level, title: levelTitle(level), unlocks, gear })
    })
  }, [xp])

  // Weekly goal: celebrate once, the moment this week's workouts reach the goal.
  useEffect(() => {
    if (!profile || weekDone === undefined || weekDone < profile.daysPerWeek) return
    serial(async () => {
      const key = `weekgoal:${monday}`
      if (await kvGet<boolean>(key)) return
      await kvSet(key, true)
      useCelebrate.getState().toast({ tone: 'perfect', title: 'Weekly goal hit! 🔥', text: `${weekDone} workouts this week. Your streak grows.`, emoji: '🎯' })
    })
  }, [profile, weekDone, monday])

  // "+XP" floaters for XP earned while this screen is open.
  useEffect(() => {
    if (!floaters || !recentXp) return
    for (const e of recentXp) {
      if (e.at < mountedAt.current || floated.current.has(e.id)) continue
      floated.current.add(e.id)
      useCelebrate.getState().float(e.xp)
    }
  }, [recentXp, floaters])
}
