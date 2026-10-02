import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowUp, Bot, Loader2, RefreshCw, Square, SquarePen, Volume2 } from 'lucide-react'
import { db } from '@/db/db'
import { addChatMessage, askCoach, clearChat, useAiAvailability, useChat } from '@/state/ai'
import { usePlan } from '@/state/plan'
import { Button } from '@/ui/Button'
import { Card } from '@/ui/Card'
import { PageHeader } from '@/ui/PageHeader'
import { cx } from '@/ui/cx'
import { speech } from '@/voice/speech'
import { PasscodeForm } from '../settings/PasscodeForm'
import { loadCoachContext } from './context'
import { plainText, RichText } from './RichText'

const SUGGESTIONS = [
  'What should I eat tonight to hit my protein?',
  'My knees ache. What can I do instead of lunges?',
  'I only have 5 minutes. What should I do?',
  'How do I keep progressing with 20 lb dumbbells?',
]

export default function CoachPage() {
  const plan = usePlan()
  const { status, refresh } = useAiAvailability()
  const messages = useChat()
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<{ text: string; retry: boolean } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages?.length, pending, error])

  useEffect(() => () => abortRef.current?.abort(), [])

  const respond = async () => {
    if (!plan) return
    setError(null)
    setPending('')
    const ac = new AbortController()
    abortRef.current = ac
    let text = ''
    const history = await db.chat.orderBy('createdAt').toArray()
    const context = await loadCoachContext(plan.profile, plan.progress)
    const r = await askCoach(
      history.map((m) => ({ role: m.role, text: m.text })),
      context,
      (piece) => {
        text += piece
        setPending(text)
      },
      ac.signal,
    )
    abortRef.current = null
    setPending(null)
    if (r.ok) {
      await addChatMessage('assistant', r.truncated ? `${text.trim()} …` : text.trim())
    } else if (r.aborted) {
      if (text.trim()) await addChatMessage('assistant', `${text.trim()} …`)
    } else if (r.refused) {
      // Take the question back out so it doesn't colour later answers; let them rephrase it.
      const last = await db.chat.orderBy('createdAt').last()
      if (last?.role === 'user') {
        await db.chat.delete(last.id)
        setDraft(last.text)
      }
      setError({ text: r.error, retry: false })
    } else {
      setError({ text: r.error, retry: true })
    }
  }

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || pending !== null) return
    setDraft('')
    if (inputRef.current) inputRef.current.style.height = ''
    await addChatMessage('user', q)
    await respond()
  }

  const busy = pending !== null
  const empty = !messages?.length && !busy

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="Coach"
        subtitle={status === 'ready' ? 'Knows your plan, food log and progress' : 'AI coach'}
        back
        right={
          status === 'ready' && messages?.length ? (
            <button
              type="button"
              aria-label="New chat"
              className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-40"
              disabled={busy}
              onClick={() => {
                if (window.confirm('Start a new chat? This clears the conversation.')) {
                  setError(null)
                  void clearChat()
                }
              }}
            >
              <SquarePen size={20} />
            </button>
          ) : null
        }
      />

      {status === 'loading' || !plan ? (
        <div className="grid flex-1 place-items-center text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : status !== 'ready' ? (
        <div className="px-4">
          <Setup status={status} onRetry={refresh} />
        </div>
      ) : (
        <>
          <div className="flex-1 px-4 pb-40">
            {empty ? (
              <div className="pt-6">
                <div className="flex items-start gap-3">
                  <Avatar />
                  <div className="rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
                    Hi{plan.profile.name ? ` ${plan.profile.name}` : ''}! I can see today's session, your food log and your recent workouts, so ask me anything about training, food or
                    sticking with it.
                  </div>
                </div>
                <div className="mt-5 grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm text-ink hover:border-ember/60"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ol className="space-y-4 pt-3" aria-live="polite">
                {(messages ?? []).map((m) => (
                  <li key={m.id}>{m.role === 'user' ? <UserBubble text={m.text} /> : <CoachBubble text={m.text} />}</li>
                ))}
                {busy ? (
                  <li>
                    <CoachBubble text={pending} streaming />
                  </li>
                ) : null}
              </ol>
            )}
            {error ? (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-bad/30 bg-bad/10 px-3 py-2.5 text-sm text-bad" role="alert">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="flex-1">{error.text}</span>
                {error.retry ? (
                  <button type="button" className="inline-flex items-center gap-1 font-semibold underline" onClick={() => void respond()}>
                    <RefreshCw size={14} /> Retry
                  </button>
                ) : null}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-bg/90 backdrop-blur-xl" style={{ paddingBottom: 'calc(var(--safe-bottom) + 8px)' }}>
            <form
              className="mx-auto flex max-w-xl items-end gap-2 px-4 pt-2.5"
              onSubmit={(e) => {
                e.preventDefault()
                void send(draft)
              }}
            >
              <textarea
                ref={inputRef}
                value={draft}
                rows={1}
                maxLength={2000}
                placeholder="Ask your coach…"
                aria-label="Message"
                onChange={(e) => {
                  setDraft(e.target.value)
                  const el = e.target
                  el.style.height = 'auto'
                  el.style.height = `${Math.min(el.scrollHeight, 132)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(hover: hover)').matches) {
                    e.preventDefault()
                    void send(draft)
                  }
                }}
                className="max-h-[132px] min-h-11 flex-1 resize-none rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[15px] leading-snug text-ink outline-none placeholder:text-faint focus:border-ember"
              />
              {busy ? (
                <button type="button" aria-label="Stop" onClick={() => abortRef.current?.abort()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-3 text-ink">
                  <Square size={16} className="fill-current" />
                </button>
              ) : (
                <button type="submit" aria-label="Send" disabled={!draft.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ember text-on-accent disabled:opacity-40">
                  <ArrowUp size={20} />
                </button>
              )}
            </form>
            <p className="mx-auto max-w-xl px-4 pt-1.5 text-center text-[11px] text-faint">Your question and a summary of your plan and logs go to Claude (Anthropic). Chats stay on this phone.</p>
          </div>
        </>
      )}
    </div>
  )
}

function Avatar() {
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ember/15 text-ember">
      <Bot size={18} />
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-ember px-4 py-2.5 text-[15px] leading-relaxed text-on-accent">{text}</div>
    </div>
  )
}

function CoachBubble({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <Avatar />
      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md bg-surface-2 px-4 py-3 text-[15px] leading-relaxed">
        {text ? <RichText text={text} /> : null}
        {streaming ? (
          <span className={cx('inline-flex items-center gap-1.5 text-muted', text && 'mt-1')}>
            {text ? <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-ember align-middle" /> : <Loader2 size={16} className="animate-spin" />}
            {text ? null : <span className="text-sm">Thinking…</span>}
          </span>
        ) : (
          <button
            type="button"
            aria-label="Read aloud"
            onClick={() => void speech.speak(plainText(text), { interrupt: true, priority: 'narration', caption: false })}
            className="mt-1.5 -mb-1 -ml-1 grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-surface-3 hover:text-ink"
          >
            <Volume2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function Setup({ status, onRetry }: { status: 'unreachable' | 'off' | 'needs-code'; onRetry: () => void }) {
  if (status === 'needs-code') {
    return (
      <Card className="mt-4">
        <div className="font-semibold">Enter your access code</div>
        <p className="mt-1 text-sm text-muted">The coach is set up on your server. Enter the access code once and this phone can use it.</p>
        <PasscodeForm className="mt-4" />
      </Card>
    )
  }
  if (status === 'unreachable') {
    return (
      <Card className="mt-4">
        <div className="font-semibold">Can’t reach Forge’s server</div>
        <p className="mt-1 text-sm text-muted">The coach needs an internet connection and the app’s server on Vercel. Everything else in Forge keeps working offline.</p>
        <Button className="mt-4" variant="secondary" icon={<RefreshCw size={16} />} onClick={onRetry}>
          Try again
        </Button>
      </Card>
    )
  }
  return (
    <Card className="mt-4">
      <div className="font-semibold">Turn on the AI coach (optional)</div>
      <p className="mt-1 text-sm text-muted">
        Chat with a coach that knows your plan, and log meals from a photo or a sentence. It uses your own Anthropic API key, typically about 1–3¢ per question or photo.
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
        <li>
          Create an API key at <span className="font-medium">console.anthropic.com</span> → API keys. Setting a monthly spend limit there is a good idea.
        </li>
        <li>
          In Vercel, open your Forge project → Settings → Environment Variables and add <code className="rounded bg-surface-2 px-1">ANTHROPIC_API_KEY</code> (and{' '}
          <code className="rounded bg-surface-2 px-1">APP_PASSCODE</code> if you haven’t yet).
        </li>
        <li>Redeploy (Deployments → ⋯ → Redeploy), then come back here.</li>
      </ol>
      <Button className="mt-4" variant="secondary" icon={<RefreshCw size={16} />} onClick={onRetry}>
        Check again
      </Button>
    </Card>
  )
}
