/**
 * Forge's Claude features run in the Claude app on the user's own Claude subscription: Forge
 * prepares the prompt (with a summary of the plan and logs), copies it and opens Claude; for meal
 * estimates the answer is pasted back and read here. No API key and no server call.
 */

import { APP, isBloom } from '@/app/brand'

export type Confidence = 'high' | 'medium' | 'low'

export interface FoodEstimateItem {
  name: string
  portion: string
  /** Estimated edible weight as served. */
  grams: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  /** Fruit and vegetable servings (~80 g each). */
  produceServings: number
  confidence: Confidence
}

export interface FoodEstimate {
  items: FoodEstimateItem[]
  notes: string
}

const FENCE = '```'

export const COACH_GUIDE = `You're my fitness and nutrition coach. I use Forge, a home-workout and calorie-tracking app, and I've pasted my current data from it below. Keep answers short and practical (about 150 words unless I ask for more) and use US units.

- I train at home with my bodyweight and the equipment listed in my data, in short sessions, so suggest supersets, circuits and two-to-five-minute "exercise snacks", never gym machines or barbells.
- My dumbbells are fixed weights: progress with reps, slower tempo, pauses, one-and-a-half reps, harder variations and shorter rest rather than heavier weights.
- Respect my aches and my diet style. If something sounds like an injury (sharp or worsening pain, chest pain, dizziness), tell me to stop and see a professional.
- No crash diets, and never below about 1,200 kcal a day.
- Forge can swap any exercise (the Swap button in a session), shorten today's workout ("Short on time?"), log food by search, barcode or a Claude estimate, plan meals with a grocery list, and track progress. Point me to those when useful; you can't change my plan yourself.`

/** Bloom's version: a gentle yoga and wellbeing guide. */
export const BLOOM_GUIDE = `You're my gentle yoga and wellbeing guide. I use Bloom, a yoga and gentle-movement app, and I've pasted my current data from it below. Keep answers short, warm and practical (about 150 words unless I ask for more) and use US units.

- I practice at home in short, gentle sessions with only the props listed in my data. Suggest beginner-friendly poses with easier options and props (a chair, a wall, a cushion), never intense workouts.
- Breath comes first: suggest simple breathing (longer exhales, box breathing) when it would help.
- Respect anything I've asked to be gentle with. If I'm pregnant, avoid belly-down poses, deep twists, long stretches flat on my back and anything strenuous, and remind me to check with my doctor or midwife. If something sounds like an injury (sharp or worsening pain, numbness, dizziness), tell me to stop and see a professional.
- No crash diets or calorie pressure: favour simple, nourishing food.
- Bloom can swap any pose (the swap button in a practice preview), shorten today's practice ("Short on time?"), offer 3-minute mini flows and breathing sessions in the Breathe tab, log food, plan meals with a grocery list, and track progress. Point me to those when useful; you can't change my plan yourself.`

export function coachPrompt(context: string, question: string): string {
  const tag = `${APP.storagePrefix}_data`
  return `${isBloom ? BLOOM_GUIDE : COACH_GUIDE}

<${tag}>
${context.trim()}
</${tag}>

My question: ${question.trim()}`
}

export const MEAL_JSON_SHAPE =
  '{"items":[{"name":"","portion":"","grams":0,"kcal":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"veg":0,"confidence":"high"}],"notes":""}'

export function mealPrompt(description: string, withPhoto: boolean): string {
  const what = [withPhoto ? "I've attached a photo of it." : '', description.trim() ? `What I ate: ${description.trim()}` : ''].filter(Boolean).join('\n')
  return `Estimate the nutrition of my meal for ${isBloom ? 'my food log (Bloom)' : 'my calorie tracker (Forge)'}.
${what}

How to estimate:
- One item per food or drink, the way I'd log it (a sandwich is one item; chicken, rice and broccoli are three).
- Use the amounts I give; otherwise assume a typical US single serving and add "(est.)" to the portion.
- In a photo, judge size from the plate (about 10–11 inches), cutlery, hands and packaging.
- Include cooking oil, butter, sauces, dressings and drinks when they're visible or likely.
- Numbers are totals for the item, not per 100 g; kcal should be close to 4 × protein + 4 × carbs + 9 × fat.
- "veg" is the fruit and vegetable servings in the item (about 80 g each; potatoes don't count).
- "confidence" is "high", "medium" or "low".

Reply with one short sentence about your assumptions, then only this JSON in a code block:
${FENCE}json
${MEAL_JSON_SHAPE}
${FENCE}`
}

// ---- Reading Claude's answer ------------------------------------------------------------------

const num = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  if (typeof v === 'string') {
    const m = v.replace(',', '.').match(/-?\d+(\.\d+)?/)
    return m ? Number(m[0]) : 0
  }
  return 0
}
const str = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '')
const r1 = (n: number, max: number) => Math.round(Math.min(max, Math.max(0, n)) * 10) / 10

/** Clamp and round, so a wild number never reaches the diary. */
export function cleanItem(raw: Record<string, unknown>): FoodEstimateItem | null {
  const name = str(raw.name ?? raw.food ?? raw.item).trim().slice(0, 60)
  if (!name) return null
  const conf = str(raw.confidence).trim().toLowerCase()
  return {
    name,
    portion: str(raw.portion ?? raw.serving ?? raw.amount).trim().slice(0, 60),
    grams: Math.round(r1(num(raw.grams ?? raw.weight_g ?? raw.g), 3000)),
    kcal: Math.round(r1(num(raw.kcal ?? raw.calories ?? raw.energy), 5000)),
    protein: r1(num(raw.protein ?? raw.protein_g), 400),
    carbs: r1(num(raw.carbs ?? raw.carbohydrates ?? raw.carbs_g), 800),
    fat: r1(num(raw.fat ?? raw.fat_g), 400),
    fiber: r1(num(raw.fiber ?? raw.fibre ?? raw.fiber_g), 150),
    produceServings: r1(num(raw.veg ?? raw.produceServings ?? raw.produce_servings), 10),
    confidence: conf === 'high' || conf === 'low' ? conf : 'medium',
  }
}

function candidates(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) out.push(m[1]!)
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first >= 0 && last > first) out.push(text.slice(first, last + 1))
  const a = text.indexOf('[')
  const b = text.lastIndexOf(']')
  if (a >= 0 && b > a) out.push(text.slice(a, b + 1))
  return out
}

/** Finds the estimate in whatever was pasted: just the JSON, the code block, or Claude's whole reply. */
export function parseEstimate(pasted: string): { ok: true; estimate: FoodEstimate } | { ok: false; error: string } {
  const text = pasted.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  for (const c of candidates(text)) {
    let data: unknown
    try {
      data = JSON.parse(c.replace(/,\s*([}\]])/g, '$1'))
    } catch {
      continue
    }
    const obj = (Array.isArray(data) ? { items: data } : data) as { items?: unknown; notes?: unknown; note?: unknown }
    if (!obj || !Array.isArray(obj.items)) continue
    const items = obj.items.flatMap((i) => (i && typeof i === 'object' ? [cleanItem(i as Record<string, unknown>)] : [])).filter((i): i is FoodEstimateItem => !!i)
    if (!items.length) return { ok: false, error: 'Claude’s answer didn’t list any foods.' }
    const sentence = text.split(/```|\{/)[0]!.trim()
    const notes = (str(obj.notes ?? obj.note).trim() || sentence).slice(0, 300)
    return { ok: true, estimate: { items: items.slice(0, 12), notes } }
  }
  return { ok: false, error: 'Couldn’t find the estimate. Copy Claude’s whole reply (or the code box) and paste it here.' }
}

// ---- Handing off to Claude -----------------------------------------------------------------------

/** claude.ai opens in the Claude app when it's installed. `q` pre-fills a new chat where supported. */
export function claudeUrl(prefill?: string): string {
  return prefill ? `https://claude.ai/new?q=${encodeURIComponent(prefill)}` : 'https://claude.ai/new'
}

/**
 * Copies the prompt and opens Claude. Both must start inside the tap that triggered them (iOS
 * requires a user gesture for each), so nothing is awaited before `window.open`.
 */
export function sendToClaude(prompt: string, opts: { prefill: boolean }): Promise<boolean> {
  const copied = navigator.clipboard?.writeText(prompt).then(
    () => true,
    () => false,
  ) ?? Promise.resolve(false)
  window.open(claudeUrl(opts.prefill ? prompt : undefined), '_blank', 'noopener')
  return copied
}

export function copyText(text: string): Promise<boolean> {
  return (
    navigator.clipboard?.writeText(text).then(
      () => true,
      () => false,
    ) ?? Promise.resolve(false)
  )
}
