import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import TelegramSyncCard from '../TelegramSyncCard'

const mockUseTelegramSync = vi.fn()

vi.mock('@/modules/telegram/hooks/useTelegramSync', () => ({
  useTelegramSync: (...args: unknown[]) => mockUseTelegramSync(...args),
}))

describe('TelegramSyncCard', () => {
  it('renders members sync mode by default', () => {
    mockUseTelegramSync.mockReturnValue({
      identifier: '',
      setIdentifier: vi.fn(),
      syncMode: 'members',
      setSyncMode: vi.fn(),
      discussionMode: 'thread',
      setDiscussionMode: vi.fn(),
      limit: '1000',
      setLimit: vi.fn(),
      messageId: '',
      setMessageId: vi.fn(),
      dateFrom: '',
      setDateFrom: vi.fn(),
      dateTo: '',
      setDateTo: vi.fn(),
      messageLimit: '200',
      setMessageLimit: vi.fn(),
      authorLimit: '1000',
      setAuthorLimit: vi.fn(),
      loading: false,
      lastSyncData: null,
      errorMessage: null,
      handleSubmit: vi.fn((event) => event.preventDefault()),
      handleExport: vi.fn(),
    })

    render(<TelegramSyncCard onDataLoaded={vi.fn()} />)

    expect(screen.getByText('Участники')).toBeInTheDocument()
    expect(screen.getByText('Лимит участников')).toBeInTheDocument()
    expect(screen.getByText(/Для первого импорта используйте @username/)).toBeInTheDocument()
  })

  it('renders discussion controls for thread mode', () => {
    mockUseTelegramSync.mockReturnValue({
      identifier: 'https://t.me/c/1949542659/115914',
      setIdentifier: vi.fn(),
      syncMode: 'commentAuthors',
      setSyncMode: vi.fn(),
      discussionMode: 'thread',
      setDiscussionMode: vi.fn(),
      limit: '1000',
      setLimit: vi.fn(),
      messageId: '',
      setMessageId: vi.fn(),
      dateFrom: '',
      setDateFrom: vi.fn(),
      dateTo: '',
      setDateTo: vi.fn(),
      messageLimit: '200',
      setMessageLimit: vi.fn(),
      authorLimit: '1000',
      setAuthorLimit: vi.fn(),
      loading: false,
      lastSyncData: null,
      errorMessage: null,
      handleSubmit: vi.fn((event) => event.preventDefault()),
      handleExport: vi.fn(),
    })

    render(<TelegramSyncCard onDataLoaded={vi.fn()} />)

    expect(screen.getByText('Комментаторы обсуждения')).toBeInTheDocument()
    expect(screen.getByText('Режим обсуждения')).toBeInTheDocument()
    expect(screen.getByText('Один тред')).toBeInTheDocument()
    expect(screen.getByText('Message ID, если его нет в ссылке')).toBeInTheDocument()
  })
})
