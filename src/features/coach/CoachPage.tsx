import { useEffect, useState } from 'react'
import { Check, ChevronDown, ClipboardCopy, ExternalLink, Loader2, MessageCircleQuestion } from 'lucide-react'
import { APP, isBloom } from '@/app/brand'
import { usePlan } from '@/state/plan'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { PageHeader } from '@/ui/PageHeader'
import { coachPrompt, copyText, sendToClaude } from '../claude/handoff'
import { loadCoachContext } from './context'

const SUGGESTIONS = isBloom
  ? [
      'My lower back feels stiff. Which gentle poses could help?',
      'I only have 5 minutes. What should I do?',
      'What’s a calming routine before bed?',
      'What’s a simple, nourishing dinner for tonight?',
    ]
  : [
      'What should I eat tonight to hit my protein?',
      'My knees ache. What can I do instead of lunges?',
      'I only have 5 minutes. What should I do?',
      'How do I keep progressing with 20 lb dumbbells?',
    ]

/**
 * "Ask Claude": questions go to the Claude app (on the user's own Claude subscription) with a
 * summary of the plan and logs, so answers are personal without Forge holding any API key.
 */
export default function CoachPage() {
  const plan = usePlan()
  const [question, setQuestion] = useState('')
  const [context, setContext] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  // Built when the page opens: copying and opening Claude must happen right inside the tap
  // (iOS allows both only during the gesture), so the summary has to be ready beforehand.
  useEffect(() => {
    if (!plan) return
    let live = true
    void loadCoachContext(plan.profile, plan.progress).then((c) => live && setContext(c))
    return () => {
      live = false
    }
  }, [plan])

  if (!plan) {
    return (
      <>
        <PageHeader title="Ask Claude" back />
        <div className="grid h-[40vh] place-items-center text-muted">
          <Loader2 className="animate-spin" />
        </div>
      </>
    )
  }

  return (
    <div className="min-h-dvh">
      <PageHeader title="Ask Claude" subtitle={`Your ${isBloom ? 'guide' : 'coach'}, on your Claude subscription`} back />
      <div className="px-4 pb-10">
        <Card className="mt-2 flex gap-3">
          <MessageCircleQuestion size={20} className="mt-0.5 shrink-0 text-ember" />
          <p className="text-sm text-muted">
            {isBloom
              ? 'Ask anything about poses, aches, sleep, food or making it a habit. Bloom opens the Claude app with your question and a summary of your practice, today’s food and your recent practices, so the answer fits you.'
              : 'Ask anything about training, food or sticking with it. Forge opens the Claude app with your question and a summary of your plan, today’s food and your recent workouts, so the answer fits you.'}{' '}
            Nothing is sent until you press send in Claude.
          </p>
        </Card>

        <div className="mt-4 grid gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuestion(s)}
              className="rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm text-ink hover:border-ember/60"
            >
              {s}
            </button>
          ))}
        </div>

        <label className="mt-5 block text-sm text-muted" htmlFor="question">
          Your question
        </label>
        <textarea
          id="question"
          value={question}
          rows={3}
          maxLength={1000}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={isBloom ? 'e.g. A gentle 10-minute flow for tight hips?' : 'e.g. What’s a good 10-minute upper-body finisher?'}
          className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none placeholder:text-faint focus:border-ember"
        />

        <Button
          className="mt-3"
          block
          size="lg"
          icon={<ExternalLink size={18} />}
          disabled={!question.trim() || context === null}
          onClick={() => {
            if (context === null) return
            void sendToClaude(coachPrompt(context, question), { prefill: true }).then((copied) =>
              setStatus(copied ? { ok: true, text: 'Copied. If Claude opens without your question, paste it and send.' } : { ok: false, text: 'Opened Claude. Copying wasn’t allowed, so type your question there.' }),
            )
          }}
        >
          Ask in Claude
        </Button>
        <Button
          className="mt-2"
          block
          variant="secondary"
          icon={<ClipboardCopy size={16} />}
          disabled={context === null}
          onClick={() => {
            if (context === null) return
            void copyText(context).then((ok) =>
              setStatus(ok ? { ok: true, text: 'Summary copied. Paste it into any Claude chat.' } : { ok: false, text: 'Copying wasn’t allowed in this browser.' }),
            )
          }}
        >
          Copy my {APP.name} summary
        </Button>
        {status ? (
          <p className={`mt-3 flex items-start gap-1.5 text-sm ${status.ok ? 'text-good' : 'text-muted'}`} role="status">
            {status.ok ? <Check size={16} className="mt-0.5 shrink-0" /> : null}
            {status.text}
          </p>
        ) : null}

        <button
          type="button"
          className="mt-6 flex w-full items-center justify-between rounded-2xl bg-surface-2 px-4 py-3 text-left text-sm font-medium"
          aria-expanded={preview}
          onClick={() => setPreview(!preview)}
        >
          What Claude will see
          <ChevronDown size={18} className={preview ? 'rotate-180 transition' : 'transition'} />
        </button>
        {preview && context ? <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-line bg-surface p-3 text-xs leading-relaxed text-muted">{context}</pre> : null}
        <p className="mt-4 text-xs text-faint">Uses your own Claude app and subscription. {APP.name} never sends your data anywhere itself.</p>
      </div>
    </div>
  )
}
