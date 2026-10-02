import type { Macros } from '@/engines/nutrition/foods'

/** A packaged food from Open Food Facts (values per 100 g / 100 ml). */
export interface OffProduct {
  code: string
  name: string
  brand?: string
  per100: Macros
  unit: 'g' | 'ml'
  servingG?: number
  servingLabel?: string
}

type Nutriments = Record<string, number | string | undefined>

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : undefined
}

export function parseOff(p: Record<string, unknown> | null | undefined): OffProduct | null {
  if (!p) return null
  const n = (p.nutriments ?? {}) as Nutriments
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy_100g']) !== undefined ? num(n['energy_100g'])! / 4.184 : undefined)
  const name = String(p.product_name ?? p.product_name_en ?? '').trim()
  if (kcal === undefined || !name) return null
  const unit = String(p.product_quantity_unit ?? '').toLowerCase() === 'ml' ? 'ml' : 'g'
  const servingG = num(p.serving_quantity)
  return {
    code: String(p.code ?? ''),
    name,
    brand: typeof p.brands === 'string' ? p.brands.split(',')[0].trim() || undefined : undefined,
    per100: {
      kcal: Math.round(kcal),
      protein: num(n['proteins_100g']) ?? 0,
      carbs: num(n['carbohydrates_100g']) ?? 0,
      fat: num(n['fat_100g']) ?? 0,
      fiber: num(n['fiber_100g']) ?? 0,
    },
    unit,
    servingG: servingG && servingG > 0 ? servingG : undefined,
    servingLabel: typeof p.serving_size === 'string' && p.serving_size.trim() ? p.serving_size.trim() : undefined,
  }
}

const FIELDS = 'code,product_name,product_name_en,brands,nutriments,serving_size,serving_quantity,product_quantity_unit'

/** Barcode lookup straight from the phone (the product API allows cross-origin requests). */
export async function lookupBarcode(code: string, signal?: AbortSignal): Promise<OffProduct | null> {
  const clean = code.replace(/\D/g, '')
  if (clean.length < 6) return null
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${FIELDS}`, { signal })
  if (!res.ok) return null
  const json = (await res.json()) as { status?: number; product?: Record<string, unknown> }
  if (json.status !== 1) return null
  return parseOff({ ...json.product, code: clean })
}

/** Text search goes through our small server proxy (the search API doesn't allow browsers). */
export async function searchOnline(q: string, signal?: AbortSignal): Promise<OffProduct[]> {
  const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`, { signal })
  if (!res.ok) throw new Error(`search failed (${res.status})`)
  const json = (await res.json()) as { products?: Record<string, unknown>[] }
  return (json.products ?? []).map(parseOff).filter((x): x is OffProduct => !!x)
}
