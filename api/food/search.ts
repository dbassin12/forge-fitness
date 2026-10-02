/**
 * GET /api/food/search?q=… — Open Food Facts text search for packaged foods.
 * The search endpoint doesn't send CORS headers, so the app asks us instead. Responses are
 * trimmed to the fields the app needs and cached at the edge for a day.
 */
const UA = 'Forge/0.1 (personal fitness PWA; https://github.com/dbassin12/forge-fitness)'
const FIELDS = 'code,product_name,product_name_en,brands,nutriments,serving_size,serving_quantity,product_quantity_unit'
const KEEP = ['energy-kcal_100g', 'energy_100g', 'proteins_100g', 'carbohydrates_100g', 'fat_100g', 'fiber_100g'] as const

type OffRaw = Record<string, unknown> & { nutriments?: Record<string, unknown> }

export function trimProduct(p: OffRaw): OffRaw | null {
  const n = p.nutriments ?? {}
  const name = String(p.product_name ?? p.product_name_en ?? '').trim()
  if (!name || (n['energy-kcal_100g'] === undefined && n['energy_100g'] === undefined)) return null
  return {
    code: p.code,
    product_name: name,
    brands: p.brands,
    serving_size: p.serving_size,
    serving_quantity: p.serving_quantity,
    product_quantity_unit: p.product_quantity_unit,
    nutriments: Object.fromEntries(KEEP.filter((k) => n[k] !== undefined).map((k) => [k, n[k]])),
  }
}

export async function GET(request: Request): Promise<Response> {
  const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2 || q.length > 80) return Response.json({ products: [], error: 'query must be 2–80 characters' }, { status: 400 })
  const url =
    'https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=30' +
    `&fields=${FIELDS}&search_terms=${encodeURIComponent(q)}`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return Response.json({ products: [], error: `upstream ${res.status}` }, { status: 502 })
    const json = (await res.json()) as { products?: OffRaw[] }
    const products = (json.products ?? []).map(trimProduct).filter((p): p is OffRaw => !!p).slice(0, 20)
    return Response.json(
      { products },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800' } },
    )
  } catch {
    return Response.json({ products: [], error: 'upstream timeout' }, { status: 504 })
  }
}
