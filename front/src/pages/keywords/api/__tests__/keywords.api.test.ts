import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api', () => {
  const BASE = '/api'
  const toQs = (p?: Record<string, unknown>) => {
    if (!p) return ''
    const s = new URLSearchParams()
    for (const [k, v] of Object.entries(p)) {
      if (v !== undefined && v !== null) s.set(k, String(v))
    }
    return '?' + s.toString()
  }
  return {
    API_URL: '/api',
    GATEWAY_API_URL: '/api',
    apiClient: {
      get: async (url: string, params?: Record<string, unknown>) => {
        const r = await fetch(BASE + url + toQs(params), { method: 'GET' }); return r.json()
      },
      post: async (url: string, body?: unknown) => {
        const r = await fetch(BASE + url, { method: 'POST', body: JSON.stringify(body) }); return r.json()
      },
      patch: async (url: string, body?: unknown) => {
        const r = await fetch(BASE + url, { method: 'PATCH', body: JSON.stringify(body) }); return r.json()
      },
      delete: async (url: string) => { const r = await fetch(BASE + url, { method: 'DELETE' }); return r.json() },
      raw: (url: string, options?: RequestInit) => fetch(BASE + url, options),
    },
  }
})

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('keywordsService.getAllKeywords', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('loads and merges all paginated keyword pages', async () => {
    const { keywordsService } = await import('../keywords.api')

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            keywords: [
              { id: 1, word: 'активист', category: null, isPhrase: false },
              { id: 2, word: 'бандер', category: null, isPhrase: false },
            ],
            total: 3,
            page: 1,
            limit: 2,
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            keywords: [{ id: 3, word: 'путлер', category: 'оскорбление', isPhrase: false }],
            total: 3,
            page: 2,
            limit: 2,
          }),
          { status: 200 }
        )
      ) as typeof fetch

    const result = await keywordsService.getAllKeywords()

    expect(result).toEqual([
      { id: 1, word: 'активист', category: null, isPhrase: false },
      { id: 2, word: 'бандер', category: null, isPhrase: false },
      { id: 3, word: 'путлер', category: 'оскорбление', isPhrase: false },
    ])
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(String((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0])).toContain(
      'page=1'
    )
    expect(String((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[1]?.[0])).toContain(
      'page=2'
    )
  })
})
