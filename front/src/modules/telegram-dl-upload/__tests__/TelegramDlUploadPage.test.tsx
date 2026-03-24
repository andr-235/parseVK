import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TelegramDlUploadPage from '../components/TelegramDlUploadPage'
import { telegramDlUploadService } from '../api/telegramDlUpload.api'

vi.mock('../api/telegramDlUpload.api', () => ({
  telegramDlUploadService: {
    getFiles: vi.fn().mockResolvedValue([]),
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
})
