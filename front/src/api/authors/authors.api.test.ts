import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/api/common', () => {
  return {
    API_URL: '/api',
    GATEWAY_API_URL: '/api',
    buildQueryString: (params: Record<string, string | number | boolean | undefined | null>) => {
      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value))
        }
      }
      return searchParams.toString()
    },
    createRequest: (url: string, options: RequestInit = {}) => fetch(url, options),
    handleResponse: async <T,>(response: Response) => response.json() as Promise<T>,
  }
})
vi.mock('@/types', () => {
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
      '/api/v1/content/authors?page=3&limit=10',
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

  it('keeps author refresh on legacy authors api', async () => {
    const { authorsService } = await import('./authors.api')

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ updated: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await authorsService.refreshAuthors()

    expect(fetchMock).toHaveBeenCalledWith('/api/authors/refresh', expect.any(Object))
  })

  it('keeps filtered authors on legacy authors api', async () => {
    const { authorsService } = await import('./authors.api')

    await authorsService.fetchAuthors({ limit: 10, search: 'ivan' })

    expect(fetchMock).toHaveBeenCalledWith('/api/authors?limit=10&search=ivan', expect.any(Object))
  })
})
