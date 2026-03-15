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

describe('watchlistService', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('suppresses error toast for silent getAuthors requests', async () => {
    const { watchlistService } = await import('../watchlist.api')
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 })) as typeof fetch

    await expect(
      watchlistService.getAuthors({ offset: 0, limit: 20, excludeStopped: true }, { silent: true })
    ).rejects.toThrow()

    expect(toastErrorMock).not.toHaveBeenCalled()
  })

  it('keeps error toast for interactive getAuthors requests', async () => {
    const { watchlistService } = await import('../watchlist.api')
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 503 })) as typeof fetch

    await expect(
      watchlistService.getAuthors({ offset: 0, limit: 20, excludeStopped: true })
    ).rejects.toThrow()

    expect(toastErrorMock).toHaveBeenCalledWith('Не удалось загрузить список авторов "На карандаше"')
  })
})
