import { useEffect, useState } from 'react'
import { AlertTriangle, BellRing, CalendarPlus, CheckCircle2, KeyRound, Loader2, Send } from 'lucide-react'
import { REMINDER_LABEL, nextOccurrence, presetRules, ruleTimes, type ReminderRule } from '@shared/reminders'
import { buildIcs } from '@/engines/ics'
import { upcomingDays } from '@/engines/plan'
import { addDays, isoWeekday, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { downloadBlob } from '@/state/backup'
import { usePlan } from '@/state/plan'
import {
  disablePush,
  enablePush,
  fetchPushConfig,
  pushSupport,
  saveReminderSettings,
  sendTestPush,
  setPasscode,
  usePasscode,
  useReminderSettings,
  type PushConfig,
  type ReminderSettings,
  type ReminderStyleChoice,
} from '@/state/reminders'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Segmented } from '@/ui/Segmented'
import { Toggle } from '@/ui/Toggle'
import { InstallGuide } from '../onboarding/InstallGuide'

function ago(ms: number): string {
  const m = Math.round((Date.now() - ms) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`
}

function describeRule(r: ReminderRule): string {
  const days = r.days.length === 7 ? 'Every day' : r.days.length === 5 && !r.days.includes(6) && !r.days.includes(7) ? 'Weekdays' : r.days.map((d) => WEEKDAY_SHORT[d - 1]).join(' ')
  if (r.every) return `${days} · every ${r.every.minutes >= 60 ? `${r.every.minutes / 60} h` : `${r.every.minutes} min`}, ${r.every.start}–${r.every.end}`
  return `${days} · ${ruleTimes(r).join(', ')}`
}

export default function RemindersPage() {
  const plan = usePlan()
  const settings = useReminderSettings(plan?.profile)
  const passcode = usePasscode()
  const [cfg, setCfg] = useState<PushConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    void fetchPushConfig().then(setCfg)
  }, [])

  if (!plan || !settings || passcode === undefined) return <PageHeader title="Reminders" back="/more" />
  const p = plan.profile
  const support = pushSupport()
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const next = nextOccurrence(settings.rules, tz, Date.now())

  const save = (s: ReminderSettings) => void saveReminderSettings(s)
  const setStyle = (style: ReminderStyleChoice) => {
    if (style === 'custom') return save({ ...settings, style })
    save({ ...settings, style, rules: presetRules(style, { trainingDays: p.trainingDays, workoutTime: p.preferredTime }) })
  }
  const updateRule = (id: string, patch: Partial<ReminderRule>) => save({ ...settings, style: 'custom', rules: settings.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })

  const toggle = async (on: boolean) => {
    setBusy(true)
    setMsg(null)
    if (on) {
      const r = await enablePush(settings, p)
      setMsg(r.ok ? { ok: true, text: 'Reminders are on. Send a test to make sure they arrive.' } : { ok: false, text: r.error ?? 'Something went wrong.' })
    } else {
      await disablePush(settings)
      setMsg({ ok: true, text: 'Push reminders are off. You will still get in-app reminders while Forge is open.' })
    }
    setBusy(false)
    void fetchPushConfig().then(setCfg)
  }

  const githubAt = cfg?.scheduler?.ticks?.github
  const stale = cfg?.ok && cfg.scheduler?.githubStale && settings.enabled

  return (
    <>
      <PageHeader title="Reminders" subtitle="Nudges that fit your day" back="/more" />
      <div className="px-4">
        {!support.ok && support.reason === 'ios-install' ? (
          <div className="mb-3">
            <InstallGuide />
            <p className="mt-2 px-1 text-xs text-muted">iPhone only delivers notifications to apps on the Home Screen (iOS 16.4 or later).</p>
          </div>
        ) : null}

        <Card>
          <div className="flex items-start gap-3">
            <BellRing className={cx('mt-0.5 shrink-0', settings.enabled ? 'text-good' : 'text-muted')} size={22} />
            <div className="flex-1">
              <div className="font-semibold">Push notifications</div>
              <div className="text-sm text-muted">
                {settings.enabled
                  ? next
                    ? `On · next: ${REMINDER_LABEL[next.type]} ${next.date === todayISO() ? 'today' : WEEKDAY_SHORT[isoWeekday(next.date) - 1]} at ${next.time}`
                    : 'On'
                  : 'Arrive even when Forge is closed.'}
              </div>
            </div>
            {busy ? <Loader2 className="mt-1 animate-spin text-muted" size={20} /> : null}
          </div>

          {passcode === null ? (
            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (code.trim()) void setPasscode(code.trim())
              }}
            >
              <label className="block text-sm text-muted" htmlFor="passcode">
                Access code <span className="text-faint">(the APP_PASSCODE you set in Vercel)</span>
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="passcode"
                  type="password"
                  autoComplete="current-password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11 flex-1 rounded-2xl border border-line bg-surface px-3 outline-none focus:border-ember"
                />
                <Button type="submit" icon={<KeyRound size={16} />} disabled={!code.trim()}>
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button disabled={busy || !support.ok} variant={settings.enabled ? 'secondary' : 'primary'} onClick={() => void toggle(!settings.enabled)}>
                {settings.enabled ? 'Turn off' : 'Turn on'}
              </Button>
              <Button
                variant="secondary"
                icon={<Send size={15} />}
                disabled={!settings.enabled || busy}
                onClick={async () => {
                  setBusy(true)
                  const r = await sendTestPush(settings)
                  setBusy(false)
                  setMsg(r.ok ? { ok: true, text: 'Test sent — it should pop up in a few seconds.' } : { ok: false, text: r.error ?? 'Test failed.' })
                }}
              >
                Send test
              </Button>
            </div>
          )}
          {msg ? (
            <p className={cx('mt-3 flex items-start gap-1.5 text-sm', msg.ok ? 'text-good' : 'text-bad')}>
              {msg.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
              {msg.text}
            </p>
          ) : null}
          {!support.ok && support.reason === 'denied' ? <p className="mt-3 text-sm text-bad">Notifications are blocked. Allow them for Forge in your phone's settings, then come back.</p> : null}
          {passcode !== null ? (
            <button type="button" className="mt-3 text-xs text-faint underline" onClick={() => void setPasscode(null)}>
              Change access code
            </button>
          ) : null}
        </Card>

        {cfg && !cfg.ok ? (
          <Card className="mt-3 border-amber/40 text-sm">
            <div className="font-semibold">Server setup needed</div>
            <p className="mt-1 text-muted">{cfg.error}</p>
          </Card>
        ) : null}
        {cfg?.ok ? (
          <Card className={cx('mt-3 text-sm', stale && 'border-amber/50')}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Reminder clock</span>
              <span className={stale ? 'text-amber' : 'text-good'}>{stale ? 'Needs attention' : githubAt ? 'Running' : 'Waiting for first run'}</span>
            </div>
            <p className="mt-1 text-muted">
              {githubAt ? `GitHub scheduler last checked in ${ago(githubAt)}.` : 'The GitHub scheduler starts once the app is merged to main.'}
              {cfg.scheduler?.lastTick ? ` Last run: ${ago(cfg.scheduler.lastTick.at)} (${cfg.scheduler.lastTick.source}).` : ''}
            </p>
            {stale && githubAt ? (
              <p className="mt-2">
                GitHub pauses scheduled workflows after 60 days without repository activity. Open{' '}
                <a className="text-sky underline" href="https://github.com/dbassin12/mitzvah-calendar/actions/workflows/fitness-reminders.yml" target="_blank" rel="noreferrer">
                  the Fitness reminders workflow
                </a>{' '}
                and tap “Enable workflow”.
              </p>
            ) : null}
          </Card>
        ) : null}

        <SectionTitle>What to remind me about</SectionTitle>
        <Segmented
          label="Reminder style"
          value={settings.style}
          onChange={setStyle}
          options={[
            { value: 'gentle', label: 'Gentle' },
            { value: 'coach', label: 'Coach' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
        <p className="mt-2 px-1 text-xs text-muted">
          {settings.style === 'gentle' ? 'About 2 a day: workout time, a streak saver, weigh-in and the weekly review.' : settings.style === 'coach' ? 'About 8 a day: adds water, meal logging, movement snacks and an evening check-in.' : 'Your own mix — edit any reminder below.'}
        </p>
        <Card className="mt-3 py-1">
          <ul className="divide-y divide-line/60">
            {settings.rules.map((r) => (
              <li key={r.id} className="py-2">
                <Toggle checked={r.enabled} onChange={(v) => updateRule(r.id, { enabled: v })} label={r.type === 'meal' && r.meal ? `Log ${r.meal}` : REMINDER_LABEL[r.type]} description={describeRule(r)} />
                {r.enabled && settings.style === 'custom' ? (
                  r.every ? (
                    <div className="flex flex-wrap items-center gap-2 pb-2 text-sm">
                      <input type="time" aria-label="From" value={r.every.start} onChange={(e) => e.target.value && updateRule(r.id, { every: { ...r.every!, start: e.target.value } })} className="h-9 rounded-xl border border-line bg-surface px-2" />
                      <span className="text-muted">to</span>
                      <input type="time" aria-label="Until" value={r.every.end} onChange={(e) => e.target.value && updateRule(r.id, { every: { ...r.every!, end: e.target.value } })} className="h-9 rounded-xl border border-line bg-surface px-2" />
                      <select aria-label="How often" value={r.every.minutes} onChange={(e) => updateRule(r.id, { every: { ...r.every!, minutes: Number(e.target.value) } })} className="h-9 rounded-xl border border-line bg-surface px-2">
                        {[60, 90, 120, 180].map((m) => (
                          <option key={m} value={m}>
                            every {m / 60} h
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pb-2">
                      {(r.times ?? []).map((t, k) => (
                        <input
                          key={k}
                          type="time"
                          aria-label={`${REMINDER_LABEL[r.type]} time ${k + 1}`}
                          value={t}
                          onChange={(e) => e.target.value && updateRule(r.id, { times: (r.times ?? []).map((x, j) => (j === k ? e.target.value : x)) })}
                          className="h-9 rounded-xl border border-line bg-surface px-2 text-sm"
                        />
                      ))}
                    </div>
                  )
                ) : null}
              </li>
            ))}
          </ul>
        </Card>

        <SectionTitle>Calendar backup</SectionTitle>
        <Card>
          <p className="text-sm text-muted">Add your workout days to your phone's calendar with an alarm — they'll ring even if everything else fails.</p>
          <Button
            block
            variant="secondary"
            className="mt-3"
            icon={<CalendarPlus size={16} />}
            onClick={() => {
              const first = upcomingDays(plan.inputs, p.trainingDays, 0, todayISO(), 1)[0]?.date ?? todayISO()
              let sat = todayISO()
              while (isoWeekday(sat) !== 6) sat = addDays(sat, 1)
              const ics = buildIcs({ startDate: first, trainingDays: p.trainingDays, time: p.preferredTime, minutes: p.sessionMinutes, weighIn: true, weighInStartDate: sat })
              downloadBlob(new Blob([ics], { type: 'text/calendar' }), 'forge-workouts.ics')
            }}
          >
            Add workouts to my calendar
          </Button>
        </Card>
        <p className="mt-3 px-1 text-xs text-faint">While Forge is open you also get gentle in-app reminders, even with push off.</p>
        <div className="h-4" />
      </div>
    </>
  )
}
