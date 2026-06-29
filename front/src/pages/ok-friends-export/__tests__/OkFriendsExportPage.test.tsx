import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { OkFriendsExportPage } from '../OkFriendsExportPage'

const mockStartExport = vi.fn()
const mockDownload = vi.fn()
const mockUseStream = vi.fn()

vi.mock('../../../shared/api/ok-friends', () => ({
  startOkFriendsExport: (...args: unknown[]) => mockStartExport(...args),
  downloadOkFriendsXlsx: (...args: unknown[]) => mockDownload(...args),
  getOkFriendsStreamUrl: (jobId: string) => `/api/v1/ok/friends/jobs/${jobId}/stream`,
}))

vi.mock('../../../shared/hooks/useFriendsExportStream', () => ({
  useFriendsExportStream: (...args: unknown[]) => mockUseStream(...args),
}))

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={qc}>{children}</QueryClientProvider>
      </MemoryRouter>
    )
  }
}

const idleState = {
  logs: [],
  progress: { fetchedCount: 0, totalCount: 0 },
  status: 'idle' as const,
  xlsxPath: null,
  error: null,
  reset: vi.fn(),
}

const doneState = {
  logs: [
    { type: 'log', data: { level: 'info' as const, message: 'Export complete', meta: null } },
  ],
  progress: { fetchedCount: 30, totalCount: 30 },
  status: 'done' as const,
  xlsxPath: '/tmp/ok.xlsx',
  error: null,
  reset: vi.fn(),
}

describe('OkFriendsExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStream.mockReturnValue(idleState)
  })

  it('renders page title', () => {
    render(<OkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Экспорт друзей OK')).toBeInTheDocument()
  })

  it('renders export form', () => {
    render(<OkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getByLabelText('ID пользователя OK (fid)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запустить экспорт' })).toBeInTheDocument()
  })

  it('shows validation error on empty submit', async () => {
    const user = userEvent.setup()
    render(<OkFriendsExportPage />, { wrapper: createWrapper() })
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(screen.getByText('Введите ID пользователя OK')).toBeInTheDocument()
  })

  it('shows validation error on non-numeric fid', async () => {
    const user = userEvent.setup()
    render(<OkFriendsExportPage />, { wrapper: createWrapper() })
    const input = screen.getByLabelText('ID пользователя OK (fid)')
    await user.type(input, 'abc')
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(screen.getByText('ID должен содержать только цифры')).toBeInTheDocument()
  })

  it('calls startExport on valid submit', async () => {
    mockStartExport.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    const user = userEvent.setup()
    render(<OkFriendsExportPage />, { wrapper: createWrapper() })
    const input = screen.getByLabelText('ID пользователя OK (fid)')
    await user.type(input, '67890')
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(mockStartExport).toHaveBeenCalledWith({ fid: '67890' }, expect.any(Object))
  })

  it('shows done state with download button', () => {
    mockUseStream.mockReturnValue(doneState)
    render(<OkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getAllByText('Экспорт завершён').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: 'Скачать XLSX' })).toBeInTheDocument()
  })

  it('downloads XLSX on button click', async () => {
    mockStartExport.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    mockDownload.mockResolvedValueOnce(new Blob(['ok'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    mockUseStream
      .mockReturnValueOnce(idleState)
      .mockReturnValue(doneState)
    const user = userEvent.setup()
    render(<OkFriendsExportPage />, { wrapper: createWrapper() })
    const input = screen.getByLabelText('ID пользователя OK (fid)')
    await user.type(input, '67890')
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    await user.click(screen.getByRole('button', { name: 'Скачать XLSX' }))
    expect(mockDownload).toHaveBeenCalledWith('job-1')
  })
})
