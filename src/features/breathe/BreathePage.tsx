import { Link } from 'react-router'
import { ChevronRight, Coffee, Moon, Sunrise, Wind } from 'lucide-react'
import { BREATHS, RELAXATIONS } from '@/engines/breath'
import type { MiniFlowKind } from '@/engines/plan'
import { useMindfulMinutesThisWeek } from '@/state/breathe'
import { Card, SectionTitle } from '@/ui/Card'
import { PageHeader } from '@/ui/PageHeader'

const FLOWS: { kind: MiniFlowKind; title: string; text: string; Icon: typeof Sunrise }[] = [
  { kind: 'wake', title: 'Wake-up flow', text: 'Arms up, fold, a little balance', Icon: Sunrise },
  { kind: 'desk', title: 'Desk stretch', text: 'Neck, shoulders and side body', Icon: Coffee },
  { kind: 'unwind', title: 'Wind-down', text: 'Child’s pose, hips and legs up the wall', Icon: Moon },
]

/** Bloom's calm corner: paced breathing, guided relaxation and short stretches. */
export default function BreathePage() {
  const mindful = useMindfulMinutesThisWeek()
  return (
    <>
      <PageHeader title="Breathe" subtitle={mindful ? `${mindful} mindful minutes this week` : 'A few slow breaths change how you feel'} />
      <div className="px-4">
        <Link to="/breathe/calm?min=1" viewTransition className="pressable block">
          <Card className="relative overflow-hidden border-teal/40 bg-gradient-to-br from-teal/20 via-surface to-surface">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-teal">One minute</div>
                <div className="mt-1 font-display text-2xl font-bold">Quick calm</div>
                <p className="mt-1 text-sm text-muted">Breathe in for four, out for six. A reset you can do anywhere.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal">
                  Start <ChevronRight size={16} />
                </span>
              </div>
              <div className="relative grid h-24 w-24 shrink-0 place-items-center" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-teal/25 animate-breath" />
                <span className="absolute inset-4 rounded-full bg-teal/35 animate-breath [animation-delay:400ms]" />
                <Wind className="relative text-teal" size={28} />
              </div>
            </div>
          </Card>
        </Link>

        <SectionTitle>Breathing</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {BREATHS.map((b) => (
            <Link key={b.id} to={`/breathe/${b.id}`} viewTransition className="pressable">
              <Card className="h-full p-3">
                <span className="text-3xl" aria-hidden>
                  {b.emoji}
                </span>
                <div className="mt-2 font-semibold leading-tight">{b.name}</div>
                <div className="text-xs text-muted">{b.purpose}</div>
                <div className="mt-1.5 text-[11px] font-medium text-faint tabular">{b.rhythm}</div>
              </Card>
            </Link>
          ))}
        </div>

        <SectionTitle>Relax</SectionTitle>
        <Card className="divide-y divide-line/60 py-1">
          {RELAXATIONS.map((r) => (
            <Link key={r.id} to={`/breathe/${r.id}`} viewTransition className="pressable flex items-center gap-3 py-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet/15 text-2xl" aria-hidden>
                {r.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{r.name}</span>
                <span className="block text-sm text-muted">
                  {r.purpose} · {r.minutes} min, voice guided
                </span>
              </span>
              <ChevronRight className="shrink-0 text-faint" size={18} />
            </Link>
          ))}
        </Card>

        <SectionTitle>Mini flows</SectionTitle>
        <div className="space-y-2">
          {FLOWS.map(({ kind, title, text, Icon }) => (
            <Link key={kind} to={`/workout?snack=3&flow=${kind}`} viewTransition className="pressable block">
              <Card className="flex items-center gap-3 py-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ember/15 text-ember">
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted">3 minutes · {text}</span>
                </span>
                <ChevronRight className="shrink-0 text-faint" size={18} />
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-4 px-1 text-xs text-faint">Breathing sessions count toward your quests and active days. Breathe gently: never strain, and stop if you feel light-headed.</p>
        <div className="h-4" />
      </div>
    </>
  )
}
