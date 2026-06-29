import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { VkFriendsExportPage } from '../VkFriendsExportPage'

const mockStartExport = vi.fn()
const mockDownload = vi.fn()
const mockUseStream = vi.fn()

vi.mock('../../../shared/api/vk-friends', () => ({
  startVkFriendsExport: (...args: unknown[]) => mockStartExport(...args),
  downloadVkFriendsXlsx: (...args: unknown[]) => mockDownload(...args),
  getVkFriendsStreamUrl: (jobId: string) => `/api/v1/vk/friends/jobs/${jobId}/stream`,
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

const runningState = {
  logs: [
    { type: 'log', data: { level: 'info' as const, message: 'Starting export...', meta: null } },
  ],
  progress: { fetchedCount: 5, totalCount: 50 },
  status: 'running' as const,
  xlsxPath: null,
  error: null,
  reset: vi.fn(),
}

const doneState = {
  logs: [
    { type: 'log', data: { level: 'info' as const, message: 'Export complete', meta: null } },
  ],
  progress: { fetchedCount: 50, totalCount: 50 },
  status: 'done' as const,
  xlsxPath: '/tmp/file.xlsx',
  error: null,
  reset: vi.fn(),
}

const errorState = {
  logs: [],
  progress: { fetchedCount: 0, totalCount: 0 },
  status: 'error' as const,
  xlsxPath: null,
  error: 'Export failed',
  reset: vi.fn(),
}

describe('VkFriendsExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStream.mockReturnValue(idleState)
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders page title', () => {
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Экспорт друзей VK')).toBeInTheDocument()
  })

  it('renders export form', () => {
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getByLabelText('ID пользователя VK')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Запустить экспорт' })).toBeInTheDocument()
  })

  it('shows validation error on empty submit', async () => {
    const user = userEvent.setup()
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(screen.getByText('Введите ID пользователя VK')).toBeInTheDocument()
  })

  it('calls startExport on valid submit', async () => {
    mockStartExport.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    const user = userEvent.setup()
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    const input = screen.getByLabelText('ID пользователя VK')
    await user.type(input, '12345')
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    expect(mockStartExport).toHaveBeenCalledWith({
      user_id: 12345,
      count: 5000,
      offset: 0,
      fields: ['photo_100', 'city', 'country', 'domain', 'sex', 'bdate', 'status', 'last_seen', 'verified'],
    }, expect.any(Object))
  })

  it('shows running state with progress and logs', () => {
    mockUseStream.mockReturnValue(runningState)
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Выполняется')).toBeInTheDocument()
    expect(screen.getByText('Starting export...')).toBeInTheDocument()
  })

  it('shows done state with download button', () => {
    mockUseStream.mockReturnValue(doneState)
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getAllByText('Экспорт завершён').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: 'Скачать XLSX' })).toBeInTheDocument()
    expect(screen.getAllByText('50', { exact: false }).length).toBeGreaterThanOrEqual(1)
  })

  it('downloads XLSX on button click', async () => {
    mockStartExport.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    mockDownload.mockResolvedValueOnce(new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    mockUseStream
      .mockReturnValueOnce(idleState)
      .mockReturnValue(doneState)
    const user = userEvent.setup()
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    const input = screen.getByLabelText('ID пользователя VK')
    await user.type(input, '12345')
    await user.click(screen.getByRole('button', { name: 'Запустить экспорт' }))
    await user.click(screen.getByRole('button', { name: 'Скачать XLSX' }))
    expect(mockDownload).toHaveBeenCalledWith('job-1')
  })

  it('shows error state', () => {
    mockUseStream.mockReturnValue(errorState)
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    expect(screen.getAllByText('Export failed').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument()
  })

  it('resets state on "Новый экспорт" click', async () => {
    const mockReset = vi.fn()
    mockUseStream.mockReturnValue({ ...doneState, reset: mockReset })
    const user = userEvent.setup()
    render(<VkFriendsExportPage />, { wrapper: createWrapper() })
    await user.click(screen.getByRole('button', { name: 'Новый экспорт' }))
    expect(mockReset).toHaveBeenCalled()
  })
})
