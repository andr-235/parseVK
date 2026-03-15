import { beforeEach, describe, expect, it, vi } from 'vitest'

const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: toastErrorMock,
    success: vi.fn(),
  },
}))

describe('listingsService.fetchListings', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('suppresses error toast for silent listings fetches', async () => {
    const { listingsService } = await import('../listings.api')
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 })) as typeof fetch

    await expect(
      listingsService.fetchListings(
        {
          page: 1,
          pageSize: 20,
        },
        { silent: true }
      )
    ).rejects.toThrow()

    expect(toastErrorMock).not.toHaveBeenCalled()
  })

  it('keeps error toast for non-silent listings fetches', async () => {
    const { listingsService } = await import('../listings.api')
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 })) as typeof fetch

    await expect(
      listingsService.fetchListings({
        page: 1,
        pageSize: 20,
      })
    ).rejects.toThrow()

    expect(toastErrorMock).toHaveBeenCalledWith('Не удалось загрузить объявления')
  })
})
