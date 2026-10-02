import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Apple,
  Bell,
  Bot,
  CalendarDays,
  ChevronRight,
  Download,
  Dumbbell,
  HardDrive,
  HeartPulse,
  Info,
  Moon,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  User,
  Volume2,
} from 'lucide-react'
import { useTheme } from '@/app/theme'
import type { Ache, DietStyle, Equipment, Experience, Goal, Profile } from '@/domain/types'
import { splitName } from '@/engines/plan'
import { WEEKDAY_SHORT } from '@/lib/dates'
import { downloadBlob, exportBackup, parseBackup, requestPersistence, restoreBackup, wipeAll } from '@/state/backup'
import { saveNutritionSettings, useNutritionSettings } from '@/state/nutrition'
import { updateProfile, useProfile } from '@/state/store'
import { Button } from '@/ui/Button'
import { Card, SectionTitle } from '@/ui/Card'
import { Chip } from '@/ui/Chip'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Segmented } from '@/ui/Segmented'
import { Sheet } from '@/ui/Sheet'
import { Stepper } from '@/ui/Stepper'
import { Toggle } from '@/ui/Toggle'
import { useVoiceSettings } from '@/voice/settings'
import { speech } from '@/voice/speech'
import { InstallGuide } from '../onboarding/InstallGuide'
import { EquipmentEditor } from '../settings/EquipmentEditor'

type Panel = 'profile' | 'schedule' | 'equipment' | 'health' | 'food' | 'voice' | 'data' | null

function Row({ icon, title, sub, onClick, to }: { icon: ReactNode; title: string; sub?: string; onClick?: () => void; to?: string }) {
  const inner = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {sub ? <span className="block truncate text-xs text-muted">{sub}</span> : null}
      </span>
      <ChevronRight size={18} className="shrink-0 text-faint" />
    </>
  )
  return (
    <li>
      {to ? (
        <Link to={to} className="flex items-center gap-3 py-2.5">
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-2.5 text-left">
          {inner}
        </button>
      )}
    </li>
  )
}

const GOAL_LABEL: Record<Goal, string> = { lose_fat: 'Lose fat', build_muscle: 'Build muscle', get_stronger: 'Get stronger', general_fitness: 'Feel fit & healthy' }
const DIET_LABEL: Record<DietStyle, string> = { none: 'No restrictions', kosher: 'Kosher-style', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian', vegan: 'Vegan' }

export default function MorePage() {
  const profile = useProfile()
  const [panel, setPanel] = useState<Panel>(null)
  const { theme, setTheme } = useTheme()
  if (!profile) return <PageHeader title="More" />
  const p = profile
  const close = () => setPanel(null)
  const dbs = p.equipment.dumbbells
  const missing = dbs.filter((d) => !d.found)

  return (
    <>
      <PageHeader title="More" subtitle="Settings, reminders and your data" />
      <div className="px-4">
        {missing.length ? (
          <Card className="mb-3 border-amber/40 bg-amber/5">
            <div className="flex items-center gap-3">
              <Dumbbell className="shrink-0 text-amber" size={22} />
              <div className="flex-1 text-sm">
                <b>Found the {missing[0].weightLb} lb dumbbell?</b> Turn it on and your goblet squats and one-arm rows will use it.
              </div>
            </div>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => void updateProfile({ equipment: { ...p.equipment, dumbbells: dbs.map((d) => (d.id === missing[0].id ? { ...d, found: true } : d)) } })}
            >
              Yes, I found it
            </Button>
          </Card>
        ) : null}

        <Card className="py-1">
          <ul className="divide-y divide-line/60">
            <Row icon={<User size={18} />} title={p.name || 'Your profile'} sub={`${GOAL_LABEL[p.goal]} · ${p.experience}`} onClick={() => setPanel('profile')} />
            <Row
              icon={<CalendarDays size={18} />}
              title="Schedule"
              sub={`${splitName(p.daysPerWeek, p.sessionMinutes)} · ${p.trainingDays.map((d) => WEEKDAY_SHORT[d - 1]).join(' ')} · ${p.sessionMinutes} min`}
              onClick={() => setPanel('schedule')}
            />
            <Row icon={<Dumbbell size={18} />} title="Equipment" sub={dbs.filter((d) => d.found).map((d) => `${d.count}×${d.weightLb} lb`).join(', ') || 'Bodyweight only'} onClick={() => setPanel('equipment')} />
            <Row icon={<HeartPulse size={18} />} title="Aches & limits" sub={p.aches.length ? p.aches.join(', ').replace('_', ' ') : 'None'} onClick={() => setPanel('health')} />
            <Row icon={<Apple size={18} />} title="Food & nutrition" sub={`${DIET_LABEL[p.diet]} · ${p.trackingMode === 'lite' ? 'Lite' : 'Full'} tracking`} onClick={() => setPanel('food')} />
          </ul>
        </Card>

        <SectionTitle>Coaching</SectionTitle>
        <Card className="py-1">
          <ul className="divide-y divide-line/60">
            <Row icon={<Bell size={18} />} title="Reminders" sub="Workouts, meals, water, streaks" to="/more/reminders" />
            <Row icon={<Volume2 size={18} />} title="Voice & sounds" sub="Voice, speed, beeps, rep counting" onClick={() => setPanel('voice')} />
            <Row icon={<Bot size={18} />} title="AI coach" sub="Chat, photo and text food logging" to="/coach" />
          </ul>
        </Card>

        <SectionTitle>App</SectionTitle>
        <Card className="py-1">
          <ul className="divide-y divide-line/60">
            <li className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">{theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}</span>
              <span className="flex-1 font-medium">Appearance</span>
              <Segmented
                label="Theme"
                className="w-40"
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ]}
              />
            </li>
            <Row icon={<HardDrive size={18} />} title="Backup & data" sub="Export, restore, storage" onClick={() => setPanel('data')} />
            <Row icon={<Sparkles size={18} />} title="Animation lab" sub="Every exercise animation, frame by frame" to="/lab" />
          </ul>
        </Card>

        <div className="mt-3">
          <InstallGuide compact />
        </div>

        <Card className="mt-3 flex gap-3 text-xs text-muted">
          <Info size={16} className="mt-0.5 shrink-0" />
          <p>
            Forge keeps your data on this phone. Food data partly from Open Food Facts (ODbL). Forge gives general fitness guidance, not medical advice —
            stop if something hurts and check with a doctor if unsure.
          </p>
        </Card>
        <div className="h-4" />
      </div>

      <Sheet open={panel === 'profile'} onClose={close} title="Your profile">
        <ProfileEditor p={p} onDone={close} />
      </Sheet>
      <Sheet open={panel === 'schedule'} onClose={close} title="Schedule">
        <ScheduleEditor p={p} onDone={close} />
      </Sheet>
      <Sheet open={panel === 'equipment'} onClose={close} title="Equipment">
        <EquipmentPanel p={p} onDone={close} />
      </Sheet>
      <Sheet open={panel === 'health'} onClose={close} title="Aches & limits">
        <HealthEditor p={p} onDone={close} />
      </Sheet>
      <Sheet open={panel === 'food'} onClose={close} title="Food & nutrition">
        <FoodEditor p={p} onDone={close} />
      </Sheet>
      <Sheet open={panel === 'voice'} onClose={close} title="Voice & sounds">
        <VoiceEditor />
      </Sheet>
      <Sheet open={panel === 'data'} onClose={close} title="Backup & data">
        <DataPanel />
      </Sheet>
    </>
  )
}

const inputCls = 'h-11 w-full rounded-2xl border border-line bg-surface px-3 text-ink outline-none focus:border-ember'

function ProfileEditor({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [d, setD] = useState(p)
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">First name</span>
        <input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
      </label>
      <div>
        <div className="mb-1 text-sm text-muted">Goal</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(GOAL_LABEL) as Goal[]).map((g) => (
            <Chip key={g} active={d.goal === g} onClick={() => setD({ ...d, goal: g })}>
              {GOAL_LABEL[g]}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-sm text-muted">Experience</div>
        <Segmented<Experience>
          label="Experience"
          value={d.experience}
          onChange={(v) => setD({ ...d, experience: v })}
          options={[
            { value: 'beginner', label: 'New' },
            { value: 'intermediate', label: 'Some' },
            { value: 'advanced', label: 'Experienced' },
          ]}
        />
      </div>
      <div>
        <div className="mb-1 text-sm text-muted">Units</div>
        <Segmented
          label="Units"
          value={d.units}
          onChange={(v) => setD({ ...d, units: v })}
          options={[
            { value: 'imperial', label: 'lb · ft · oz' },
            { value: 'metric', label: 'kg · cm · L' },
          ]}
        />
      </div>
      <p className="text-xs text-muted">Weight updates automatically when you log a weigh-in on the Progress tab.</p>
      <Button
        block
        size="lg"
        onClick={async () => {
          await updateProfile({ name: d.name.trim(), goal: d.goal, experience: d.experience, units: d.units })
          onDone()
        }}
      >
        Save
      </Button>
    </div>
  )
}

function ScheduleEditor({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [days, setDays] = useState(p.trainingDays)
  const [minutes, setMinutes] = useState(p.sessionMinutes)
  const [time, setTime] = useState(p.preferredTime)
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-sm text-muted">Training days ({days.length} a week)</div>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_SHORT.map((w, k) => {
            const on = days.includes(k + 1)
            return (
              <button
                key={w}
                type="button"
                aria-pressed={on}
                onClick={() => setDays(on ? days.filter((x) => x !== k + 1) : [...days, k + 1].sort())}
                className={cx('h-11 rounded-xl border text-sm font-semibold', on ? 'border-ember bg-ember text-on-accent' : 'border-line bg-surface text-muted')}
              >
                {w.slice(0, 2)}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm text-muted">Minutes per workout</div>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 15, 20, 30, 45, 60].map((m) => (
            <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>
              {m}
            </Chip>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Usual workout time</span>
        <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value || '07:00')} />
      </label>
      <p className="text-xs text-muted">Your progress carries over — only the weekly layout changes.</p>
      <Button
        block
        size="lg"
        disabled={days.length === 0}
        onClick={async () => {
          await updateProfile({ trainingDays: days, daysPerWeek: days.length, sessionMinutes: minutes, preferredTime: time })
          onDone()
        }}
      >
        Save
      </Button>
    </div>
  )
}

function EquipmentPanel({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [eq, setEq] = useState<Equipment>(p.equipment)
  const [quiet, setQuiet] = useState(!!p.quietMode)
  return (
    <div>
      <EquipmentEditor equipment={eq} quietMode={quiet} onChange={setEq} onQuietMode={setQuiet} />
      <Button
        block
        size="lg"
        className="mt-4"
        onClick={async () => {
          await updateProfile({ equipment: eq, quietMode: quiet })
          onDone()
        }}
      >
        Save
      </Button>
    </div>
  )
}

function HealthEditor({ p, onDone }: { p: Profile; onDone: () => void }) {
  const [aches, setAches] = useState<Ache[]>(p.aches)
  const all: { id: Ache; label: string }[] = [
    { id: 'knees', label: 'Knees' },
    { id: 'lower_back', label: 'Lower back' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'wrists', label: 'Wrists' },
  ]
  return (
    <div>
      <p className="text-sm text-muted">Moves that could aggravate these are swapped out; the rest get extra cues.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {all.map((a) => (
          <Chip key={a.id} active={aches.includes(a.id)} onClick={() => setAches(aches.includes(a.id) ? aches.filter((x) => x !== a.id) : [...aches, a.id])}>
            {a.label}
          </Chip>
        ))}
      </div>
      <Button
        block
        size="lg"
        className="mt-5"
        onClick={async () => {
          await updateProfile({ aches })
          onDone()
        }}
      >
        Save
      </Button>
    </div>
  )
}

function FoodEditor({ p, onDone }: { p: Profile; onDone: () => void }) {
  const settings = useNutritionSettings()
  const [diet, setDiet] = useState(p.diet)
  const [mode, setMode] = useState(p.trackingMode)
  const [avoid, setAvoid] = useState(p.avoidFoods.join(', '))
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-sm text-muted">Diet</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(DIET_LABEL) as DietStyle[]).map((x) => (
            <Chip key={x} active={diet === x} onClick={() => setDiet(x)}>
              {DIET_LABEL[x]}
            </Chip>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Foods to avoid</span>
        <input className={inputCls} value={avoid} onChange={(e) => setAvoid(e.target.value)} placeholder="peanuts, mushrooms" />
      </label>
      <div>
        <div className="mb-1 text-sm text-muted">Tracking</div>
        <Segmented
          label="Tracking"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'full', label: 'Full (calories & macros)' },
            { value: 'lite', label: 'Lite' },
          ]}
        />
      </div>
      <Toggle checked={settings.eatBack} onChange={(v) => void saveNutritionSettings({ eatBack: v })} label="Eat back workout calories" description="Add calories burned in workouts to your daily budget" />
      <div className="flex items-center justify-between">
        <span className="font-medium">Water glass size</span>
        <Stepper value={settings.glassOz} onChange={(v) => void saveNutritionSettings({ glassOz: v })} min={4} max={32} step={2} unit="oz" label="glass size" />
      </div>
      <Button
        block
        size="lg"
        onClick={async () => {
          await updateProfile({
            diet,
            trackingMode: mode,
            avoidFoods: avoid
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean),
          })
          onDone()
        }}
      >
        Save
      </Button>
    </div>
  )
}

function VoiceEditor() {
  const v = useVoiceSettings()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => speech.listVoices())
  useEffect(() => speech.onVoices(() => setVoices(speech.listVoices())), [])
  const english = voices.filter((x) => x.lang.toLowerCase().startsWith('en'))
  return (
    <div className="space-y-2">
      <Toggle checked={v.enabled} onChange={(x) => v.update({ enabled: x })} label="Voice coach" description="Captions always show, even when muted" />
      <Toggle checked={v.countReps} onChange={(x) => v.update({ countReps: x })} label="Count my reps in tempo" description="Off = go at your own pace and tap Done" />
      <Toggle checked={v.beeps} onChange={(x) => v.update({ beeps: x })} label="Countdown beeps" />
      <Toggle checked={v.mixWithMusic} onChange={(x) => v.update({ mixWithMusic: x })} label="Play over my music" description="iPhone: keep your music playing under the coach" />
      <label className="block pt-2">
        <span className="mb-1 block text-sm text-muted">Voice</span>
        <select className={inputCls} value={v.voiceURI ?? ''} onChange={(e) => v.update({ voiceURI: e.target.value || undefined })}>
          <option value="">Best available</option>
          {english.map((x) => (
            <option key={x.voiceURI} value={x.voiceURI}>
              {x.name} ({x.lang})
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between pt-2">
        <span className="font-medium">Speaking speed</span>
        <Stepper value={v.rate} onChange={(x) => v.update({ rate: x })} min={0.6} max={1.6} step={0.1} unit="×" label="speaking speed" />
      </div>
      <Button
        block
        variant="secondary"
        className="mt-3"
        icon={<Volume2 size={16} />}
        onClick={() => {
          speech.unlock()
          void speech.speak("Let's go! Ten push-ups. Keep your body in one straight line.", { interrupt: true })
        }}
      >
        Preview voice
      </Button>
    </div>
  )
}

function DataPanel() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [photos, setPhotos] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [usage, setUsage] = useState<string | null>(null)
  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted)
    void navigator.storage?.estimate?.().then((e) => setUsage(e.usage !== undefined ? `${(e.usage / 1024 / 1024).toFixed(1)} MB used` : null))
  }, [])
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Everything lives on this phone. Export a backup now and then — especially before switching phones.</p>
      <Toggle checked={photos} onChange={setPhotos} label="Include progress photos" description="Makes the file much larger" />
      <Button
        block
        icon={<Download size={16} />}
        onClick={async () => {
          const blob = await exportBackup(photos)
          downloadBlob(blob, `forge-backup-${new Date().toISOString().slice(0, 10)}.json`)
          setMsg('Backup downloaded.')
        }}
      >
        Export backup
      </Button>
      <Button block variant="secondary" icon={<Upload size={16} />} onClick={() => fileRef.current?.click()}>
        Restore from backup
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          try {
            const b = parseBackup(await f.text())
            if (!confirm(`Replace all data on this phone with the backup from ${b.exportedAt.slice(0, 10)}?`)) return
            await restoreBackup(b)
            setMsg('Backup restored.')
            navigate('/today')
          } catch (err) {
            setMsg(err instanceof Error ? err.message : 'That file could not be read.')
          }
        }}
      />
      <div className="flex items-center gap-2 rounded-2xl bg-surface-2 p-3 text-sm">
        <Smartphone size={16} className="shrink-0 text-muted" />
        <span className="flex-1">{persisted ? 'Protected storage is on.' : 'The browser may clear data if space runs low.'}</span>
        {!persisted ? (
          <Button size="sm" variant="ghost" onClick={async () => setPersisted(await requestPersistence())}>
            Protect
          </Button>
        ) : null}
      </div>
      {usage ? <p className="text-xs text-muted">{usage}</p> : null}
      {msg ? <p className="text-sm text-good">{msg}</p> : null}
      <Button
        block
        variant="danger"
        icon={<Trash2 size={16} />}
        onClick={async () => {
          if (!confirm('Delete ALL Forge data on this phone? This cannot be undone.')) return
          await wipeAll()
          navigate('/welcome', { replace: true })
        }}
      >
        Erase everything
      </Button>
    </div>
  )
}
