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
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 })) as typeof fetch

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
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 503 })) as typeof fetch

    await expect(
      listingsService.fetchListings({
        page: 1,
        pageSize: 20,
      })
    ).rejects.toThrow()

    expect(toastErrorMock).toHaveBeenCalledWith('Не удалось загрузить объявления')
  })
  it('uses gateway URL for listings fetches', async () => {
    const { listingsService } = await import('../listings.api')
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            hasMore: false,
            sources: [],
          }),
          { status: 200 }
        )
      ) as typeof fetch

    await listingsService.fetchListings({ page: 1, pageSize: 20 })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/listings?page=1&pageSize=20',
      expect.any(Object)
    )
  })

  it('uses gateway URL for create imports', async () => {
    const { listingsService } = await import('../listings.api')
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            processed: 1,
            created: 1,
            updated: 0,
            skipped: 0,
            failed: 0,
            errors: [],
          }),
          { status: 200 }
        )
      ) as typeof fetch

    await listingsService.createListing({ url: 'https://example.test/flat' })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/v1/data/import',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"updateExisting":false'),
      })
    )
  })

  it('uses gateway URLs for update delete and export', async () => {
    const { listingsService } = await import('../listings.api')
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const remove = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(() => {})
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:csv')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 7,
            url: 'https://example.test/flat',
            images: [],
            manualOverrides: [],
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        new Response(new Blob(['ID\n'], { type: 'text/csv' }), {
          status: 200,
          headers: { 'Content-Disposition': 'attachment; filename="listings.csv"' },
        })
      ) as typeof fetch

    await listingsService.updateListing(7, { title: 'Updated' })
    await listingsService.deleteListing(7)
    await listingsService.exportCsv({ fields: ['id'] })

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/v1/listings/7',
      expect.objectContaining({ method: 'PATCH' })
    )
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/v1/listings/7',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      3,
      '/api/v1/listings/export?fields=id',
      expect.any(Object)
    )

    appendChild.mockRestore()
    click.mockRestore()
    remove.mockRestore()
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })
})
