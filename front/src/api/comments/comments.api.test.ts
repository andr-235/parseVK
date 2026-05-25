import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/api/common', () => {
  return {
    API_URL: '/api',
    GATEWAY_API_URL: '/api',
    createRequest: (url: string, options: RequestInit = {}) => fetch(url, options),
    handleResponse: async <T,>(response: Response) => response.json() as Promise<T>,
  }
})

describe('comments api migration routing', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          total: 0,
          hasMore: false,
          readCount: 0,
          unreadCount: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )
  })

  it('loads comments from content gateway read model', async () => {
    const { getComments } = await import('./comments.api')

    await getComments({ offset: 20, limit: 10 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/comments?offset=20&limit=10',
      expect.any(Object)
    )
  })

  it('loads cursor comments from content gateway read model', async () => {
    const { getCommentsCursor } = await import('./comments.api')

    await getCommentsCursor({ limit: 25 })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/comments/cursor?limit=25',
      expect.any(Object)
    )
  })

  it('keeps read status updates on gateway api', async () => {
    const { updateReadStatus } = await import('./comments.api')

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1, text: 'ok', createdAt: '2026-05-22T00:00:00Z' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await updateReadStatus(1, true)

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/comments/1/read', expect.any(Object))
  })

  it('keeps filtered comments on gateway api', async () => {
    const { getComments } = await import('./comments.api')

    await getComments({ limit: 10, search: 'urgent' })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/comments?limit=10&search=urgent', expect.any(Object))
  })
})
