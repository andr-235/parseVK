import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { FriendsExportPage, type PlatformExportConfig } from '../FriendsExportPage'

const mockStartExport = vi.fn()
const mockDownload = vi.fn()
const mockUseStream = vi.fn()

vi.mock('../../../shared/hooks/useFriendsExportStream', () => ({
  useFriendsExportStream: (...args: unknown[]) => mockUseStream(...args),
}))

const TestForm = vi.fn(({ onSubmit, disabled, isLoading }: {
  onSubmit: (params: { test: string }) => void
  disabled: boolean
  isLoading: boolean
}) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit({ test: 'ok' }) }}>
    <button type="submit" disabled={disabled || isLoading}>Test Submit</button>
  </form>
))

const testConfig: PlatformExportConfig<{ test: string }> = {
  title: 'Test Export',
  description: 'Test description.',
  FormComponent: TestForm,
  startExport: mockStartExport,
  downloadXlsx: mockDownload,
  getStreamUrl: (jobId: string) => `/api/v1/test/jobs/${jobId}/stream`,
  platform: 'vk',
  downloadFileName: 'test_export',
}

const idleState = {
  logs: [],
  progress: { fetchedCount: 0, totalCount: 0 },
  status: 'idle' as const,
  xlsxPath: null,
  error: null,
  retryAttempt: 0,
  maxRetries: 5,
  reset: vi.fn(),
}

const doneState = {
  logs: [],
  progress: { fetchedCount: 10, totalCount: 10 },
  status: 'done' as const,
  xlsxPath: '/tmp/test.xlsx',
  error: null,
  retryAttempt: 0,
  maxRetries: 5,
  reset: vi.fn(),
}

const errorState = {
  logs: [],
  progress: { fetchedCount: 0, totalCount: 0 },
  status: 'error' as const,
  xlsxPath: null,
  error: 'Something went wrong',
  retryAttempt: 0,
  maxRetries: 5,
  reset: vi.fn(),
}

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

describe('FriendsExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStream.mockReturnValue(idleState)
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders title and description', () => {
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    expect(screen.getByText('Test Export')).toBeInTheDocument()
    expect(screen.getByText('Test description.')).toBeInTheDocument()
  })

  it('renders form component', () => {
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: 'Test Submit' })).toBeInTheDocument()
  })

  it('shows idle state initially', () => {
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    expect(screen.getByText('Ожидание запуска')).toBeInTheDocument()
  })

  it('shows done state with download button', () => {
    mockUseStream.mockReturnValue(doneState)
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: 'Скачать XLSX' })).toBeInTheDocument()
  })

  it('calls startExport on form submit', async () => {
    mockStartExport.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    const user = userEvent.setup()
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    await user.click(screen.getByRole('button', { name: 'Test Submit' }))
    expect(mockStartExport).toHaveBeenCalledWith(expect.objectContaining({ test: 'ok' }), expect.any(Object))
  })

  it('shows error state', () => {
    mockUseStream.mockReturnValue(errorState)
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    expect(screen.getAllByText('Something went wrong').length).toBeGreaterThanOrEqual(1)
  })

  it('shows retry button on error', () => {
    mockUseStream.mockReturnValue(errorState)
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    expect(screen.getByRole('button', { name: 'Попробовать снова' })).toBeInTheDocument()
  })

  it('downloads XLSX on button click', async () => {
    mockStartExport.mockResolvedValueOnce({ jobId: 'job-1', status: 'PENDING' })
    mockDownload.mockResolvedValueOnce(new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    mockUseStream
      .mockReturnValueOnce(idleState)
      .mockReturnValue(doneState)
    const user = userEvent.setup()
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    await user.click(screen.getByRole('button', { name: 'Test Submit' }))
    await user.click(screen.getByRole('button', { name: 'Скачать XLSX' }))
    expect(mockDownload).toHaveBeenCalledWith('job-1')
  })

  it('resets on "Новый экспорт" click', async () => {
    const mockReset = vi.fn()
    mockUseStream.mockReturnValue({ ...doneState, reset: mockReset })
    const user = userEvent.setup()
    render(<FriendsExportPage config={testConfig} />, { wrapper: createWrapper() })
    await user.click(screen.getByRole('button', { name: 'Новый экспорт' }))
    expect(mockReset).toHaveBeenCalled()
  })
})
