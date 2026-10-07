import { Check, Lock, Monitor, Moon, Sun } from 'lucide-react'
import { COACH_STYLES, usePrefs, type CoachStyle, type MotionPref } from '@/app/prefs'
import { ACCENTS, useTheme, type ThemeMode } from '@/app/theme'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { useLevel } from '@/state/gamification'
import { cx } from '@/ui/cx'
import { MASCOT_GEAR, Mascot } from '@/ui/Mascot'
import { Segmented } from '@/ui/Segmented'
import { Toggle } from '@/ui/Toggle'
import { unlockAudio } from '@/voice/beeps'
import { speech } from '@/voice/speech'

const MODES: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'auto', label: 'Auto', Icon: Monitor },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'light', label: 'Light', Icon: Sun },
]

/** Theme, accent color, coach personality and the little extras (sounds, vibration, confetti). */
export function FeelPanel() {
  const { mode, setMode, accent, setAccent, theme } = useTheme()
  const prefs = usePrefs()
  const level = useLevel()?.level ?? 1
  return (
    <div>
      <div className="text-sm font-medium text-muted">Theme</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {MODES.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => {
              setMode(value)
              haptic('light')
            }}
            className={cx('pressable flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border text-sm font-medium', mode === value ? 'border-ember bg-ember/10 text-ember' : 'border-line bg-surface-2 text-muted')}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted">Accent color</span>
        <span className="text-xs text-faint">Level up to unlock more</span>
      </div>
      <div className="mt-2 grid grid-cols-6 gap-2">
        {ACCENTS.map((a) => {
          const locked = level < a.unlockLevel
          const on = accent === a.id
          const color = theme === 'light' ? a.light : a.dark
          return (
            <button
              key={a.id}
              type="button"
              disabled={locked}
              aria-pressed={on}
              aria-label={locked ? `${a.name}, unlocks at level ${a.unlockLevel}` : a.name}
              onClick={() => {
                setAccent(a.id)
                haptic('medium')
                sfx.pop()
              }}
              className="pressable flex flex-col items-center gap-1 disabled:opacity-100"
            >
              <span
                className={cx('grid h-11 w-11 place-items-center rounded-full transition', on ? 'ring-2 ring-offset-2 ring-offset-surface' : '', locked && 'opacity-35 grayscale')}
                style={{ background: color, ['--tw-ring-color' as string]: color }}
              >
                {on ? <Check size={20} strokeWidth={3} className="text-black/70" /> : locked ? <Lock size={15} className="text-black/60" /> : null}
              </span>
              <span className={cx('text-[11px]', on ? 'font-semibold text-ink' : 'text-muted')}>{locked ? `Lv ${a.unlockLevel}` : a.name}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted">Ember’s gear</span>
        <span className="text-xs text-faint">Earn more by leveling up</span>
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ id: null, name: 'None', level: 1 } as const, ...MASCOT_GEAR].map((g) => {
          const locked = level < g.level
          const on = prefs.gear === g.id
          return (
            <button
              key={g.name}
              type="button"
              disabled={locked}
              aria-pressed={on}
              aria-label={locked ? `${g.name}, unlocks at level ${g.level}` : g.name}
              onClick={() => {
                prefs.update({ gear: g.id })
                haptic('light')
                sfx.pop()
              }}
              className={cx('pressable flex w-[72px] shrink-0 flex-col items-center rounded-2xl border px-1 py-2', on ? 'border-ember bg-ember/10' : 'border-line bg-surface-2', locked && 'opacity-50')}
            >
              <span className="relative">
                <Mascot gear={g.id} mood="happy" size={40} className={locked ? 'grayscale' : ''} />
                {locked ? <Lock size={14} className="absolute -right-1 -bottom-1 text-muted" /> : null}
              </span>
              <span className={cx('mt-1 truncate text-[11px]', on ? 'font-semibold text-ember' : 'text-muted')}>{locked ? `Lv ${g.level}` : g.name}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 text-sm font-medium text-muted">Coach personality</div>
      <p className="text-xs text-faint">How the voice coach talks to you during workouts.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {COACH_STYLES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={prefs.coach === c.id}
            onClick={() => {
              prefs.update({ coach: c.id as CoachStyle })
              haptic('light')
              unlockAudio()
              speech.unlock()
              void speech.speak(c.sample, { interrupt: true })
            }}
            className={cx('pressable rounded-2xl border p-3 text-left', prefs.coach === c.id ? 'border-ember bg-ember/10' : 'border-line bg-surface-2')}
          >
            <div className="text-2xl">{c.emoji}</div>
            <div className={cx('mt-1 font-semibold', prefs.coach === c.id && 'text-ember')}>{c.name}</div>
            <div className="text-xs text-muted">{c.blurb}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-line/60">
        <Toggle
          checked={prefs.sounds}
          onChange={(x) => {
            prefs.update({ sounds: x })
            if (x) {
              unlockAudio()
              sfx.success()
            }
          }}
          label="Sound effects"
          description="Little sounds for sets, quests and level-ups"
        />
        <Toggle
          checked={prefs.haptics}
          onChange={(x) => {
            prefs.update({ haptics: x })
            if (x) haptic('success')
          }}
          label="Vibration"
          description="Buzz on taps and wins (on iPhone: iOS 18 or later)"
        />
        <Toggle checked={prefs.celebrations} onChange={(x) => prefs.update({ celebrations: x })} label="Confetti & celebrations" description="Full-screen parties for level-ups and records. Off: small notes instead" />
      </div>
      <div className="mt-3 text-sm font-medium text-muted">Animations</div>
      <Segmented<MotionPref>
        label="Animations"
        className="mt-2"
        value={prefs.motion}
        onChange={(m) => prefs.update({ motion: m })}
        options={[
          { value: 'system', label: 'Phone setting' },
          { value: 'full', label: 'Full' },
          { value: 'reduced', label: 'Reduced' },
        ]}
      />
    </div>
  )
}
