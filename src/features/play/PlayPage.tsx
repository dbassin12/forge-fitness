import { Link } from 'react-router'
import { ChevronRight, Info, Trophy } from 'lucide-react'
import { CHALLENGES, SUIT_SYMBOL, SUITS } from '@/engines/play'
import { useChallengeRecords } from '@/state/play'
import { Card, SectionTitle } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Wheel } from './Wheel'
import { formatValue } from './format'

export default function PlayPage() {
  const records = useChallengeRecords()
  return (
    <>
      <PageHeader title="Play" subtitle="Games that sneak in a workout" />
      <div className="px-4">
        <Link to="/play/wheel" viewTransition className="pressable block">
          <Card className="relative overflow-hidden border-ember/40 bg-gradient-to-br from-ember/20 via-surface to-surface">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-ember">Feeling lucky?</div>
                <div className="mt-1 font-display text-2xl font-bold">Spin the wheel</div>
                <p className="mt-1 text-sm text-muted">Spin for a random move. Every spin in a row adds a combo bonus.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ember">
                  Spin now <ChevronRight size={16} />
                </span>
              </div>
              <Wheel labels={['🦵', '💪', '⭐', '🧱', '🚶', '⛰️', '🪑', '🔥']} size={118} className="-mr-2 shrink-0 animate-spin-slow" />
            </div>
          </Card>
        </Link>

        <Link to="/play/deck" viewTransition className="pressable mt-3 block">
          <Card className="relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0" aria-hidden>
                {SUITS.map((s, i) => (
                  <span
                    key={s}
                    className={cx(
                      'absolute top-3 left-7 grid h-[72px] w-12 place-items-center rounded-lg border border-black/10 bg-white text-2xl font-bold shadow-lg',
                      s === 'hearts' || s === 'diamonds' ? 'text-[#e11d48]' : 'text-[#111827]',
                    )}
                    style={{ transform: `rotate(${(i - 1.5) * 14}deg)`, transformOrigin: '50% 130%' }}
                  >
                    {SUIT_SYMBOL[s]}
                  </span>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-violet">Classic</div>
                <div className="mt-1 font-display text-xl font-bold">Deck of cards</div>
                <p className="mt-1 text-sm text-muted">Draw a card, do the reps. The suit picks the move.</p>
              </div>
              <ChevronRight className="shrink-0 text-faint" />
            </div>
          </Card>
        </Link>

        <SectionTitle>Record challenges</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {CHALLENGES.map((c) => {
            const rec = records?.[c.id]
            const best = rec ? Math.max(0, ...Object.values(rec.best)) : 0
            return (
              <Link key={c.id} to={`/play/challenge/${c.id}`} viewTransition className="pressable">
                <Card className="h-full p-3">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{c.emoji}</span>
                    {best ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-xs font-semibold text-amber">
                        <Trophy size={12} /> {formatValue(c.kind, best)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 font-semibold">{c.name}</div>
                  <div className="text-xs text-muted">{c.kind === 'hold' ? 'Hold for time' : `Max reps in ${c.seconds}s`}</div>
                </Card>
              </Link>
            )
          })}
        </div>

        <Card className="mt-4 flex gap-3 text-sm text-muted">
          <Info size={18} className="mt-0.5 shrink-0 text-sky" />
          <p>Every game counts toward your daily quests, active days and achievements. Moves match your level, equipment and any aches you told Forge about.</p>
        </Card>
        <div className="h-4" />
      </div>
    </>
  )
}
