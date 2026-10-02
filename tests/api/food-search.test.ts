import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET, trimProduct } from '../../api/food/search.js'

afterEach(() => vi.unstubAllGlobals())

describe('GET /api/food/search', () => {
  it('rejects bad queries', async () => {
    const res = await GET(new Request('https://x.test/api/food/search?q=a'))
    expect(res.status).toBe(400)
  })

  it('proxies, trims and caches Open Food Facts results', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        products: [
          { code: '1', product_name: 'Protein bar', brands: 'Acme', nutriments: { 'energy-kcal_100g': 380, proteins_100g: 30, sugars_100g: 5, salt_100g: 1 } },
          { code: '2', product_name: '', nutriments: { 'energy-kcal_100g': 100 } },
          { code: '3', product_name: 'Mystery', nutriments: {} },
        ],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await GET(new Request('https://x.test/api/food/search?q=protein%20bar'))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toContain('s-maxage')
    const body = (await res.json()) as { products: { code: string; nutriments: Record<string, number> }[] }
    expect(body.products).toHaveLength(1)
    expect(body.products[0].nutriments).toEqual({ 'energy-kcal_100g': 380, proteins_100g: 30 })
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][]
    expect(calls[0][0]).toContain('search_terms=protein%20bar')
    expect((calls[0][1].headers as Record<string, string>)['User-Agent']).toMatch(/^Forge\//)
  })

  it('reports upstream failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })))
    expect((await GET(new Request('https://x.test/api/food/search?q=milk'))).status).toBe(502)
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('timeout'))))
    expect((await GET(new Request('https://x.test/api/food/search?q=milk'))).status).toBe(504)
  })

  it('drops products without energy values', () => {
    expect(trimProduct({ product_name: 'x', nutriments: {} })).toBeNull()
  })
})
