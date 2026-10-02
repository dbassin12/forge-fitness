import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type ChatMessage } from '@/db/db'
import { uid } from '@/lib/id'
import type { ChatTurn, CoachEvent, FoodEstimate } from '@shared/ai'
import { shrinkImage } from './body'
import { getPasscode, usePasscode } from './reminders'

export type { FoodEstimate, FoodEstimateItem } from '@shared/ai'

// ---- Is AI available? ---------------------------------------------------------------------

interface AiServerConfig {
  ok: boolean
  configured: { apiKey: boolean; passcode: boolean }
}

/**
 * - `unreachable`: offline, or the server isn't deployed (e.g. local dev)
 * - `off`: the server has no ANTHROPIC_API_KEY / APP_PASSCODE yet
 * - `needs-code`: ready on the server, but this phone hasn't saved the access code
 */
export type AiAvailability = 'loading' | 'unreachable' | 'off' | 'needs-code' | 'ready'

let configCache: { at: number; value: AiServerConfig } | null = null

async function fetchAiConfig(force: boolean): Promise<AiServerConfig | null> {
  if (!force && configCache && Date.now() - configCache.at < 10 * 60_000) return configCache.value
  try {
    const res = await fetch('/api/ai/config', { cache: 'no-store' })
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    const value = (await res.json()) as AiServerConfig
    configCache = { at: Date.now(), value }
    return value
  } catch {
    return null
  }
}

export function useAiAvailability(): { status: AiAvailability; refresh: () => void } {
  const passcode = usePasscode()
  const [cfg, setCfg] = useState<AiServerConfig | null | undefined>(configCache?.value)
  const load = useCallback((force: boolean) => {
    setCfg(undefined)
    void fetchAiConfig(force).then(setCfg)
  }, [])
  useEffect(() => {
    let live = true
    void fetchAiConfig(false).then((v) => live && setCfg(v))
    return () => {
      live = false
    }
  }, [])
  let status: AiAvailability
  if (cfg === undefined || passcode === undefined) status = 'loading'
  else if (cfg === null) status = 'unreachable'
  else if (!cfg.configured.apiKey || !cfg.configured.passcode) status = 'off'
  else if (!passcode) status = 'needs-code'
  else status = 'ready'
  return { status, refresh: () => load(true) }
}

// ---- Calls ----------------------------------------------------------------------------------

export type AiResult<T> = { ok: true; data: T } | { ok: false; error: string }

function offlineMessage(): string {
  return navigator.onLine ? 'Couldn’t reach the server. Try again.' : 'You’re offline — AI features need a connection.'
}

async function post<T>(action: string, body: unknown, signal?: AbortSignal): Promise<AiResult<T>> {
  const passcode = await getPasscode()
  try {
    const res = await fetch(`/api/ai/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forge-passcode': passcode ?? '' },
      body: JSON.stringify(body),
      signal,
    })
    const json = res.headers.get('content-type')?.includes('json') ? ((await res.json()) as { error?: string } & T) : null
    if (!res.ok || !json) return { ok: false, error: json?.error ?? `Server error (${res.status}).` }
    return { ok: true, data: json }
  } catch {
    return { ok: false, error: signal?.aborted ? 'Cancelled.' : offlineMessage() }
  }
}

type Estimate = { estimate: FoodEstimate }

export function estimateFromText(text: string, signal?: AbortSignal): Promise<AiResult<Estimate>> {
  return post('food-text', { text }, signal)
}

function blobToBase64(b: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ''))
    r.onerror = () => reject(r.error ?? new Error('read failed'))
    r.readAsDataURL(b)
  })
}

/** Photos are shrunk to ~1024 px JPEG first: plenty for Claude, and quick to upload. */
export async function estimateFromPhoto(photo: Blob, note: string, signal?: AbortSignal): Promise<AiResult<Estimate>> {
  const small = await shrinkImage(photo, 1024, 0.8)
  const mediaType = small.type === 'image/png' || small.type === 'image/webp' ? small.type : 'image/jpeg'
  return post('food-photo', { image: await blobToBase64(small), mediaType, note: note.trim() || undefined }, signal)
}

export type CoachResult = { ok: true; truncated?: boolean } | { ok: false; error: string; refused?: boolean; aborted?: boolean }

/** Streams the coach's reply; `onText` gets each new piece as it arrives. */
export async function askCoach(turns: ChatTurn[], context: string, onText: (piece: string) => void, signal: AbortSignal): Promise<CoachResult> {
  const passcode = await getPasscode()
  let res: Response
  try {
    res = await fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forge-passcode': passcode ?? '' },
      body: JSON.stringify({ messages: turns, context }),
      signal,
    })
  } catch {
    return signal.aborted ? { ok: false, error: 'Stopped.', aborted: true } : { ok: false, error: offlineMessage() }
  }
  if (!res.ok || !res.body) {
    const json = res.headers.get('content-type')?.includes('json') ? ((await res.json().catch(() => null)) as { error?: string } | null) : null
    return { ok: false, error: json?.error ?? `Server error (${res.status}).` }
  }
  let result: CoachResult = { ok: false, error: 'The reply was cut off. Try again.' }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buf = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += value
      let nl: number
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)
        if (!line) continue
        const ev = JSON.parse(line) as CoachEvent
        if (ev.type === 'text') onText(ev.text)
        else if (ev.type === 'done') result = { ok: true, truncated: ev.truncated }
        else if (ev.type === 'refusal') result = { ok: false, refused: true, error: 'Coach can’t help with that one. Try asking another way.' }
        else result = { ok: false, error: ev.error }
      }
    }
  } catch {
    return signal.aborted ? { ok: false, error: 'Stopped.', aborted: true } : { ok: false, error: 'The connection dropped. Try again.' }
  }
  return result
}

// ---- Chat history (kept on the phone) -----------------------------------------------------

const KEEP_MESSAGES = 120

export function useChat(): ChatMessage[] | undefined {
  return useLiveQuery(() => db.chat.orderBy('createdAt').toArray(), [])
}

export async function addChatMessage(role: ChatMessage['role'], text: string): Promise<void> {
  await db.chat.add({ id: uid('chat'), role, text, createdAt: Date.now() })
  const n = await db.chat.count()
  if (n > KEEP_MESSAGES) {
    const old = await db.chat.orderBy('createdAt').limit(n - KEEP_MESSAGES).primaryKeys()
    await db.chat.bulkDelete(old)
  }
}

export async function clearChat(): Promise<void> {
  await db.chat.clear()
}
