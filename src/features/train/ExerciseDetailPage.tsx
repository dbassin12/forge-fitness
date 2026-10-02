import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ExternalLink, PlayCircle, Wind } from 'lucide-react'
import { EQUIP_LABEL, EXERCISES, MUSCLE_LABEL, PATTERN_LABEL, getExercise, highlightFor, motionFor, youtubeUrl } from '@/data/exercises'
import { Mannequin } from '@/anim/Mannequin'
import { PageHeader } from '@/ui/PageHeader'
import { Card, SectionTitle } from '@/ui/Card'
import { Button } from '@/ui/Button'
import { LevelDots, Tag } from '@/ui/Chip'
import { BodyMap } from '@/ui/BodyMap'
import { TutorialPlayer } from './TutorialPlayer'
import { speech } from '@/voice/speech'
import { unlockAudio } from '@/voice/beeps'
import { usePalette } from '@/app/theme'

export default function ExerciseDetailPage() {
  const { id = '' } = useParams()
  const ex = getExercise(id)
  const [tutorial, setTutorial] = useState(false)
  const palette = usePalette()
  const neighbors = useMemo(() => {
    if (!ex) return { easier: undefined, harder: undefined }
    const same = EXERCISES.filter((e) => e.pattern === ex.pattern && e.id !== ex.id)
    const easier = same.filter((e) => e.level < ex.level).sort((a, b) => b.level - a.level)[0]
    const harder = same.filter((e) => e.level > ex.level).sort((a, b) => a.level - b.level)[0]
    return { easier, harder }
  }, [ex])

  if (!ex) {
    return (
      <>
        <PageHeader title="Not found" back="/train/library" />
        <p className="px-4 text-muted">That exercise doesn't exist.</p>
      </>
    )
  }
  const hl = highlightFor(ex)
  const c = ex.copy

  return (
    <>
      <PageHeader title={ex.name} subtitle={PATTERN_LABEL[ex.pattern]} back />
      <div className="px-4">
        <div className="overflow-hidden rounded-3xl border border-line bg-surface">
          <Mannequin
            motion={motionFor(ex)}
            palette={palette}
            pulse={hl.primary}
            highlight={Object.fromEntries(hl.secondary.map((g) => [g, 0.22]))}
            className="aspect-[4/3] w-full"
            title={`${ex.name} demonstration`}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tag tone="ember">
            Level {ex.level} <LevelDots level={ex.level} />
          </Tag>
          {ex.equipment.length === 0 ? <Tag>Bodyweight</Tag> : ex.equipment.map((q) => <Tag key={q}>{EQUIP_LABEL[q]}</Tag>)}
          <Tag tone="sky">{ex.measure === 'time' ? `${ex.range[0]}–${ex.range[1]} sec` : `${ex.range[0]}–${ex.range[1]} reps`}{ex.perSide ? ' / side' : ''}</Tag>
          {ex.impact === 'high' ? <Tag tone="bad">Jumping</Tag> : null}
        </div>
        <p className="mt-3 text-[15px] text-muted">{c.summary}</p>
        <div className="mt-4 flex gap-2">
          <Button
            block
            size="lg"
            icon={<PlayCircle size={22} />}
            onClick={() => {
              speech.unlock()
              unlockAudio()
              setTutorial(true)
            }}
          >
            Watch voiced tutorial
          </Button>
        </div>

        <SectionTitle>Muscles worked</SectionTitle>
        <Card className="flex items-center gap-4">
          <BodyMap primary={ex.muscles.primary} secondary={ex.muscles.secondary} className="h-40 w-auto shrink-0" />
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-faint">Primary</div>
            <div className="font-medium text-ember">{ex.muscles.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}</div>
            {ex.muscles.secondary.length ? (
              <>
                <div className="mt-2 text-xs uppercase tracking-wide text-faint">Also</div>
                <div className="text-muted">{ex.muscles.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}</div>
              </>
            ) : null}
          </div>
        </Card>

        <SectionTitle>How to do it</SectionTitle>
        <Card>
          <ol className="space-y-3">
            {[...c.setup, ...c.steps].map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ember">{i + 1}</span>
                <span className="text-[15px]">{s}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex gap-2 rounded-xl bg-surface-2 p-3 text-sm text-muted">
            <Wind size={18} className="mt-0.5 shrink-0 text-sky" />
            <span>{c.breathing}</span>
          </div>
        </Card>

        <SectionTitle>Coaching cues</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {c.cues.map((cue) => (
            <span key={cue} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm">
              {cue}
            </span>
          ))}
        </div>

        <SectionTitle>Common mistakes</SectionTitle>
        <Card className="space-y-3">
          {c.mistakes.map((m, i) => (
            <div key={i}>
              <div className="flex gap-2 text-[15px] font-medium text-bad">
                <span>✗</span>
                <span>{m.text}</span>
              </div>
              <div className="ml-5 mt-0.5 text-sm text-muted">✓ {m.fix}</div>
            </div>
          ))}
        </Card>

        <SectionTitle>Make it easier or harder</SectionTitle>
        <div className="grid gap-2">
          <Card className="flex gap-3">
            <ArrowDownRight className="shrink-0 text-teal" size={20} />
            <div className="text-sm">
              <div className="text-muted">{c.easier}</div>
              {neighbors.easier ? (
                <Link to={`/exercise/${neighbors.easier.id}`} className="mt-1 inline-block font-medium text-teal">
                  {neighbors.easier.name} →
                </Link>
              ) : null}
            </div>
          </Card>
          <Card className="flex gap-3">
            <ArrowUpRight className="shrink-0 text-ember" size={20} />
            <div className="text-sm">
              <div className="text-muted">{c.harder}</div>
              {neighbors.harder ? (
                <Link to={`/exercise/${neighbors.harder.id}`} className="mt-1 inline-block font-medium text-ember">
                  {neighbors.harder.name} →
                </Link>
              ) : null}
            </div>
          </Card>
        </div>

        {c.safety ? (
          <Card className="mt-4 flex gap-3 border-amber/40">
            <AlertTriangle size={18} className="shrink-0 text-amber" />
            <p className="text-sm text-muted">{c.safety}</p>
          </Card>
        ) : null}

        <a href={youtubeUrl(ex)} target="_blank" rel="noreferrer" className="mt-4 mb-6 flex items-center justify-center gap-2 text-sm text-muted hover:text-ink">
          <ExternalLink size={16} /> See real-person videos on YouTube
        </a>
      </div>
      {tutorial ? <TutorialPlayer exercise={ex} onClose={() => setTutorial(false)} /> : null}
    </>
  )
}
