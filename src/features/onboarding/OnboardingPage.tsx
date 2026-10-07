import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  Apple,
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  Flower2,
  Gamepad2,
  Heart,
  HeartPulse,
  Sparkles,
  Timer,
  TrendingUp,
  Video,
  Wind,
} from 'lucide-react'
import { APP, asset, isBloom, W } from '@/app/brand'
import { isIOS, isStandalone } from '@/app/pwa'
import { usePalette } from '@/app/theme'
import { Mannequin } from '@/anim/Mannequin'
import { getExercise, motionFor } from '@/data/exercises'
import {
  DEFAULT_EQUIPMENT,
  type DietStyle,
  type Experience,
  type Equipment,
  type Goal,
  type Lifestyle,
  type Profile,
  type ReminderStyle,
  type Sex,
} from '@/domain/types'
import { describeTarget, generateSession, mainExercises, planInputsFromProfile, programName, type FitnessTest as TestResult } from '@/engines/plan'
import { initialProgress } from '@/engines/progression/progress'
import { todayISO, WEEKDAY_SHORT } from '@/lib/dates'
import { cmToIn, inToCm, kgToLb, lbToKg } from '@/lib/units'
import { saveProfile, saveProgress } from '@/state/store'
import { requestPersistence } from '@/state/backup'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { Chip } from '@/ui/Chip'
import { cx } from '@/ui/cx'
import { Segmented } from '@/ui/Segmented'
import { Stepper } from '@/ui/Stepper'
import { burst } from '@/app/confetti'
import { sfx } from '@/device/sfx'
import { FitnessTest } from './FitnessTest'
import { Hero } from './Hero'
import { ACHES, BLOOM_ACHES, FOLD_REACH, INTENTIONS, PREGNANCY_NOTE } from './choices'
import { InstallGuide } from './InstallGuide'
import { EquipmentEditor } from '../settings/EquipmentEditor'

type Draft = Omit<Profile, 'createdAt'>

const FORGE_DRAFT: Draft = {
  name: '',
  sex: 'unspecified',
  birthYear: 1990,
  heightCm: 178,
  weightKg: 81.65,
  goal: 'general_fitness',
  experience: 'beginner',
  lifestyle: 'light',
  units: 'imperial',
  aches: [],
  diet: 'none',
  avoidFoods: [],
  daysPerWeek: 3,
  trainingDays: [1, 3, 5],
  sessionMinutes: 15,
  preferredTime: '07:00',
  equipment: DEFAULT_EQUIPMENT,
  quietMode: false,
  trackingMode: 'full',
  reminderStyle: 'gentle',
}

/** What a home yoga practice uses: a mat, a wall and a chair (no dumbbells). */
export const BLOOM_EQUIPMENT: Equipment = { dumbbells: [], chair: true, wall: true, table: false, stairs: false, pullupBar: false, mat: true }

/** Bloom starts personal: it was made for Michal (everything stays editable). */
const BLOOM_DRAFT: Draft = {
  ...FORGE_DRAFT,
  name: APP.madeFor ?? '',
  sex: 'female',
  heightCm: 165,
  weightKg: 62,
  sessionMinutes: 20,
  preferredTime: '07:30',
  equipment: BLOOM_EQUIPMENT,
  quietMode: true,
  trackingMode: 'lite',
  program: 'yoga',
  intentions: [],
}

const DEFAULT_DRAFT: Draft = isBloom ? BLOOM_DRAFT : FORGE_DRAFT

/** Spread N training days across the week (Mon-first). */
export function defaultDays(n: number): number[] {
  const presets: Record<number, number[]> = {
    1: [3],
    2: [2, 5],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
    7: [1, 2, 3, 4, 5, 6, 7],
  }
  return presets[Math.max(1, Math.min(7, n))]
}

const FORGE_STEPS = ['welcome', 'goal', 'about', 'experience', 'schedule', 'equipment', 'health', 'food', 'test', 'summary'] as const
/** Bloom asks what the practice is for, skips equipment and the push-up test. */
const BLOOM_STEPS = ['welcome', 'intentions', 'about', 'experience', 'schedule', 'health', 'food', 'summary'] as const
type Step = (typeof FORGE_STEPS)[number] | (typeof BLOOM_STEPS)[number]
const STEPS: readonly Step[] = isBloom ? BLOOM_STEPS : FORGE_STEPS

const YOGA_XP: { id: Experience; title: string; text: string }[] = [
  { id: 'beginner', title: 'New to yoga', text: 'Or coming back after a long break' },
  { id: 'intermediate', title: 'Some yoga', text: 'I know a few poses like downward dog' },
  { id: 'advanced', title: 'Regular practice', text: 'Sun salutations feel familiar' },
]

const BALANCE: { sec: number; label: string }[] = [
  { sec: 5, label: 'A few seconds' },
  { sec: 15, label: 'About 15 s' },
  { sec: 30, label: '30 s or more' },
]

const GOALS: { id: Goal; title: string; text: string; Icon: typeof Flame }[] = [
  { id: 'lose_fat', title: 'Lose fat', text: 'Burn more, eat smarter, keep your muscle', Icon: Flame },
  { id: 'build_muscle', title: 'Build muscle', text: 'Get bigger and more defined', Icon: Dumbbell },
  { id: 'get_stronger', title: 'Get stronger', text: 'Harder moves, fewer reps, real strength', Icon: TrendingUp },
  { id: 'general_fitness', title: 'Feel fit & healthy', text: 'Energy, mobility and a habit that sticks', Icon: HeartPulse },
]

const XP: { id: Experience; title: string; text: string }[] = [
  { id: 'beginner', title: 'New or coming back', text: 'Little or no regular exercise lately' },
  { id: 'intermediate', title: 'Some experience', text: 'I work out now and then, know the basics' },
  { id: 'advanced', title: 'Experienced', text: 'I train consistently and know good form' },
]

const LIFESTYLE: { id: Lifestyle; label: string; text: string }[] = [
  { id: 'sedentary', label: 'Mostly sitting', text: 'Desk job, little walking' },
  { id: 'light', label: 'Lightly active', text: 'Some walking during the day' },
  { id: 'moderate', label: 'On my feet', text: 'Lots of walking or standing' },
  { id: 'active', label: 'Very active', text: 'Physical job or very active days' },
]

const READINESS = [
  'Has a doctor ever said you have a heart condition or high blood pressure?',
  'Do you feel chest pain at rest, in daily life, or when you exercise?',
  'Have you lost balance from dizziness or passed out in the last 12 months?',
  'Do you have another chronic condition, or take medicine for one?',
  'Do you have a bone, joint or muscle problem that exercise could make worse?',
  'Has a doctor said you should only exercise under medical supervision?',
]

const DIETS: { id: DietStyle; label: string }[] = [
  { id: 'none', label: 'No restrictions' },
  { id: 'kosher', label: 'Kosher-style' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'vegan', label: 'Vegan' },
]

const MINUTES = isBloom ? [5, 10, 15, 20, 30, 45] : [5, 10, 15, 20, 30, 45, 60]

function OptionCard({ active, onClick, title, text, icon }: { active: boolean; onClick: () => void; title: string; text?: string; icon?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99]',
        active ? 'border-ember bg-ember/10' : 'border-line bg-surface hover:border-faint',
      )}
    >
      {icon ? <span className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', active ? 'bg-ember text-on-accent' : 'bg-surface-2 text-muted')}>{icon}</span> : null}
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        {text ? <span className="block text-sm text-muted">{text}</span> : null}
      </span>
      <span className={cx('grid h-6 w-6 place-items-center rounded-full border', active ? 'border-ember bg-ember text-on-accent' : 'border-line')}>
        {active ? <Check size={14} strokeWidth={3} /> : null}
      </span>
    </button>
  )
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-faint">{hint}</span> : null}
    </label>
  )
}

const inputCls = 'h-12 w-full rounded-2xl border border-line bg-surface px-4 text-ink outline-none focus:border-ember'

function NumberInput({ value, onChange, suffix, min, max, step = 1, label }: { value: number; onChange: (v: number) => void; suffix?: string; min: number; max: number; step?: number; label: string }) {
  const [text, setText] = useState(String(value))
  return (
    <div className="relative">
      <input
        aria-label={label}
        inputMode="decimal"
        className={cx(inputCls, suffix && 'pr-12')}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const v = Number(e.target.value.replace(',', '.'))
          if (Number.isFinite(v) && v >= min && v <= max) onChange(Math.round(v / step) * step)
        }}
        onBlur={() => setText(String(value))}
      />
      {suffix ? <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span> : null}
    </div>
  )
}

function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-[28px] font-bold leading-tight">{children}</h1>
      {sub ? <p className="mt-1.5 text-[15px] text-muted">{sub}</p> : null}
    </div>
  )
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const palette = usePalette()
  const [step, setStep] = useState<Step>('welcome')
  const [d, setD] = useState<Draft>(DEFAULT_DRAFT)
  const [readiness, setReadiness] = useState<boolean[]>(() => READINESS.map(() => false))
  const [agreed, setAgreed] = useState(false)
  const [test, setTest] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [avoidText, setAvoidText] = useState('')
  const [saving, setSaving] = useState(false)
  /** Bloom's gentle check-in (instead of the push-up test). */
  const [check, setCheck] = useState<{ foldReach?: number; balanceSec?: number }>({})
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const i = STEPS.indexOf(step)
  const imperial = d.units === 'imperial'
  const startTest = useMemo<TestResult | undefined>(
    () => (isBloom ? (check.foldReach !== undefined || check.balanceSec !== undefined ? { date: todayISO(), ...check } : undefined) : (test ?? undefined)),
    [check, test],
  )

  const preview = useMemo(() => {
    if (step !== 'summary') return null
    const profile: Profile = { ...d, createdAt: new Date().toISOString() }
    const progress = initialProgress(profile, startTest)
    return generateSession(planInputsFromProfile(profile), progress, { index: 0 })
  }, [step, d, startTest])

  const next = () => {
    const to = STEPS[Math.min(STEPS.length - 1, i + 1)]
    if (to === 'summary') {
      sfx.success()
      window.setTimeout(() => burst('small'), 200)
    }
    setStep(to)
  }
  const back = () => (testing ? setTesting(false) : setStep(STEPS[Math.max(0, i - 1)]))

  const canContinue = (() => {
    if (step === 'schedule') return d.trainingDays.length === d.daysPerWeek
    if (step === 'health') return agreed
    if (step === 'about') return d.birthYear >= 1930 && d.birthYear <= new Date().getFullYear() - 13
    return true
  })()

  const finish = async () => {
    setSaving(true)
    const profile: Profile = {
      ...d,
      name: d.name.trim(),
      avoidFoods: avoidText
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    }
    await saveProfile(profile)
    await saveProgress(initialProgress(profile, startTest))
    void requestPersistence()
    navigate('/today', { replace: true })
  }

  let body: ReactNode = null
  switch (step) {
    case 'welcome':
      body = (
        <>
          <div className="mt-4 flex items-center gap-3">
            <img src={asset('icons/icon-192.png')} alt="" className="h-14 w-14 rounded-2xl" />
            <div>
              <div className="font-display text-3xl font-bold">{APP.name}</div>
              <div className="text-muted">{APP.tagline}</div>
            </div>
          </div>
          {APP.madeFor ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-ember">
              <Heart size={15} className="fill-current" /> Made with love for {APP.madeFor}
            </p>
          ) : null}
          <Hero />
          <ul className="mt-6 space-y-4">
            {(isBloom
              ? [
                  { Icon: Flower2, t: 'Gentle yoga that fits your day', s: 'Short, calm practices built around your minutes, your body and how you want to feel.' },
                  { Icon: Video, t: 'Every pose shown and spoken', s: 'Animated guides and a soft voice that times each hold, so you can close your eyes.' },
                  { Icon: Wind, t: 'Breathe and unwind', s: 'Guided breathing, a body scan and a bedtime wind-down.' },
                  { Icon: Apple, t: 'Nourish, lightly', s: 'Water, veggies and protein, or full food tracking if you ever want it.' },
                  { Icon: Bell, t: 'Kind reminders', s: 'Gentle nudges for your practice, water and winding down.' },
                ]
              : [
                  { Icon: Timer, t: 'Workouts that fit your day', s: 'A plan built around your minutes, your dumbbells and your body.' },
                  { Icon: Video, t: 'Animated, voiced coaching', s: 'Every exercise demonstrated, explained and counted out loud.' },
                  { Icon: Gamepad2, t: 'Games, quests and rewards', s: 'Spin the wheel, deck-of-cards workouts, daily quests, XP and badges.' },
                  { Icon: Apple, t: 'Eat better without the grind', s: 'Calories, protein, quick meal plans and helpful nudges.' },
                  { Icon: Bell, t: 'Reminders that keep you going', s: 'Gentle nudges for workouts, meals, water and streaks.' },
                ]
            ).map(({ Icon, t, s }, k) => (
              <li key={t} className="flex animate-fade-up gap-3" style={{ animationDelay: `${150 + k * 80}ms` }}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ember/15 text-ember">
                  <Icon size={20} />
                </span>
                <span>
                  <span className="block font-semibold">{t}</span>
                  <span className="block text-sm text-muted">{s}</span>
                </span>
              </li>
            ))}
          </ul>
          {!isStandalone() && isIOS() ? (
            <div className="mt-8">
              <InstallGuide />
              <p className="mt-2 text-center text-xs text-faint">Set up in the Home Screen app: Safari and the installed app keep separate data.</p>
            </div>
          ) : (
            <div className="mt-8">
              <InstallGuide compact />
            </div>
          )}
        </>
      )
      break
    case 'intentions':
      body = (
        <>
          <Title sub="Pick as many as you like. Your weekly practices will lean toward them.">What would you like from your practice?</Title>
          <div className="grid grid-cols-2 gap-2">
            {INTENTIONS.map((x) => {
              const on = (d.intentions ?? []).includes(x.id)
              return (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set('intentions', on ? (d.intentions ?? []).filter((y) => y !== x.id) : [...(d.intentions ?? []), x.id])}
                  className={cx('pressable flex items-center gap-2.5 rounded-2xl border p-3.5 text-left', on ? 'border-ember bg-ember/10' : 'border-line bg-surface')}
                >
                  <span className="text-2xl" aria-hidden>
                    {x.emoji}
                  </span>
                  <span className="flex-1 font-semibold leading-tight">{x.title}</span>
                  {on ? <Check size={16} strokeWidth={3} className="shrink-0 text-ember" /> : null}
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-sm text-muted">Every practice stays gentle: no jumping, no rushing, and an easier option for every pose.</p>
        </>
      )
      break
    case 'goal':
      body = (
        <>
          <Title sub="We'll shape your training and nutrition around it.">What's your main goal?</Title>
          <div className="space-y-3">
            {GOALS.map((g) => (
              <OptionCard key={g.id} active={d.goal === g.id} onClick={() => set('goal', g.id)} title={g.title} text={g.text} icon={<g.Icon size={22} />} />
            ))}
          </div>
        </>
      )
      break
    case 'about':
      body = (
        <>
          <Title sub={isBloom ? 'Used for your water and food targets. It stays on your phone.' : 'Used for calorie targets and calories burned. It stays on your phone.'}>About you</Title>
          <div className="space-y-4">
            <Field label="First name (optional)">
              <input className={inputCls} value={d.name} onChange={(e) => set('name', e.target.value)} autoComplete="given-name" placeholder={isBloom ? 'What should Lila call you?' : 'What should your coach call you?'} />
            </Field>
            <Field label="Units">
              <Segmented
                label="Units"
                value={d.units}
                onChange={(v) => set('units', v)}
                options={[
                  { value: 'imperial', label: 'lb · ft' },
                  { value: 'metric', label: 'kg · cm' },
                ]}
              />
            </Field>
            <Field label="Sex" hint="Only used for the calorie formula.">
              <Segmented<Sex>
                label="Sex"
                value={d.sex}
                onChange={(v) => set('sex', v)}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'unspecified', label: 'Prefer not' },
                ]}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Birth year">
                <NumberInput label="Birth year" value={d.birthYear} onChange={(v) => set('birthYear', v)} min={1930} max={new Date().getFullYear() - 13} />
              </Field>
              <Field label="Weight">
                {imperial ? (
                  <NumberInput key="lb" label="Weight in pounds" value={Math.round(kgToLb(d.weightKg))} onChange={(v) => set('weightKg', lbToKg(v))} min={70} max={600} suffix="lb" />
                ) : (
                  <NumberInput key="kg" label="Weight in kilograms" value={Math.round(d.weightKg)} onChange={(v) => set('weightKg', v)} min={30} max={280} suffix="kg" />
                )}
              </Field>
            </div>
            <Field label="Height">
              {imperial ? (
                <div className="grid grid-cols-2 gap-3">
                  <NumberInput key="ft" label="Height feet" value={Math.floor(Math.round(cmToIn(d.heightCm)) / 12)} onChange={(ft) => set('heightCm', inToCm(ft * 12 + (Math.round(cmToIn(d.heightCm)) % 12)))} min={3} max={8} suffix="ft" />
                  <NumberInput key="in" label="Height inches" value={Math.round(cmToIn(d.heightCm)) % 12} onChange={(inch) => set('heightCm', inToCm(Math.floor(Math.round(cmToIn(d.heightCm)) / 12) * 12 + inch))} min={0} max={11} suffix="in" />
                </div>
              ) : (
                <NumberInput key="cm" label="Height in centimeters" value={Math.round(d.heightCm)} onChange={(v) => set('heightCm', v)} min={120} max={230} suffix="cm" />
              )}
            </Field>
            {d.goal === 'lose_fat' || d.goal === 'build_muscle' ? (
              <Field label="Goal weight (optional)">
                {imperial ? (
                  <NumberInput key="glb" label="Goal weight in pounds" value={Math.round(kgToLb(d.goalWeightKg ?? d.weightKg))} onChange={(v) => set('goalWeightKg', lbToKg(v))} min={70} max={600} suffix="lb" />
                ) : (
                  <NumberInput key="gkg" label="Goal weight in kilograms" value={Math.round(d.goalWeightKg ?? d.weightKg)} onChange={(v) => set('goalWeightKg', v)} min={30} max={280} suffix="kg" />
                )}
              </Field>
            ) : null}
          </div>
        </>
      )
      break
    case 'experience':
      body = (
        <>
          <Title sub={isBloom ? 'There’s no wrong answer. Bloom starts gently and grows with you.' : 'Be honest — starting easy and climbing fast beats starting hard and quitting.'}>Where are you starting?</Title>
          <div className="space-y-3">
            {(isBloom ? YOGA_XP : XP).map((x) => (
              <OptionCard key={x.id} active={d.experience === x.id} onClick={() => set('experience', x.id)} title={x.title} text={x.text} />
            ))}
          </div>
          {isBloom ? (
            <>
              <div className="mt-6 mb-1 text-sm font-medium text-muted">Quick check-in (optional)</div>
              <p className="mb-2 text-xs text-faint">Fold forward gently with soft knees. Where do your fingertips reach?</p>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {FOLD_REACH.map((label, k) => (
                  <Chip key={label} active={check.foldReach === k} onClick={() => setCheck((c) => ({ ...c, foldReach: c.foldReach === k ? undefined : k }))}>
                    {label}
                  </Chip>
                ))}
              </div>
              <p className="mt-4 mb-2 text-xs text-faint">Standing on one foot (near a wall), how long can you stay steady?</p>
              <div className="flex flex-wrap gap-2">
                {BALANCE.map((b) => (
                  <Chip key={b.sec} active={check.balanceSec === b.sec} onClick={() => setCheck((c) => ({ ...c, balanceSec: c.balanceSec === b.sec ? undefined : b.sec }))}>
                    {b.label}
                  </Chip>
                ))}
              </div>
            </>
          ) : null}
          <div className="mt-6 mb-2 text-sm font-medium text-muted">Outside of workouts, your days are…</div>
          <div className="grid grid-cols-2 gap-2">
            {LIFESTYLE.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => set('lifestyle', l.id)}
                aria-pressed={d.lifestyle === l.id}
                className={cx('rounded-2xl border p-3 text-left', d.lifestyle === l.id ? 'border-ember bg-ember/10' : 'border-line bg-surface')}
              >
                <div className="text-sm font-semibold">{l.label}</div>
                <div className="text-xs text-muted">{l.text}</div>
              </button>
            ))}
          </div>
        </>
      )
      break
    case 'schedule':
      body = (
        <>
          <Title sub={isBloom ? 'A little, often, is the heart of yoga. You can change this any time.' : 'Short and consistent wins. You can change this any time.'}>How much time do you have?</Title>
          <div className="mb-2 text-sm font-medium text-muted">Minutes per {W.workout}</div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {MINUTES.map((m) => (
              <Chip key={m} active={d.sessionMinutes === m} onClick={() => set('sessionMinutes', m)}>
                {m} min
              </Chip>
            ))}
          </div>
          <div className="mt-6 mb-2 text-sm font-medium text-muted">{W.Workout}s per week</div>
          <Stepper
            value={d.daysPerWeek}
            min={1}
            max={6}
            label={`${W.workouts} per week`}
            onChange={(v) => setD((x) => ({ ...x, daysPerWeek: v, trainingDays: defaultDays(v) }))}
          />
          <div className="mt-6 mb-2 text-sm font-medium text-muted">
            Which days? <span className="text-faint">(pick {d.daysPerWeek})</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_SHORT.map((w, k) => {
              const day = k + 1
              const on = d.trainingDays.includes(day)
              return (
                <button
                  key={w}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    const has = d.trainingDays.includes(day)
                    let days = has ? d.trainingDays.filter((x) => x !== day) : [...d.trainingDays, day].sort()
                    if (!has && days.length > d.daysPerWeek) days = days.filter((x) => x !== d.trainingDays[0])
                    set('trainingDays', days)
                  }}
                  className={cx('h-12 rounded-xl border text-sm font-semibold', on ? 'border-ember bg-ember text-on-accent' : 'border-line bg-surface text-muted')}
                >
                  {w.slice(0, 2)}
                </button>
              )
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Field label={`Usual ${W.workout} time`}>
              <input type="time" className={inputCls} value={d.preferredTime} onChange={(e) => set('preferredTime', e.target.value || '07:00')} />
            </Field>
            <Field label="Reminders">
              <select className={inputCls} value={d.reminderStyle} onChange={(e) => set('reminderStyle', e.target.value as ReminderStyle)}>
                <option value="gentle">Gentle (~3/day)</option>
                <option value="coach">Coach (~7/day)</option>
                <option value="off">Off</option>
              </select>
            </Field>
          </div>
          <p className="mt-2 text-xs text-faint">After setup, one tap puts them in your phone's calendar, no account needed. Fine-tune them anytime in Settings (the gear on Today) → Reminders.</p>
        </>
      )
      break
    case 'equipment':
      body = (
        <>
          <Title sub="Your plan only uses what you have. Found the heavier dumbbell later? Flip it on in settings.">Your equipment</Title>
          <EquipmentEditor equipment={d.equipment} quietMode={!!d.quietMode} onChange={(e) => set('equipment', e)} onQuietMode={(v) => set('quietMode', v)} />
        </>
      )
      break
    case 'health':
      body = (
        <>
          <Title sub={isBloom ? 'Bloom will skip or soften poses that could bother them.' : "We'll skip or soften moves that could aggravate them."}>
            {isBloom ? 'Anything to be gentle with?' : 'Anything that aches?'}
          </Title>
          <div className="flex flex-wrap gap-2">
            {(isBloom ? BLOOM_ACHES : ACHES).map((a) => {
              const on = d.aches.includes(a.id)
              return (
                <Chip key={a.id} active={on} onClick={() => set('aches', on ? d.aches.filter((x) => x !== a.id) : [...d.aches, a.id])}>
                  {a.label}
                </Chip>
              )
            })}
            <Chip active={d.aches.length === 0} onClick={() => set('aches', [])}>
              Nothing, I'm good
            </Chip>
          </div>
          {isBloom ? (
            <>
              <button
                type="button"
                aria-pressed={d.aches.includes('pregnancy')}
                onClick={() => set('aches', d.aches.includes('pregnancy') ? d.aches.filter((x) => x !== 'pregnancy') : [...d.aches, 'pregnancy'])}
                className={cx('mt-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left', d.aches.includes('pregnancy') ? 'border-ember bg-ember/10' : 'border-line bg-surface')}
              >
                <span className="text-2xl" aria-hidden>
                  🤰
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">I’m pregnant</span>
                  <span className="block text-sm text-muted">Practices skip belly-down poses, deep twists and core work on your back.</span>
                </span>
                <span className={cx('grid h-6 w-6 place-items-center rounded-full border', d.aches.includes('pregnancy') ? 'border-ember bg-ember text-on-accent' : 'border-line')}>
                  {d.aches.includes('pregnancy') ? <Check size={14} strokeWidth={3} /> : null}
                </span>
              </button>
              {d.aches.includes('pregnancy') ? (
                <Card className="mt-2 border-amber/40 bg-amber/10 text-sm">
                  {PREGNANCY_NOTE}
                </Card>
              ) : null}
            </>
          ) : null}
          <div className="mt-7 mb-2 font-semibold">Quick safety check</div>
          <Card className="divide-y divide-line/70 p-0">
            {READINESS.map((q, k) => (
              <div key={q} className="flex items-center gap-3 px-4 py-3">
                <span className="flex-1 text-sm">{q}</span>
                <Segmented
                  label={q}
                  className="w-[7.5rem]"
                  value={readiness[k] ? 'yes' : 'no'}
                  onChange={(v) => setReadiness((r) => r.map((x, j) => (j === k ? v === 'yes' : x)))}
                  options={[
                    { value: 'no', label: 'No' },
                    { value: 'yes', label: 'Yes' },
                  ]}
                />
              </div>
            ))}
          </Card>
          {readiness.some(Boolean) ? (
            <Card className="mt-3 border-amber/40 bg-amber/10 text-sm">
              <b>Please check with your doctor before starting.</b> Share what you'll be doing ({isBloom ? 'short, gentle yoga practices' : 'short bodyweight and light dumbbell workouts'}). Until then, we
              suggest keeping every session easy and stopping at any warning sign.
            </Card>
          ) : null}
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--color-ember)]" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span className="text-muted">
              I understand {APP.name} gives general {isBloom ? 'wellbeing' : 'fitness'} guidance, not medical advice. I'll stop if I feel pain, dizziness, chest discomfort or shortness of
              breath.
            </span>
          </label>
        </>
      )
      break
    case 'food':
      body = (
        <>
          <Title sub={isBloom ? 'Recipes and meal ideas will follow it.' : 'Meal plans and suggestions will follow it.'}>How do you eat?</Title>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((x) => (
              <Chip key={x.id} active={d.diet === x.id} onClick={() => set('diet', x.id)}>
                {x.label}
              </Chip>
            ))}
          </div>
          {d.diet === 'kosher' ? <p className="mt-2 text-sm text-muted">No pork or shellfish, and meat and dairy never in the same meal.</p> : null}
          <div className="mt-6">
            <Field label="Foods to avoid (optional)" hint="Comma separated, e.g. peanuts, mushrooms">
              <input className={inputCls} value={avoidText} onChange={(e) => setAvoidText(e.target.value)} placeholder="peanuts, mushrooms" />
            </Field>
          </div>
          <div className="mt-6 mb-2 text-sm font-medium text-muted">Tracking style</div>
          {isBloom ? (
            <div className="space-y-3">
              <OptionCard active={d.trackingMode === 'lite'} onClick={() => set('trackingMode', 'lite')} title="Light touch" text="Just water, veggies and protein, no calorie counting" />
              <OptionCard active={d.trackingMode === 'full'} onClick={() => set('trackingMode', 'full')} title="Full" text="Calories, protein, carbs and fat" />
            </div>
          ) : (
            <div className="space-y-3">
              <OptionCard active={d.trackingMode === 'full'} onClick={() => set('trackingMode', 'full')} title="Full" text="Calories, protein, carbs and fat" />
              <OptionCard active={d.trackingMode === 'lite'} onClick={() => set('trackingMode', 'lite')} title="Lite" text="Just protein, veggies and water — low effort" />
            </div>
          )}
        </>
      )
      break
    case 'test':
      body = testing ? (
        <FitnessTest
          onDone={(r) => {
            setTest(r)
            setTesting(false)
          }}
        />
      ) : (
        <>
          <Title sub="Three quick checks set the right starting level for every exercise. About 3 minutes.">Quick fitness test</Title>
          {test ? (
            <Card>
              <div className="font-semibold">Your results</div>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                <li>Push-ups: {test.pushups ?? 'skipped'}</li>
                <li>Squats in 60 s: {test.squats60 ?? 'skipped'}</li>
                <li>Plank: {test.plankSec !== undefined ? `${test.plankSec} s` : 'skipped'}</li>
              </ul>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setTesting(true)}>
                Redo the test
              </Button>
            </Card>
          ) : (
            <Card className="flex items-start gap-3">
              <Sparkles className="mt-0.5 shrink-0 text-ember" size={22} />
              <div className="text-sm text-muted">
                Recommended. Clear a little floor space and turn your sound on — Forge counts and times for you. We'll repeat it every four weeks so you
                can see how far you've come.
              </div>
            </Card>
          )}
          {!test ? (
            <div className="mt-5 space-y-2">
              <Button block size="lg" onClick={() => setTesting(true)}>
                Start the test
              </Button>
              <Button block variant="ghost" onClick={next}>
                Skip — use my experience level
              </Button>
            </div>
          ) : null}
        </>
      )
      break
    case 'summary': {
      const s = preview!
      body = (
        <>
          <div className="mb-1 text-4xl animate-bounce-in">🎉</div>
          <Title sub={`${programName(planInputsFromProfile({ ...d, createdAt: '' }))} · ${d.daysPerWeek}× a week · ${d.sessionMinutes} min`}>
            {d.name.trim() ? `${d.name.trim()}, your ${isBloom ? 'practice' : 'plan'} is ready` : `Your ${isBloom ? 'practice' : 'plan'} is ready`}
          </Title>
          <Card>
            <div className="flex items-center gap-2 text-sm text-muted">
              <CalendarDays size={16} /> {d.trainingDays.map((x) => WEEKDAY_SHORT[x - 1]).join(' · ')} at {d.preferredTime}
            </div>
            <div className="mt-3 font-display text-xl font-bold">First up: {s.title}</div>
            <div className="text-sm text-muted">
              {s.minutes} min{isBloom ? ` · ${mainExercises(s).length} poses` : ` · ~${s.estKcal} kcal`}
            </div>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {mainExercises(s)
                .slice(0, 6)
                .map((it) => {
                  const ex = getExercise(it.exerciseId)!
                  return (
                    <li key={it.exerciseId} className="animate-pop rounded-xl bg-bg p-1.5">
                      <Mannequin motion={motionFor(ex)} palette={palette} speed={0.8} className="aspect-[4/3] w-full" title={ex.name} />
                      <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-tight">{ex.name}</div>
                      <div className="text-[11px] text-muted">{describeTarget(it)}</div>
                    </li>
                  )
                })}
            </ul>
          </Card>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {(isBloom
              ? [
                  `Every practice fits your ${d.sessionMinutes} minutes, from arriving on your mat to the final rest.`,
                  'Holds lengthen and poses deepen gently, only when you’re ready.',
                  'Missed a day? Your practice simply waits for you.',
                ]
              : [
                  `Every session fits your ${d.sessionMinutes} minutes, warm-up and cool-down included.`,
                  "Reps go up as you get stronger; moves level up when you're ready.",
                  'Missed a day? The plan just picks up where you left off.',
                ]
            ).map((t) => (
              <li key={t} className="flex gap-2">
                <Check size={18} className="shrink-0 text-good" /> {t}
              </li>
            ))}
          </ul>
        </>
      )
      break
    }
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 safe-top">
      {step !== 'welcome' ? (
        <div className="sticky top-0 z-10 -mx-4 bg-bg/90 px-4 pt-3 pb-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Back" onClick={back} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
              <ArrowLeft size={22} />
            </button>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length - 1} aria-valuenow={i} aria-label="Setup progress">
              <div className="h-full rounded-full bg-gradient-to-r from-ember to-amber transition-[width] duration-500" style={{ width: `${(i / (STEPS.length - 1)) * 100}%` }} />
            </div>
            <span className="w-9 text-right text-xs font-semibold text-muted tabular">
              {i}/{STEPS.length - 1}
            </span>
          </div>
        </div>
      ) : null}
      <div className="flex-1 pb-6 pt-2" key={step}>
        <div className="animate-[fade-up_.25s_ease-out]">{body}</div>
      </div>
      {!(step === 'test' && (testing || !test)) ? (
        <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-bg via-bg to-bg/0 px-4 pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          {step === 'summary' ? (
            <Button block size="lg" onClick={() => void finish()} disabled={saving}>
              {isBloom ? 'Begin my practice' : 'Start my plan'}
            </Button>
          ) : (
            <Button block size="lg" onClick={next} disabled={!canContinue}>
              {step === 'welcome' ? (isBloom ? 'Let’s begin' : "Let's build your plan") : 'Continue'}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
