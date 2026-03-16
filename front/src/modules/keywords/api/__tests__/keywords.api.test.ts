import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api', async () => {
  const actual =
    await vi.importActual<typeof import('@/shared/api/apiUtils')>('@/shared/api/apiUtils')
  return {
    API_URL: '/api',
    createRequest: (url: string, options?: RequestInit) => fetch(url, options),
    handleResponse: actual.handleResponse,
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
