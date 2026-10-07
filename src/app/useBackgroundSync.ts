import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/db'
import { getExercise } from '@/data/exercises'
import { weeklyStreak } from '@/engines/gamification'
import { generateSession, mainExercises } from '@/engines/plan'
import { defaultText, presetRules } from '@shared/reminder-rules'
import { todayISO } from '@/lib/dates'
import { planDates } from '@/state/gamification'
import { targetsFor, totalsOf, useDay } from '@/state/nutrition'
import { swapsFor, usePlan } from '@/state/plan'
import { saveReminderSettings, syncPush, useReminderSettings } from '@/state/reminders'
import { bridgeSet, type SwContext } from '@/sw-bridge'
import { usePrefs } from './prefs'

/** In-app reminder toasts (used when push notifications are off). */
export const useInAppToast = create<{ toast: { title: string; body: string; url: string } | null; show: (t: { title: string; body: string; url: string }) => void; clear: () => void }>((set) => ({
  toast: null,
  show: (toast) => set({ toast }),
  clear: () => set({ toast: null }),
}))

const IN_APP_KEY = 'forge.inAppReminders'

/**
 * Keeps the background pieces in step with the app: the service worker's context snapshot (for
 * personalized notifications), the server-side reminder registration, and in-app reminders.
 */
export function useBackgroundSync() {
  const plan = usePlan()
  const today = todayISO()
  const day = useDay(today)
  const workouts = useLiveQuery(() => db.workouts.where('date').aboveOrEqual(`${today.slice(0, 4)}-01-01`).toArray(), [today])
  const settings = useReminderSettings(plan?.profile)
  const coach = usePrefs((s) => s.coach)
  const synced = useRef('')
  /** Local "done for today" keys, mirroring the server-side acks for in-app reminders. */
  const localAcks = useRef<string[]>([])

  // 1. Snapshot for the service worker.
  useEffect(() => {
    if (!plan || !day || !workouts) return
    const p = plan.profile
    const idx = plan.progress.sessionsCompleted
    const next = generateSession(plan.inputs, plan.progress, { index: idx, swaps: swapsFor(plan, idx) })
    const t = targetsFor(p, day)
    const eaten = totalsOf(day.logs)
    const streak = weeklyStreak(planDates(workouts), p.daysPerWeek, today)
    const ctx: SwContext = {
      date: today,
      name: p.name || undefined,
      nextWorkout: { title: next.title, minutes: next.minutes, exercises: mainExercises(next).map((i) => getExercise(i.exerciseId)?.name ?? '').filter(Boolean) },
      workoutDone: workouts.some((w) => w.date === today && w.kind === 'plan'),
      waterMl: day.waterMl,
      waterTargetMl: t.waterMl,
      imperial: p.units === 'imperial',
      proteinLeft: Math.max(0, Math.round(t.protein - eaten.protein)),
      kcalLeft: Math.round(t.kcal - eaten.kcal),
      mealsLogged: [...new Set(day.logs.map((l) => l.meal))],
      streakWeeks: streak.weeks,
      thisWeek: streak.thisWeek,
      weekTarget: streak.target,
      coach,
    }
    void bridgeSet('context', ctx).catch(() => undefined)
    localAcks.current = [
      ...(ctx.workoutDone ? [`workout:${today}`] : []),
      ...(day.waterMl >= t.waterMl ? [`water:${today}`] : []),
      ...ctx.mealsLogged.filter((m) => m === 'lunch' || m === 'dinner').map((m) => `meal-${m}:${today}`),
    ]
  }, [plan, day, workouts, today, coach])

  // 2. Preset rules follow the schedule; push registration stays fresh (changes + weekly heartbeat).
  useEffect(() => {
    if (!plan || !settings) return
    const p = plan.profile
    if (settings.style !== 'custom') {
      const fresh = presetRules(settings.style, { trainingDays: p.trainingDays, workoutTime: p.preferredTime })
      // Keep the user's on/off choices for rules that exist in both.
      const merged = fresh.map((r) => ({ ...r, enabled: settings.rules.find((x) => x.id === r.id)?.enabled ?? r.enabled }))
      if (JSON.stringify(merged) !== JSON.stringify(settings.rules)) {
        void saveReminderSettings({ ...settings, rules: merged })
        return
      }
    }
    if (!settings.enabled) return
    const key = JSON.stringify([settings.rules, p.sessionMinutes])
    if (synced.current === key) return
    synced.current = key
    void syncPush(settings, p).catch(() => undefined)
  }, [plan, settings])

  // 3. In-app reminders while the app is open and push is off.
  useEffect(() => {
    if (!settings || settings.enabled) return
    let live = true
    const tick = async () => {
      // The scheduler (and its date library) loads only when in-app reminders are in use.
      const { dueOccurrences } = await import('@shared/reminders')
      if (!live) return
      let last: Record<string, number> = {}
      try {
        last = JSON.parse(localStorage.getItem(IN_APP_KEY) ?? '{}') as Record<string, number>
      } catch {
        /* ignore */
      }
      const now = Date.now()
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      // First run: start the watermarks now (no backlog).
      for (const r of settings.rules) last[r.id] ??= now
      const due = dueOccurrences(
        settings.rules.filter((r) => r.enabled && r.type !== 'review' && r.type !== 'weighin'),
        tz,
        now,
        last,
        localAcks.current,
      )
      if (due.length) {
        const occ = due[due.length - 1]
        const rule = settings.rules.find((r) => r.id === occ.ruleId)
        if (rule) useInAppToast.getState().show(defaultText(rule))
        for (const o of due) last[o.ruleId] = o.fireAt
      }
      localStorage.setItem(IN_APP_KEY, JSON.stringify(last))
    }
    void tick()
    const id = window.setInterval(() => void tick(), 60_000)
    return () => {
      live = false
      window.clearInterval(id)
    }
  }, [settings])
}
