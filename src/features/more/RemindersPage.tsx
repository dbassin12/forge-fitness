import { useEffect, useState } from 'react'
import { AlertTriangle, BellRing, CalendarCheck, CalendarPlus, CheckCircle2, ExternalLink, Loader2, Send } from 'lucide-react'
import { REMINDER_LABEL, nextOccurrence, presetRules, ruleTimes, type ReminderRule } from '@shared/reminders'
import { eventCount } from '@shared/calendar'
import { isIOS } from '@/app/pwa'
import { haptic } from '@/device/haptics'
import { isoWeekday, todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { addRemindersToCalendar, calendarUpToDate, configFor, googleCalendarLink, setReminderMode, useCalendarExport, useReminderMode, type ReminderMode } from '@/state/calendar'
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
import { PasscodeForm } from '../settings/PasscodeForm'

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
  const [calMsg, setCalMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const mode = useReminderMode(settings?.enabled)
  const exported = useCalendarExport()

  useEffect(() => {
    if (mode === 'push') void fetchPushConfig().then(setCfg)
  }, [mode])

  if (!plan || !settings || passcode === undefined || mode === undefined || exported === undefined) return <PageHeader title="Reminders" back="/more" />
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

  const calendarCount = eventCount(configFor(settings, p))
  const upToDate = calendarUpToDate(exported, settings, p)
  const ios = isIOS()
  const google = ios ? null : googleCalendarLink(settings, p)

  const addToCalendar = () => {
    const how = addRemindersToCalendar(settings, p)
    haptic('success')
    setCalMsg(
      how === 'empty'
        ? { ok: false, text: 'Turn on at least one reminder below first.' }
        : how === 'offline'
          ? { ok: false, text: 'You’re offline. Connect to the internet and tap again.' }
          : how === 'opened'
            ? { ok: true, text: 'In the Calendar screen, tap “Add All”, then “Done” to come back.' }
            : { ok: true, text: 'Downloaded “forge-reminders.ics”. Open it and choose your calendar app to add the reminders.' },
    )
  }

  const pickMode = (m: ReminderMode) => {
    haptic('light')
    void setReminderMode(m)
  }

  return (
    <>
      <PageHeader title="Reminders" subtitle="Nudges that fit your day" back="/more" />
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How Forge reminds you">
          {(
            [
              { id: 'calendar', emoji: '📅', title: 'Phone reminders', text: 'No setup. Your phone’s calendar alerts you.', badge: 'Easiest' },
              { id: 'push', emoji: '🔔', title: 'Smart notifications', text: 'Personal, skip when done. Needs server setup.' },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={mode === o.id}
              onClick={() => pickMode(o.id)}
              className={cx('pressable relative rounded-2xl border p-3 text-left', mode === o.id ? 'border-ember bg-ember/10' : 'border-line bg-surface')}
            >
              {'badge' in o ? <span className="absolute top-2 right-2 rounded-full bg-good/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-good">{o.badge}</span> : null}
              <div className="text-2xl">{o.emoji}</div>
              <div className={cx('mt-1 font-semibold leading-tight', mode === o.id && 'text-ember')}>{o.title}</div>
              <div className="mt-0.5 text-xs text-muted">{o.text}</div>
            </button>
          ))}
        </div>

        {mode === 'calendar' ? (
          <Card className="mt-3">
            <div className="flex items-start gap-3">
              {upToDate ? <CalendarCheck className="mt-0.5 shrink-0 text-good" size={22} /> : <CalendarPlus className="mt-0.5 shrink-0 text-ember" size={22} />}
              <div className="flex-1">
                <div className="font-semibold">
                  {upToDate && exported ? `In your calendar since ${new Date(exported.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : exported ? 'Your reminders changed' : 'Reminders through your calendar'}
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {upToDate
                    ? 'Your phone will alert you at the times below, even when Forge is closed.'
                    : exported
                      ? 'Add them again so your calendar matches. Delete the old Forge events if you see doubles.'
                      : 'Your phone’s calendar alerts you at the times below, even when Forge is closed. No account, no access code.'}
                </p>
              </div>
            </div>
            <Button block size="lg" className="mt-3" variant={upToDate ? 'secondary' : 'primary'} icon={<CalendarPlus size={18} />} disabled={!calendarCount} onClick={addToCalendar}>
              {upToDate ? 'Add to my calendar again' : `Add ${calendarCount} reminder${calendarCount === 1 ? '' : 's'} to my calendar`}
            </Button>
            {calMsg ? (
              <p className={cx('mt-3 flex items-start gap-1.5 text-sm', calMsg.ok ? 'text-good' : 'text-bad')} role="status">
                {calMsg.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
                {calMsg.text}
              </p>
            ) : null}
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted">
              {ios ? (
                <>
                  <li>Tap the button above.</li>
                  <li>
                    In the Calendar screen that opens, tap <b className="text-ink">Add All</b>, then <b className="text-ink">Done</b>.
                  </li>
                  <li>That’s it. Change something below? Tap the button again.</li>
                </>
              ) : (
                <>
                  <li>Tap the button above to download the reminders file.</li>
                  <li>Open it from the download notification and pick your calendar app.</li>
                  <li>Change something below? Tap the button again.</li>
                </>
              )}
            </ol>
            {google ? (
              <a href={google} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-sky">
                <ExternalLink size={15} /> Using Google Calendar? Add the workout reminder in one tap
              </a>
            ) : null}
          </Card>
        ) : null}

        {mode === 'push' ? (
          <>
            {!support.ok && support.reason === 'ios-install' ? (
              <div className="mt-3">
                <InstallGuide />
                <p className="mt-2 px-1 text-xs text-muted">iPhone only delivers notifications to apps on the Home Screen (iOS 16.4 or later).</p>
              </div>
            ) : null}

            <Card className="mt-3">
              <div className="flex items-start gap-3">
                <BellRing className={cx('mt-0.5 shrink-0', settings.enabled ? 'text-good' : 'text-muted')} size={22} />
                <div className="flex-1">
                  <div className="font-semibold">Smart notifications</div>
                  <div className="text-sm text-muted">
                    {settings.enabled
                      ? next
                        ? `On · next: ${REMINDER_LABEL[next.type]} ${next.date === todayISO() ? 'today' : WEEKDAY_SHORT[isoWeekday(next.date) - 1]} at ${next.time}`
                        : 'On'
                      : 'They know what you’ve done today and skip the ones you don’t need. They need the Forge server set up (access code).'}
                  </div>
                </div>
                {busy ? <Loader2 className="mt-1 animate-spin text-muted" size={20} /> : null}
              </div>

              {passcode === null ? (
                <PasscodeForm className="mt-4" />
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
                <p className="mt-2 text-muted">
                  Don’t want to deal with that?{' '}
                  <button type="button" className="font-medium text-ember underline" onClick={() => pickMode('calendar')}>
                    Use phone reminders instead
                  </button>{' '}
                  — no setup needed.
                </p>
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
                    <a className="text-sky underline" href="https://github.com/dbassin12/forge-fitness/actions/workflows/fitness-reminders.yml" target="_blank" rel="noreferrer">
                      the Fitness reminders workflow
                    </a>{' '}
                    and tap “Enable workflow”.
                  </p>
                ) : null}
              </Card>
            ) : null}
          </>
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

        <p className="mt-3 px-1 text-xs text-faint">
          {mode === 'calendar' ? 'Your calendar keeps the reminders even if you delete Forge. Remove them in your calendar app anytime.' : 'While Forge is open you also get gentle in-app reminders, even with push off.'}
        </p>
        <div className="h-4" />
      </div>
    </>
  )
}
