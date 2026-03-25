import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import TelegramDlUploadPage from '../components/TelegramDlUploadPage'
import { telegramDlUploadService } from '../api/telegramDlUpload.api'

const { defaultMatchResults } = vi.hoisted(() => ({
  defaultMatchResults: [
    {
      id: 'result-1',
      runId: 'run-2',
      dlContactId: '1',
      tgmbaseUserId: '1001',
      strictTelegramIdMatch: true,
      usernameMatch: false,
      phoneMatch: false,
      chatActivityMatch: true,
      createdAt: '2024-03-25T10:00:01.000Z',
      dlContact: {
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
      },
      user: {
        id: '1001',
        user_id: '123456',
        bot: false,
        scam: false,
        premium: true,
        first_name: 'Иван',
        last_name: 'Иванов',
        username: 'user_one',
        phone: '79990000001',
        upd_date: '2024-03-25T10:00:00.000Z',
        relatedChats: [
          {
            type: 'supergroup' as const,
            peer_id: '9001',
            title: 'Supergroup Alpha',
          },
          {
            type: 'channel' as const,
            peer_id: '9002',
            title: 'Channel Alpha',
          },
        ],
      },
    },
    {
      id: 'result-2',
      runId: 'run-2',
      dlContactId: '2',
      tgmbaseUserId: '1002',
      strictTelegramIdMatch: false,
      usernameMatch: false,
      phoneMatch: false,
      chatActivityMatch: true,
      createdAt: '2024-03-25T10:00:02.000Z',
      dlContact: {
        id: '2',
        importFileId: '11',
        originalFileName: 'chat-only.xlsx',
        telegramId: null,
        username: null,
        phone: null,
        firstName: 'Петр',
        lastName: 'Петров',
        fullName: 'Петр Петров',
        region: 'СПб',
        sourceRowIndex: 3,
      },
      user: {
        id: '1002',
        user_id: '654321',
        bot: false,
        scam: false,
        premium: false,
        first_name: 'Петр',
        last_name: 'Петров',
        username: 'chat_only',
        phone: null,
        upd_date: '2024-03-25T10:00:00.000Z',
        relatedChats: [
          {
            type: 'supergroup' as const,
            peer_id: '9100',
            title: 'Excluded Candidate Chat',
          },
        ],
      },
    },
  ],
}))

vi.mock('../api/telegramDlUpload.api', () => ({
  telegramDlUploadService: {
    getFiles: vi.fn().mockResolvedValue([]),
    getContacts: vi.fn().mockResolvedValue({
      items: [
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
      ],
      total: 241,
      limit: 100,
      offset: 0,
    }),
    getMatchRuns: vi.fn().mockResolvedValue([
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
    getMatchRun: vi.fn().mockImplementation(async (runId: string) => ({
      id: runId,
      status: 'DONE',
      contactsTotal: 1,
      matchesTotal: 1,
      strictMatchesTotal: 1,
      usernameMatchesTotal: 0,
      phoneMatchesTotal: 0,
      createdAt: '2024-03-25T10:00:00.000Z',
      finishedAt: '2024-03-25T10:00:01.000Z',
      error: null,
    })),
    getMatchResults: vi.fn().mockResolvedValue(defaultMatchResults),
    getMatchResultMessages: vi.fn().mockImplementation(async (_runId: string, resultId: string) => {
      if (resultId === 'result-2') {
        return [
          {
            peerId: '9100',
            chatType: 'supergroup',
            title: 'Excluded Candidate Chat',
            isExcluded: false,
            messages: [
              {
                messageId: '90001',
                messageDate: '2024-03-25T10:05:00.000Z',
                text: 'Комментарий только из исключаемого чата',
              },
            ],
          },
        ]
      }

      return [
        {
          peerId: '9001',
          chatType: 'supergroup',
          title: 'Supergroup Alpha',
          isExcluded: false,
          messages: [
            {
              messageId: '50001',
              messageDate: '2024-03-25T10:02:00.000Z',
              text: 'Первый комментарий в Supergroup Alpha',
            },
          ],
        },
      ]
    }),
    excludeChat: vi.fn().mockResolvedValue({
      id: 'run-2',
      status: 'DONE',
      contactsTotal: 100,
      matchesTotal: 1,
      strictMatchesTotal: 1,
      usernameMatchesTotal: 0,
      phoneMatchesTotal: 0,
      createdAt: '2024-03-25T10:00:00.000Z',
      finishedAt: '2024-03-25T10:01:00.000Z',
      error: null,
    }),
    restoreChat: vi.fn().mockResolvedValue({
      id: 'run-2',
      status: 'DONE',
      contactsTotal: 100,
      matchesTotal: 2,
      strictMatchesTotal: 1,
      usernameMatchesTotal: 0,
      phoneMatchesTotal: 0,
      createdAt: '2024-03-25T10:00:00.000Z',
      finishedAt: '2024-03-25T10:01:00.000Z',
      error: null,
    }),
    createMatchRun: vi.fn().mockResolvedValue({
      id: 'run-2',
      status: 'RUNNING',
      contactsTotal: 0,
      matchesTotal: 0,
      strictMatchesTotal: 0,
      usernameMatchesTotal: 0,
      phoneMatchesTotal: 0,
      createdAt: '2024-03-25T10:00:00.000Z',
      finishedAt: null,
      error: null,
    }),
    exportMatchRun: vi.fn().mockResolvedValue(undefined),
    upload: vi.fn().mockResolvedValue({
      batch: {
        id: '1',
        status: 'DONE',
        filesTotal: 1,
        filesSuccess: 1,
        filesFailed: 0,
      },
      files: [
        {
          id: '11',
          originalFileName: 'groupexport_ab3army_2024-10-15.xlsx',
          status: 'DONE',
          rowsTotal: 5,
          rowsSuccess: 5,
          rowsFailed: 0,
          isActive: true,
          replacedFileId: null,
          error: null,
        },
      ],
    }),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(telegramDlUploadService.getFiles).mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
})

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TelegramDlUploadPage />
    </QueryClientProvider>
  )
}

describe('TelegramDlUploadPage', () => {
  it('starts on the import tab and shows upload workspace', () => {
    renderPage()

    expect(screen.getByText('Выгрузка с ДЛ')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Импорт DL/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /Матчинг DL/i })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(screen.getByText('История загрузок')).toBeInTheDocument()
    expect(screen.getByText(/Загружаю историю|Пока нет загруженных файлов/)).toBeInTheDocument()
    expect(screen.queryByText('Полная DL-база')).not.toBeInTheDocument()
  })

  it('switches to the match tab and renders the full DL table', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('tab', { name: /Матчинг DL/i }))

    expect(screen.getByRole('tab', { name: /Импорт DL/i })).toHaveAttribute(
      'aria-selected',
      'false'
    )
    expect(screen.getByRole('tab', { name: /Матчинг DL/i })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(await screen.findByText('Полная DL-база')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Найти совпадения в tgmbase/i })).toBeInTheDocument()
    expect(await screen.findByText('groupexport_ab3army_2024-10-15.xlsx')).toBeInTheDocument()
    expect(screen.getByText(/telegramId:\s*123456/i)).toBeInTheDocument()
    expect(screen.getByText('Всего: 241')).toBeInTheDocument()
    expect(screen.getByText('Страница: 1 / 3')).toBeInTheDocument()
  })

  it('switches contacts pages in the match tab', async () => {
    const user = userEvent.setup()
    vi.mocked(telegramDlUploadService.getContacts)
      .mockResolvedValueOnce({
        items: [
          {
            id: '1',
            importFileId: '10',
            originalFileName: 'page-1.xlsx',
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
        ],
        total: 241,
        limit: 100,
        offset: 0,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: '2',
            importFileId: '11',
            originalFileName: 'page-2.xlsx',
            telegramId: '654321',
            username: 'user_two',
            phone: '79990000002',
            firstName: 'Петр',
            lastName: 'Петров',
            fullName: 'Петр Петров',
            region: 'СПб',
            sourceRowIndex: 3,
            description: 'Контакт из DL',
            joinedAt: '2024-01-02T00:00:00.000Z',
            address: 'СПб',
            vkUrl: null,
            email: null,
            telegramContact: null,
            instagram: null,
            viber: null,
            odnoklassniki: null,
            birthDateText: null,
            usernameExtra: null,
            geo: null,
            createdAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        total: 241,
        limit: 100,
        offset: 100,
      })

    renderPage()

    await user.click(screen.getByRole('tab', { name: /Матчинг DL/i }))
    await screen.findByText('page-1.xlsx')

    await user.click(screen.getByRole('button', { name: /Следующая страница/i }))

    expect(await screen.findByText('page-2.xlsx')).toBeInTheDocument()
    expect(screen.getByText('Страница: 2 / 3')).toBeInTheDocument()
  })

  it('runs matching, shows results, exports xlsx, and switches back to contacts', async () => {
    const matchService = telegramDlUploadService as unknown as {
      exportMatchRun: (runId: string) => Promise<void>
    }
    vi.mocked(telegramDlUploadService.getMatchRun).mockResolvedValue({
      id: 'run-2',
      status: 'DONE',
      contactsTotal: 100,
      matchesTotal: 5,
      strictMatchesTotal: 3,
      usernameMatchesTotal: 1,
      phoneMatchesTotal: 1,
      createdAt: '2024-03-25T10:00:00.000Z',
      finishedAt: '2024-03-25T10:01:00.000Z',
      error: null,
    })
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: /Матчинг DL/i }))
    expect(await screen.findByText('Полная DL-база')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Найти совпадения в tgmbase/i }))

    expect(await screen.findByText('Совпадения tgmbase')).toBeInTheDocument()
    expect(screen.getAllByText('Иван Иванов').length).toBeGreaterThan(0)
    expect(screen.getByText('Связи tgmbase')).toBeInTheDocument()
    expect(screen.getAllByText('Chat activity match').length).toBeGreaterThan(0)
    expect(screen.getByText(/supergroup: Supergroup Alpha \(9001\)/i)).toBeInTheDocument()
    expect(screen.getByText(/channel: Channel Alpha \(9002\)/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Выгрузить XLSX/i })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: /Выгрузить XLSX/i }))
    await waitFor(() => {
      expect(matchService.exportMatchRun).toHaveBeenCalledWith('run-2')
    })

    fireEvent.click(screen.getByRole('button', { name: /Показать всю DL-базу/i }))
    expect(await screen.findByText('Полная DL-база')).toBeInTheDocument()
  })

  it('loads comments and excludes chats that only hold chat activity matches', async () => {
    const user = userEvent.setup()
    vi.mocked(telegramDlUploadService.getMatchResults)
      .mockResolvedValueOnce(defaultMatchResults)
      .mockResolvedValueOnce([defaultMatchResults[0]])

    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: /Матчинг DL/i }))
    await screen.findByText('Полная DL-база')
    fireEvent.click(screen.getByRole('button', { name: /Найти совпадения в tgmbase/i }))

    expect((await screen.findAllByText('Петр Петров')).length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('button', { name: /Комментарии/i })[1])
    expect(await screen.findByText('Комментарий только из исключаемого чата')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Исключить чат 9100/i }))

    await waitFor(() => {
      expect(telegramDlUploadService.excludeChat).toHaveBeenCalledWith('run-2', '9100')
    })
    await waitFor(() => {
      expect(
        vi.mocked(telegramDlUploadService.getMatchResults).mock.calls.length
      ).toBeGreaterThanOrEqual(2)
    })
  })

  it('polls active run until status becomes done', async () => {
    vi.mocked(telegramDlUploadService.createMatchRun).mockResolvedValue({
      id: 'run-poll',
      status: 'RUNNING',
      contactsTotal: 0,
      matchesTotal: 0,
      strictMatchesTotal: 0,
      usernameMatchesTotal: 0,
      phoneMatchesTotal: 0,
      createdAt: '2024-03-25T10:00:00.000Z',
      finishedAt: null,
      error: null,
    })
    vi.mocked(telegramDlUploadService.getMatchRun)
      .mockResolvedValueOnce({
        id: 'run-poll',
        status: 'RUNNING',
        contactsTotal: 100,
        matchesTotal: 10,
        strictMatchesTotal: 8,
        usernameMatchesTotal: 1,
        phoneMatchesTotal: 1,
        createdAt: '2024-03-25T10:00:00.000Z',
        finishedAt: null,
        error: null,
      })
      .mockResolvedValueOnce({
        id: 'run-poll',
        status: 'DONE',
        contactsTotal: 100,
        matchesTotal: 10,
        strictMatchesTotal: 8,
        usernameMatchesTotal: 1,
        phoneMatchesTotal: 1,
        createdAt: '2024-03-25T10:00:00.000Z',
        finishedAt: '2024-03-25T10:01:00.000Z',
        error: null,
      })

    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: /Матчинг DL/i }))
    expect(await screen.findByText('Полная DL-база')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Найти совпадения в tgmbase/i }))

    expect(await screen.findByText(/Матчинг выполняется/i)).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 3200))
    await waitFor(() => {
      expect(telegramDlUploadService.getMatchRun).toHaveBeenCalledTimes(2)
    })
  }, 10000)

  it('tracks multiple selected files in the upload card', () => {
    renderPage()

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(input).not.toBeNull()

    const files = [
      new File(['a'], 'groupexport_ab3army_2024-10-15.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      new File(['b'], 'groupexport_center_ma_2024-03-16.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    ]

    fireEvent.change(input!, { target: { files } })

    expect(screen.getByText('Выбрано файлов: 2')).toBeInTheDocument()
    expect(screen.getByText('groupexport_ab3army_2024-10-15.xlsx')).toBeInTheDocument()
    expect(screen.getByText('groupexport_center_ma_2024-03-16.xlsx')).toBeInTheDocument()
  })

  it('uploads selected files and shows backend statuses', async () => {
    renderPage()

    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(input).not.toBeNull()

    const file = new File(['a'], 'groupexport_ab3army_2024-10-15.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    fireEvent.change(input!, { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /Загрузить в tgmbase/i }))

    expect(await screen.findByText('DONE')).toBeInTheDocument()
    expect(telegramDlUploadService.upload).toHaveBeenCalledTimes(1)
  })

  it('renders failed files in history', async () => {
    vi.mocked(telegramDlUploadService.getFiles).mockResolvedValue([
      {
        id: 'failed-1',
        originalFileName: 'broken-file.xlsx',
        status: 'FAILED',
        rowsTotal: 0,
        rowsSuccess: 0,
        rowsFailed: 0,
        isActive: false,
        replacedFileId: null,
        error: 'Файл поврежден',
      },
    ])

    renderPage()

    expect(await screen.findByText('broken-file.xlsx')).toBeInTheDocument()
    expect(screen.getByText(/Статус: FAILED/)).toBeInTheDocument()
  })
})
