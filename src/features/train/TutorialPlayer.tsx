import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronLeft, ChevronRight, Pause, Play, Snail, Volume2, VolumeX, X } from 'lucide-react'
import { Mannequin } from '@/anim/Mannequin'
import { highlightFor, motionFor, type Exercise } from '@/data/exercises'
import { CHAPTER_TITLE, tutorialScript, type ChapterId } from '@/voice/narration'
import { speech } from '@/voice/speech'
import { useCaption } from '@/voice/captions'
import { useVoiceSettings } from '@/voice/settings'
import { usePalette } from '@/app/theme'
import { cx } from '@/ui/cx'

/** Full-screen, narrated "video" for one exercise: animation + voice + captions, chaptered. */
export function TutorialPlayer({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const script = useMemo(() => tutorialScript(exercise), [exercise])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [slowMo, setSlowMo] = useState(false)
  const caption = useCaption((s) => s.text)
  const voiceOn = useVoiceSettings((s) => s.enabled)
  const updateVoice = useVoiceSettings((s) => s.update)
  const palette = usePalette()
  const seg = script[idx]
  const hl = highlightFor(exercise)
  const chapters = useMemo(() => [...new Set(script.map((s) => s.chapter))] as ChapterId[], [script])

  useEffect(() => {
    if (!playing) return
    let cancelled = false
    void speech.speak(seg.text, { interrupt: true, priority: 'narration' }).then(() => {
      if (cancelled) return
      setTimeout(() => {
        if (cancelled) return
        if (idx + 1 < script.length) setIdx(idx + 1)
        else setPlaying(false)
      }, 450)
    })
    return () => {
      cancelled = true
    }
  }, [idx, playing, seg.text, script.length])

  useEffect(() => () => speech.cancel(), [])

  const go = (i: number) => {
    speech.cancel()
    setIdx(Math.max(0, Math.min(script.length - 1, i)))
    setPlaying(true)
  }

  const showFault = seg.badge === 'wrong' && seg.fault
  const motion = showFault ? motionFor(exercise, seg.fault) : motionFor(exercise)
  const speed = seg.slow || slowMo ? 0.5 : 1
  const finished = !playing && idx === script.length - 1

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label={`${exercise.name} tutorial`}>
      <div className="safe-top flex items-center gap-2 px-3 pt-2">
        <button aria-label="Close" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
          <X size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-bold">{exercise.name}</div>
          <div className="text-xs text-muted">{CHAPTER_TITLE[seg.chapter]}</div>
        </div>
        <button
          aria-label={slowMo ? 'Normal speed' : 'Slow motion'}
          onClick={() => setSlowMo((s) => !s)}
          className={cx('grid h-10 w-10 place-items-center rounded-full', slowMo ? 'bg-ember/15 text-ember' : 'text-muted hover:bg-surface-2')}
        >
          <Snail size={20} />
        </button>
        <button
          aria-label={voiceOn ? 'Mute voice' : 'Unmute voice'}
          onClick={() => updateVoice({ enabled: !voiceOn })}
          className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2"
        >
          {voiceOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="relative mx-auto mt-2 w-full max-w-xl px-3">
        <div className={cx('overflow-hidden rounded-3xl border bg-surface', showFault ? 'border-bad/60' : seg.badge === 'right' ? 'border-good/60' : 'border-line')}>
          <Mannequin
            key={showFault ? `${exercise.id}-${seg.fault}` : exercise.id}
            motion={motion}
            speed={speed}
            palette={palette}
            tint={showFault ? '#f87171' : null}
            highlight={Object.fromEntries(hl.secondary.map((g) => [g, 0.25]))}
            pulse={showFault ? [] : hl.primary}
            className="aspect-[4/3] w-full"
            title={exercise.name}
          />
        </div>
        {seg.badge ? (
          <div
            className={cx(
              'absolute left-6 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold animate-pop',
              seg.badge === 'wrong' ? 'bg-bad text-white' : 'bg-good text-on-accent',
            )}
          >
            {seg.badge === 'wrong' ? <X size={16} /> : <Check size={16} />}
            {seg.badge === 'wrong' ? (showFault ? 'Wrong form' : 'Avoid this') : 'Do this'}
          </div>
        ) : null}
        {speed < 1 ? <div className="absolute right-6 top-4 rounded-full bg-surface-2/90 px-2.5 py-1 text-xs text-muted">½ speed</div> : null}
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-xl flex-1 flex-col px-5">
        <p className="min-h-[5.5rem] text-[19px] leading-snug font-medium" aria-live="polite">
          {caption && playing ? caption : seg.text}
        </p>
        <div className="mt-auto pb-3">
          <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
            {chapters.map((c) => {
              const first = script.findIndex((s) => s.chapter === c)
              const active = seg.chapter === c
              const done = script.findIndex((s) => s.chapter === c) < idx && !active
              return (
                <button
                  key={c}
                  onClick={() => go(first)}
                  className={cx(
                    'h-8 shrink-0 rounded-full px-3 text-xs font-medium',
                    active ? 'bg-ember text-on-accent' : done ? 'bg-surface-2 text-ink' : 'bg-surface-2 text-faint',
                  )}
                >
                  {CHAPTER_TITLE[c]}
                </button>
              )
            })}
          </div>
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-ember transition-all" style={{ width: `${((idx + 1) / script.length) * 100}%` }} />
          </div>
          <div className="flex items-center justify-center gap-6" style={{ paddingBottom: 'var(--safe-bottom)' }}>
            <button aria-label="Previous" onClick={() => go(idx - 1)} className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink">
              <ChevronLeft size={24} />
            </button>
            <button
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={() => {
                if (playing) {
                  speech.cancel()
                  setPlaying(false)
                } else {
                  if (finished) setIdx(0)
                  setPlaying(true)
                }
              }}
              className="grid h-16 w-16 place-items-center rounded-full bg-ember text-on-accent shadow-[0_10px_30px_-10px_var(--color-ember)]"
            >
              {playing ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
            </button>
            <button aria-label="Next" onClick={() => go(idx + 1)} className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-ink">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
