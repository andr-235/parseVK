import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import TelegramDlUploadPage from '../components/TelegramDlUploadPage'
import { telegramDlUploadService } from '../api/telegramDlUpload.api'

vi.mock('../api/telegramDlUpload.api', () => ({
  telegramDlUploadService: {
    getFiles: vi.fn().mockResolvedValue([]),
    getContacts: vi.fn().mockResolvedValue([
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
    getMatchResults: vi.fn().mockResolvedValue([
      {
        id: 'result-1',
        runId: 'run-2',
        dlContactId: '1',
        tgmbaseUserId: '1001',
        strictTelegramIdMatch: true,
        usernameMatch: false,
        phoneMatch: false,
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
        },
      },
    ]),
    createMatchRun: vi.fn().mockResolvedValue({
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
  it('renders the upload shell and history placeholder', () => {
    renderPage()

    expect(screen.getByText('Выгрузка с ДЛ')).toBeInTheDocument()
    expect(screen.getByText(/Можно выбрать несколько XLSX файлов/)).toBeInTheDocument()
    expect(screen.getByText('История загрузок')).toBeInTheDocument()
    expect(screen.getByText(/Загружаю историю|Пока нет загруженных файлов/)).toBeInTheDocument()
  })

  it('renders the full DL table and match controls', async () => {
    renderPage()

    expect(await screen.findByText('Полная DL-база')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Найти совпадения в tgmbase/i })).toBeInTheDocument()
    expect(await screen.findByText('groupexport_ab3army_2024-10-15.xlsx')).toBeInTheDocument()
    expect(screen.getByText(/telegramId:\s*123456/i)).toBeInTheDocument()
  })

  it('runs matching, shows results, exports xlsx, and switches back to contacts', async () => {
    const user = userEvent.setup()
    const matchService = telegramDlUploadService as unknown as {
      exportMatchRun: (runId: string) => Promise<void>
    }
    renderPage()

    await user.click(await screen.findByRole('button', { name: /Найти совпадения в tgmbase/i }))

    expect(await screen.findByText('Совпадения tgmbase')).toBeInTheDocument()
    expect(screen.getAllByText('Иван Иванов').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Выгрузить XLSX/i })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /Выгрузить XLSX/i }))
    expect(matchService.exportMatchRun).toHaveBeenCalledWith('run-2')

    await user.click(screen.getByRole('button', { name: /Показать все DL/i }))
    expect(await screen.findByText('Полная DL-база')).toBeInTheDocument()
  })

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
