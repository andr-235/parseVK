import { beforeEach, describe, expect, it, vi } from 'vitest'

const { toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}))

const saveReportBlobMock = vi.hoisted(() => vi.fn())

vi.mock('react-hot-toast', () => ({
  default: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}))

vi.mock('@/shared/utils', () => ({
  saveReportBlob: saveReportBlobMock,
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

describe('telegramDlUploadService.match workflow', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('loads contacts and match runs for the workspace', async () => {
    const { telegramDlUploadService } = await import('../telegramDlUpload.api')
    const matchService = telegramDlUploadService as unknown as {
      getContacts: () => Promise<unknown>
      getMatchRuns: () => Promise<unknown>
    }

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: '1',
              importFileId: '10',
              originalFileName: 'groupexport_ab3army_2024-10-15.xlsx',
              telegramId: '123456',
              username: 'user_one',
              phone: '79990000001',
              firstName: 'Иван',
              lastName: 'Иванов',
              fullName: 'Иван Иванов',
              region: 'Москва',
              sourceRowIndex: 2,
              description: 'Контакт из DL',
              joinedAt: '2024-01-01T00:00:00.000Z',
              address: 'Москва',
              vkUrl: null,
              email: null,
              telegramContact: null,
              instagram: null,
              viber: null,
              odnoklassniki: null,
              birthDateText: null,
              usernameExtra: null,
              geo: null,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              id: 'run-1',
              status: 'DONE',
              contactsTotal: 1,
              matchesTotal: 1,
              strictMatchesTotal: 1,
              usernameMatchesTotal: 0,
              phoneMatchesTotal: 0,
              createdAt: '2024-03-25T10:00:00.000Z',
              finishedAt: '2024-03-25T10:00:01.000Z',
              error: null,
            },
          ]),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      ) as typeof fetch

    await expect(matchService.getContacts()).resolves.toEqual([
      {
        id: '1',
        importFileId: '10',
        originalFileName: 'groupexport_ab3army_2024-10-15.xlsx',
        telegramId: '123456',
        username: 'user_one',
        phone: '79990000001',
        firstName: 'Иван',
        lastName: 'Иванов',
        fullName: 'Иван Иванов',
        region: 'Москва',
        sourceRowIndex: 2,
        description: 'Контакт из DL',
        joinedAt: '2024-01-01T00:00:00.000Z',
        address: 'Москва',
        vkUrl: null,
        email: null,
        telegramContact: null,
        instagram: null,
        viber: null,
        odnoklassniki: null,
        birthDateText: null,
        usernameExtra: null,
        geo: null,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ])

    await expect(matchService.getMatchRuns()).resolves.toEqual([
      {
        id: 'run-1',
        status: 'DONE',
        contactsTotal: 1,
        matchesTotal: 1,
        strictMatchesTotal: 1,
        usernameMatchesTotal: 0,
        phoneMatchesTotal: 0,
        createdAt: '2024-03-25T10:00:00.000Z',
        finishedAt: '2024-03-25T10:00:01.000Z',
        error: null,
      },
    ])
  })

  it('starts a match run and exports xlsx results', async () => {
    const { telegramDlUploadService } = await import('../telegramDlUpload.api')
    const matchService = telegramDlUploadService as unknown as {
      createMatchRun: () => Promise<{ id: string; status: string }>
      exportMatchRun: (runId: string) => Promise<void>
    }

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'run-2',
            status: 'DONE',
            contactsTotal: 1,
            matchesTotal: 1,
            strictMatchesTotal: 1,
            usernameMatchesTotal: 0,
            phoneMatchesTotal: 0,
            createdAt: '2024-03-25T10:00:00.000Z',
            finishedAt: '2024-03-25T10:00:01.000Z',
            error: null,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response('xlsx-bytes', {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="telegram_dl_match_run-2.xlsx"',
          },
        })
      ) as typeof fetch

    await expect(matchService.createMatchRun()).resolves.toEqual(
      expect.objectContaining({
        id: 'run-2',
        status: 'DONE',
      })
    )

    await matchService.exportMatchRun('run-2')

    expect(saveReportBlobMock).toHaveBeenCalledTimes(1)
    expect(saveReportBlobMock).toHaveBeenCalledWith(
      expect.anything(),
      'telegram_dl_match_run-2.xlsx'
    )
  })
})
