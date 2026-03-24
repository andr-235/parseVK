import { beforeEach, describe, expect, it, vi } from 'vitest'

const { toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}))

const createUploadResponse = (startIndex: number, count: number) => ({
  batch: {
    id: String(startIndex),
    status: 'DONE',
    filesTotal: count,
    filesSuccess: count,
    filesFailed: 0,
  },
  files: Array.from({ length: count }, (_, index) => ({
    id: String(startIndex + index),
    originalFileName: `file-${startIndex + index}.xlsx`,
    status: 'DONE',
    rowsTotal: 10,
    rowsSuccess: 10,
    rowsFailed: 0,
    isActive: true,
    replacedFileId: null,
    error: null,
  })),
})

describe('telegramDlUploadService.upload', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('uploads files in chunks and aggregates statuses', async () => {
    const { telegramDlUploadService } = await import('../telegramDlUpload.api')
    const files = Array.from(
      { length: 45 },
      (_, index) =>
        new File([`content-${index}`], `file-${index}.xlsx`, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
    )

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createUploadResponse(1, 20)), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createUploadResponse(21, 20)), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(createUploadResponse(41, 5)), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      ) as typeof fetch

    const result = await telegramDlUploadService.upload(files)

    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    expect(
      (
        (
          (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock
            .calls[0]?.[1] as RequestInit
        ).body as FormData
      ).getAll('files').length
    ).toBe(20)
    expect(
      (
        (
          (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock
            .calls[2]?.[1] as RequestInit
        ).body as FormData
      ).getAll('files').length
    ).toBe(5)
    expect(result.batch.filesTotal).toBe(45)
    expect(result.batch.filesSuccess).toBe(45)
    expect(result.files).toHaveLength(45)
    expect(toastSuccessMock).toHaveBeenCalled()
  })
})
