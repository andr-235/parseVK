import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
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
vi.mock('@/pages/author-analysis/types/photoAnalysis', () => {
  return {
    createEmptyPhotoAnalysisSummary: () => ({
      total: 0,
      suspicious: 0,
      lastAnalyzedAt: null,
      categories: [],
      levels: [],
    }),
  }
})

describe('authors api migration routing', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          total: 0,
          hasMore: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
  })

  it('loads authors from content gateway read model', async () => {
    const { authorsService } = await import('./authors.api')

    await authorsService.fetchAuthors({ offset: 20, limit: 10 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/content/authors?offset=20&limit=10',
      expect.any(Object)
    )
  })

  it('loads author details from content gateway read model', async () => {
    const { authorsService } = await import('./authors.api')

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 1,
          vkAuthorId: 100,
          type: 'user',
          displayName: 'Test User',
          updatedAt: '2026-05-22T00:00:00Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    await authorsService.getAuthorDetails(100)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/content/authors/100', expect.any(Object))
  })

  it('calls author refresh on content authors api', async () => {
    const { authorsService } = await import('./authors.api')

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ updated: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await authorsService.refreshAuthors()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/content/authors/refresh', expect.any(Object))
  })

  it('loads filtered authors from content authors api', async () => {
    const { authorsService } = await import('./authors.api')

    await authorsService.fetchAuthors({ limit: 10, city: 'Yakutsk' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/content/authors?limit=10&city=Yakutsk', expect.any(Object))
  })

  it('loads verified authors from content authors api', async () => {
    const { authorsService } = await import('./authors.api')

    await authorsService.fetchAuthors({ limit: 10, verified: false })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/content/authors?limit=10&verified=false',
      expect.any(Object)
    )
  })

  it('loads authors with sort fields from content authors api', async () => {
    const { authorsService } = await import('./authors.api')

    await authorsService.fetchAuthors({ limit: 10, sortBy: 'fullName', sortOrder: 'desc' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/content/authors?limit=10&sortBy=fullName&sortOrder=desc',
      expect.any(Object)
    )
  })


  it('uses content gateway for projection-supported author search and sort', async () => {
    const { authorsService } = await import('./authors.api')

    await authorsService.fetchAuthors({ limit: 10, search: 'ivan', sortBy: 'fullName' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/content/authors?limit=10&search=ivan&sortBy=fullName',
      expect.any(Object)
    )
  })

  it('normalizes malformed photo-analysis summaries', async () => {
    const { authorsService } = await import('./authors.api')

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 1,
              vkUserId: 100,
              firstName: 'Test',
              lastName: 'User',
              fullName: 'Test User',
              photo50: null,
              photo100: null,
              photo200: null,
              domain: null,
              screenName: null,
              profileUrl: null,
              city: null,
              summary: { total: 1, suspicious: 0, categories: null, levels: {} },
              photosCount: null,
              audiosCount: null,
              videosCount: null,
              friendsCount: null,
              followersCount: null,
              lastSeenAt: null,
              verifiedAt: null,
              isVerified: false,
            },
          ],
          total: 1,
          hasMore: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    const result = await authorsService.fetchAuthors({ limit: 10 })

    expect(result.items[0].summary.categories).toEqual([])
    expect(result.items[0].summary.levels).toEqual([])
  })
})
