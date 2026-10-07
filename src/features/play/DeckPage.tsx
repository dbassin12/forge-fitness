import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, ChevronsRight, Shuffle, Trophy, X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { useCelebrate } from '@/app/celebrate'
import { burst } from '@/app/confetti'
import { usePalette } from '@/app/theme'
import { highlightFor, motionFor } from '@/data/exercises'
import { haptic } from '@/device/haptics'
import { sfx } from '@/device/sfx'
import { planContext } from '@/engines/plan'
import { buildDeck, cardReps, deckPlan, deckTotals, pluralName, RANK_LABEL, SUIT_RED, SUIT_SYMBOL, SUITS, type Card as PlayingCard, type DeckMode, type DeckSize } from '@/engines/play'
import { usePlan } from '@/state/plan'
import { logPlay, saveDeckTime, useDeckBests } from '@/state/play'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { cx } from '@/ui/cx'
import { PageHeader } from '@/ui/PageHeader'
import { Segmented } from '@/ui/Segmented'
import { unlockAudio } from '@/voice/beeps'
import { coachLine } from '@/voice/coachLines'
import { speech } from '@/voice/speech'
import { formatClock } from './format'

const SIZES: { value: DeckSize; label: string; min: string }[] = [
  { value: 13, label: 'Quick · 13', min: '~5 min' },
  { value: 26, label: 'Half · 26', min: '~10 min' },
  { value: 52, label: 'Full · 52', min: '~20 min' },
]

function PlayingCardFace({ card, className }: { card: PlayingCard; className?: string }) {
  const red = SUIT_RED[card.suit]
  const sym = SUIT_SYMBOL[card.suit]
  const rank = RANK_LABEL(card.rank)
  return (
    <div className={cx('relative h-full w-full rounded-2xl border border-black/10 bg-white shadow-2xl', red ? 'text-[#e11d48]' : 'text-[#111827]', className)}>
      <div className="absolute top-2 left-3 text-center leading-none">
        <div className="font-display text-2xl font-black">{rank}</div>
        <div className="text-xl">{sym}</div>
      </div>
      <div className="absolute right-3 bottom-2 rotate-180 text-center leading-none">
        <div className="font-display text-2xl font-black">{rank}</div>
        <div className="text-xl">{sym}</div>
      </div>
      <div className="grid h-full place-items-center text-7xl">{sym}</div>
    </div>
  )
}

function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cx('h-full w-full rounded-2xl border-4 border-white shadow-2xl', className)}
      style={{ background: 'repeating-linear-gradient(45deg, var(--color-ember) 0 8px, color-mix(in oklab, var(--color-ember) 70%, black) 8px 16px)' }}
    />
  )
}

export default function DeckPage() {
  const plan = usePlan()
  const navigate = useNavigate()
  const palette = usePalette()
  const bests = useDeckBests()
  const [size, setSize] = useState<DeckSize>(13)
  const [mode, setMode] = useState<DeckMode>('normal')
  const [deck, setDeck] = useState<PlayingCard[] | null>(null)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [finished, setFinished] = useState<{ seconds: number; isBest: boolean; xp: number } | null>(null)
  const done = useRef<PlayingCard[]>([])
  const dp = useMemo(() => (plan ? deckPlan(plan.progress, planContext(plan.inputs)) : null), [plan])

  useEffect(() => {
    if (!deck || finished) return
    const id = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [deck, finished])

  // Each new card flips over on its own.
  useEffect(() => {
    if (!deck || finished) return
    setFlipped(false)
    const id = window.setTimeout(() => {
      setFlipped(true)
      sfx.whoosh()
      haptic('light')
      const c = deck[i]
      if (c && dp) {
        const ex = dp.suits[c.suit]
        const n = cardReps(c, mode, ex)
        void speech.speak(`${n} ${pluralName(ex.name, n)}.`, { priority: 'cue', interrupt: true })
      }
    }, 350)
    return () => window.clearTimeout(id)
  }, [deck, i, finished, dp, mode])

  if (!plan || !dp) return <div className="grid h-dvh place-items-center text-muted animate-pulse-soft">Loading…</div>
  const bestKey = `${size}:${mode}`

  const start = () => {
    unlockAudio()
    speech.unlock()
    done.current = []
    setDeck(buildDeck(size, Date.now()))
    setI(0)
    setFinished(null)
    setStartedAt(Date.now())
    setNow(Date.now())
    void speech.speak(coachLine('start'), { priority: 'cue', interrupt: true })
  }

  const end = async (cards: PlayingCard[]) => {
    if (!cards.length) {
      speech.cancel()
      setDeck(null)
      return
    }
    const seconds = Math.round((Date.now() - startedAt) / 1000)
    const totals = deckTotals(cards, dp, mode)
    const full = cards.length >= 52
    let isBest = false
    if (cards.length === size) isBest = (await saveDeckTime(bestKey, seconds)).isBest
    const xp = 10 + cards.length * 2 + (full ? 20 : 0) + (isBest ? 15 : 0)
    if (cards.length) {
      await logPlay({
        key: full ? 'deck:52' : `deck:${cards.length}`,
        title: `Deck of cards (${cards.length})`,
        startedAt,
        profile: plan.profile,
        exercises: Object.entries(totals.reps).map(([exerciseId, reps]) => ({ exerciseId, sets: [{ reps }] })),
        xp,
      })
    }
    setFinished({ seconds, isBest, xp })
    sfx.levelUp()
    haptic('celebrate')
    burst(isBest ? 'big' : 'small')
    void speech.speak(isBest ? coachLine('record') : coachLine('workoutDone'), { priority: 'cue', interrupt: true })
    if (isBest && cards.length === size) useCelebrate.getState().push({ kind: 'pb', emoji: '🃏', title: `Fastest ${size}-card deck`, text: `${formatClock(seconds)} on ${mode === 'easy' ? 'easy' : 'normal'} reps.` })
  }

  const next = (skip = false) => {
    if (!deck) return
    const card = deck[i]
    if (!skip) {
      done.current = [...done.current, card]
      sfx.success()
      haptic('success')
    }
    if (i + 1 >= deck.length) void end(done.current)
    else setI(i + 1)
  }

  // ---- Setup ----
  if (!deck) {
    return (
      <div className="min-h-dvh">
        <PageHeader title="Deck of cards" subtitle="Draw a card, do the reps" back="/play" />
        <div className="px-4 pb-8">
          <p className="text-[15px] text-muted">Shuffle the deck. Each card is a set: the suit picks the move and the number is the reps. Face cards are 10, aces are 11.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {SUITS.map((s) => {
              const ex = dp.suits[s]
              return (
                <Card key={s} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-2xl font-bold', SUIT_RED[s] ? 'text-[#e11d48]' : 'text-[#111827]')}>{SUIT_SYMBOL[s]}</span>
                    <div className="min-w-0 text-sm font-semibold leading-tight">
                      {ex.name}
                      {ex.pattern === 'cond' ? <span className="block text-xs font-normal text-muted">reps × 2</span> : null}
                    </div>
                  </div>
                  <div className="mt-2 overflow-hidden rounded-xl bg-bg">
                    <Mannequin motion={motionFor(ex)} palette={palette} className="aspect-[4/3] w-full" title={ex.name} />
                  </div>
                </Card>
              )
            })}
          </div>
          <div className="mt-5 text-sm font-medium text-muted">Deck</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SIZES.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={size === o.value}
                onClick={() => setSize(o.value)}
                className={cx('pressable rounded-2xl border px-2 py-3 text-center', size === o.value ? 'border-ember bg-ember/10' : 'border-line bg-surface')}
              >
                <div className={cx('text-sm font-semibold', size === o.value && 'text-ember')}>{o.label}</div>
                <div className="text-xs text-muted">{o.min}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 text-sm font-medium text-muted">Reps</div>
          <Segmented<DeckMode>
            label="Reps"
            className="mt-2"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'easy', label: 'Easy (half)' },
              { value: 'normal', label: 'Normal' },
            ]}
          />
          {bests?.[bestKey] ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-amber/10 px-3 py-2.5 text-sm">
              <Trophy size={16} className="text-amber" /> Best time: <b className="tabular">{formatClock(bests[bestKey])}</b>
            </div>
          ) : null}
          <Button block size="lg" className="mt-5" icon={<Shuffle size={20} />} onClick={start}>
            Shuffle & start
          </Button>
        </div>
      </div>
    )
  }

  // ---- Finished ----
  if (finished) {
    const totals = deckTotals(done.current, dp, mode)
    return (
      <div className="flex min-h-dvh flex-col px-4 safe-top">
        <div className="mt-10 text-center">
          <div className="text-6xl animate-bounce-in">{finished.isBest ? '🏆' : '🃏'}</div>
          <h1 className="mt-3 font-display text-3xl font-bold">{finished.isBest ? 'New best time!' : 'Deck done!'}</h1>
          <p className="text-muted">
            {done.current.length} cards in <b className="text-ink tabular">{formatClock(finished.seconds)}</b>
          </p>
        </div>
        <Card className="mt-6 divide-y divide-line/60 py-1">
          {SUITS.map((s) => {
            const ex = dp.suits[s]
            const reps = totals.reps[ex.id]
            if (!reps) return null
            return (
              <div key={s} className="flex items-center gap-3 py-2.5">
                <span className={cx('text-xl', SUIT_RED[s] ? 'text-[#e11d48]' : 'text-ink')}>{SUIT_SYMBOL[s]}</span>
                <span className="flex-1">{ex.name}</span>
                <b className="tabular">{reps}</b>
              </div>
            )
          })}
        </Card>
        <div className="mt-4 text-center text-sm font-semibold text-violet">+{finished.xp} XP</div>
        <div className="mt-auto grid gap-2 pt-6" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          <Button block size="lg" onClick={() => navigate('/play', { replace: true })}>
            Done
          </Button>
          <Button block variant="ghost" onClick={() => setDeck(null)}>
            Play again
          </Button>
        </div>
      </div>
    )
  }

  // ---- Playing ----
  const card = deck[i]
  const ex = dp.suits[card.suit]
  const reps = cardReps(card, mode, ex)
  const elapsed = (now - startedAt) / 1000
  return (
    <div className="flex h-dvh flex-col px-4 safe-top">
      <div className="flex items-center gap-2 pt-2">
        <button type="button" aria-label="End game" onClick={() => void end(done.current)} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
          <X size={22} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-sm font-semibold tabular">
            Card {i + 1} of {deck.length}
          </div>
          <div className="text-xs text-muted tabular">{formatClock(elapsed)}</div>
        </div>
        <span className="w-10" />
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-ember transition-[width] duration-500" style={{ width: `${(i / deck.length) * 100}%` }} />
      </div>

      <div className="relative mx-auto mt-4 h-[min(36vh,300px)] w-[min(25vh,210px)] [perspective:900px]">
        {/* The rest of the deck peeking out behind. */}
        {deck.length - i > 1 ? <CardBack className="absolute inset-0 translate-x-2 translate-y-2 rotate-3 opacity-60" /> : null}
        <div
          key={i}
          className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <CardBack />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <PlayingCardFace card={card} />
          </div>
        </div>
      </div>

      <div className={cx('mt-4 text-center transition duration-300', flipped ? 'opacity-100' : 'translate-y-2 opacity-0')}>
        <div className="font-display text-3xl font-black tabular min-[360px]:text-4xl">
          {reps}
          <span className="ml-2 text-2xl font-bold">{pluralName(ex.name, reps)}</span>
        </div>
        {ex.perSide ? <div className="text-sm text-muted">per side</div> : null}
      </div>

      <div className="mx-auto mt-3 w-36 overflow-hidden rounded-2xl border border-line bg-surface [@media(max-height:600px)]:hidden">
        <Mannequin motion={motionFor(ex)} palette={palette} pulse={highlightFor(ex).primary} className="aspect-[4/3] w-full" title={ex.name} />
      </div>

      <div className="mt-auto grid grid-cols-[auto_1fr] gap-2 pt-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
        <Button size="lg" variant="secondary" icon={<ChevronsRight size={20} />} onClick={() => next(true)} aria-label="Skip card">
          Skip
        </Button>
        <Button size="lg" className="min-w-0" icon={<Check size={20} strokeWidth={3} />} disabled={!flipped} onClick={() => next(false)} aria-label="Done · next card">
          Done
        </Button>
      </div>
    </div>
  )
}
