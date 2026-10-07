import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { usePalette } from '@/app/theme'
import { getExercise, motionFor } from '@/data/exercises'
import { LADDERS } from '@/engines/plan'
import { Card, SectionTitle } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { InstallGuide } from '../onboarding/InstallGuide'

interface Section {
  id: string
  emoji: string
  title: string
  points: string[]
  cta?: { label: string; to: string }
}

const SECTIONS: Section[] = [
  {
    id: 'plan',
    emoji: '🗓️',
    title: 'Your plan',
    points: [
      'Forge builds your week from your goal, your training days and how many minutes you have.',
      'Workouts form a queue. Miss a day and the next workout simply waits for you; nothing is “failed”.',
      'Every fourth week is lighter so your body can catch up and come back stronger.',
    ],
    cta: { label: 'See this week', to: '/train' },
  },
  {
    id: 'learn',
    emoji: '🎬',
    title: 'Learn any move',
    points: [
      'Every exercise has an animated, voiced tutorial: setup, the movement, breathing, common mistakes, and easier or harder versions.',
      'The working muscles glow in your accent color, so you know where you should feel it.',
    ],
    cta: { label: 'Open the exercise library', to: '/train/library' },
  },
  {
    id: 'player',
    emoji: '▶️',
    title: 'The workout player',
    points: [
      'The voice coach counts your reps in tempo and the timers run themselves. Pick Hype, Calm, Drill sergeant or Zen.',
      'Done finishes a set early, the arrows skip or go back, and you can fix your reps during the rest.',
      'At the end, say how it felt. Too easy or too hard, and the next workout adapts.',
    ],
  },
  {
    id: 'levels',
    emoji: '🪜',
    title: 'Moves that level up',
    points: [
      'Each movement has a ladder from easiest to hardest. Hit the top of your rep range and you climb a rung.',
      'Struggling? You step back a rung. Your fixed dumbbells never limit you: tempo, pauses and harder variations keep it challenging.',
    ],
    cta: { label: 'Your levels', to: '/train' },
  },
  {
    id: 'quests',
    emoji: '✅',
    title: 'Daily quests',
    points: [
      'Three small goals every day: one to move, one to eat well and a bonus.',
      'They complete themselves when you do the thing. Finish all three for a perfect-day bonus.',
    ],
    cta: { label: 'Today’s quests', to: '/today' },
  },
  {
    id: 'rewards',
    emoji: '⭐',
    title: 'XP, levels and badges',
    points: [
      'Workouts, quests, games, logging and goals all earn XP. Level up to unlock new accent colors.',
      'Collect 40 achievements, from your first rep to a full deck of cards.',
      'Streaks count weeks you hit your workout goal. Four good weeks earn a freeze that covers a missed week.',
    ],
    cta: { label: 'Your achievements', to: '/progress' },
  },
  {
    id: 'play',
    emoji: '🎮',
    title: 'Play',
    points: [
      'Spin the wheel for a random move (spins in a row earn a combo).',
      'Deck of cards: the suit picks the move, the number is the reps.',
      'Record challenges: plank, push-ups, squats and more. Beat your personal best.',
    ],
    cta: { label: 'Go to Play', to: '/play' },
  },
  {
    id: 'eat',
    emoji: '🍽️',
    title: 'Eating better',
    points: [
      'Log with search, recents, a barcode scan, or let Claude estimate a meal from a photo.',
      'Plan a week of quick meals that hit your calories and protein, with a grocery list.',
      'Lite mode tracks just protein, veggies and water for low-effort days.',
    ],
    cta: { label: 'Open Eat', to: '/eat' },
  },
  {
    id: 'reminders',
    emoji: '🔔',
    title: 'Reminders',
    points: [
      'Workout, meal, water and streak nudges reach your phone even when Forge is closed.',
      'Turn them on once in Settings → Reminders. You’ll need your access code the first time.',
    ],
    cta: { label: 'Reminders', to: '/more/reminders' },
  },
  {
    id: 'claude',
    emoji: '🤖',
    title: 'Ask Claude',
    points: ['Ask training or food questions in your own Claude app, with a summary of your plan so the answer fits you. Nothing is sent until you press send in Claude.'],
    cta: { label: 'Ask Claude', to: '/coach' },
  },
]

const FAQ = [
  { q: 'I only have a few minutes. What do I do?', a: 'Use “Short on time?” on Today for a 5 or 10-minute version of your workout, or a 3-minute snack. Spin the wheel in Play for a single move.' },
  { q: 'Something hurts.', a: 'Stop that exercise. Tap the swap icon next to it in the workout preview for an alternative, and add the ache in Settings → Aches & limits so Forge avoids it. Sharp or lasting pain is a reason to see a professional.' },
  { q: 'I found my heavier dumbbell.', a: 'Settings → Equipment, switch it on. Goblet squats and one-arm rows will use it.' },
  { q: 'Can I change my days or session length?', a: 'Yes: Settings → Schedule. Your progress and levels stay as they are.' },
  { q: 'The voice coach is silent.', a: 'On iPhone check the silent switch and volume. In Settings → Voice & sounds make sure the voice coach is on, and pick a voice. Captions always show either way.' },
  { q: 'Where is my data?', a: 'Only on this phone. Export a backup now and then from Settings → Backup & data, and restore it on a new phone.' },
]

export default function GuidePage() {
  const palette = usePalette()
  const { hash } = useLocation()
  const [open, setOpen] = useState<number | null>(null)
  const ladder = LADDERS.h_push.exercises.slice(0, 4).map((id) => getExercise(id)!)

  useEffect(() => {
    if (!hash) return
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <>
      <PageHeader title="How Forge works" subtitle="Two minutes to get the most out of it" back />
      <div className="px-4">
        <nav aria-label="Topics" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#/guide#${s.id}`} onClick={(e) => (e.preventDefault(), document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
              {s.emoji} {s.title}
            </a>
          ))}
        </nav>

        <div className="mt-3 space-y-3">
          {SECTIONS.map((s) => (
            <Card key={s.id} id={s.id} className="scroll-mt-24">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-2xl">{s.emoji}</span>
                <h2 className="font-display text-xl font-bold">{s.title}</h2>
              </div>
              <ul className="mt-3 space-y-2">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2 text-[15px] text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {s.id === 'levels' ? (
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {ladder.map((ex, i) => (
                    <div key={ex.id} className="rounded-xl bg-bg p-1 text-center">
                      <Mannequin motion={motionFor(ex)} palette={palette} speed={0.8} className="aspect-[4/3] w-full" title={ex.name} />
                      <div className="mt-0.5 text-[10px] font-semibold leading-tight text-muted">
                        {i + 1}. {ex.name}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              {s.cta ? (
                <Link to={s.cta.to} viewTransition className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ember">
                  {s.cta.label} <ChevronRight size={16} />
                </Link>
              ) : null}
            </Card>
          ))}
        </div>

        <div id="install" className="mt-3 scroll-mt-24">
          <InstallGuide />
        </div>

        <SectionTitle>Questions</SectionTitle>
        <Card className="divide-y divide-line/60 py-1">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center gap-3 py-3 text-left">
                <span className="flex-1 font-medium">{f.q}</span>
                <ChevronDown size={18} className={cx('shrink-0 text-faint transition', open === i && 'rotate-180')} />
              </button>
              {open === i ? <p className="animate-fade-up pb-3 text-sm text-muted">{f.a}</p> : null}
            </div>
          ))}
        </Card>
        <div className="h-6" />
      </div>
    </>
  )
}
