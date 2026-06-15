import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { WatchlistPage } from '../WatchlistPage'
import * as watchlistApi from '../../../shared/api/watchlist'

vi.mock('../../../shared/api/watchlist', () => ({
  fetchWatchlistAuthors: vi.fn(),
  createWatchlistAuthor: vi.fn(),
  fetchWatchlistAuthorDetails: vi.fn(),
  updateWatchlistAuthor: vi.fn(),
  deleteWatchlistAuthor: vi.fn(),
  fetchWatchlistSettings: vi.fn(),
  updateWatchlistSettings: vi.fn(),
  refreshWatchlist: vi.fn(),
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

const mockAuthorActive = {
  id: 1,
  authorVkId: 101,
  status: 'ACTIVE' as const,
  lastCheckedAt: '2026-06-07T00:00:00Z',
  lastActivityAt: '2026-06-07T00:00:00Z',
  foundCommentsCount: 2,
  monitoringStartedAt: '2026-06-01T00:00:00Z',
  monitoringStoppedAt: null,
  author: {
    id: 1,
    vkAuthorId: 101,
    displayName: 'Иван Иванов',
    fullName: 'Иван Иванов',
    photo50: 'https://vk.com/photo1.jpg',
    screenName: 'ivanov',
    profileUrl: 'https://vk.com/ivanov',
    city: { id: 1, title: 'Москва' },
    photosCount: 10,
    friendsCount: 50,
    followersCount: 100,
    isVerified: true,
    createdAt: '2026-06-01T00:00:00Z',
    lastSeenAt: '2026-06-07T00:00:00Z',
  },
  summary: {
    total: 10,
    suspicious: 2,
    lastAnalyzedAt: null,
    categories: [],
    levels: [],
  }
}

const mockAuthorStopped = {
  id: 2,
  authorVkId: 102,
  status: 'STOPPED' as const,
  lastCheckedAt: '2026-06-07T00:00:00Z',
  lastActivityAt: '2026-06-07T00:00:00Z',
  foundCommentsCount: 0,
  monitoringStartedAt: '2026-06-01T00:00:00Z',
  monitoringStoppedAt: '2026-06-05T00:00:00Z',
  author: {
    id: 2,
    vkAuthorId: 102,
    displayName: 'Петр Петров',
    fullName: 'Петр Петров',
    photo50: null,
    screenName: 'petrov',
    profileUrl: 'https://vk.com/petrov',
    city: { id: 2, title: 'СПб' },
    photosCount: 5,
    friendsCount: 20,
    followersCount: 40,
    isVerified: false,
    createdAt: '2026-06-01T00:00:00Z',
    lastSeenAt: '2026-06-07T00:00:00Z',
  },
  summary: {
    total: 0,
    suspicious: 0,
    lastAnalyzedAt: null,
    categories: [],
    levels: [],
  }
}

const mockSettings = {
  id: 1,
  trackAllComments: true,
  pollIntervalMinutes: 10,
  maxAuthors: 100,
}

describe('WatchlistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(watchlistApi.fetchWatchlistAuthors).mockResolvedValue({
      items: [mockAuthorActive, mockAuthorStopped],
      total: 2,
      hasMore: false,
    })
    vi.mocked(watchlistApi.fetchWatchlistSettings).mockResolvedValue(mockSettings)
    vi.mocked(watchlistApi.fetchWatchlistAuthorDetails).mockResolvedValue({
      ...mockAuthorActive,
      comments: { items: [], total: 0, hasMore: false }
    })
  })

  it('renders initial page state', async () => {
    render(<WatchlistPage />, { wrapper: createWrapper() })

    expect(screen.getByText('На карандаше')).toBeInTheDocument()
    expect(screen.getByText('Настройки')).toBeInTheDocument()
    expect(screen.getByText('Обновить сейчас')).toBeInTheDocument()

    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText('Петр Петров')).toBeInTheDocument()

    expect(screen.getByText('Автор не выбран')).toBeInTheDocument()
  })

  it('displays search results correctly', async () => {
    const user = userEvent.setup()
    render(<WatchlistPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText('Поиск по имени или ID...')
    await user.type(searchInput, 'Петр')

    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument()
    expect(screen.getByText('Петр Петров')).toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, '999')
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
  })

  it('selects an author and fetches their details', async () => {
    const user = userEvent.setup()
    const mockDetails = {
      ...mockAuthorActive,
      comments: {
        items: [
          {
            id: 10,
            ownerId: -1,
            postId: 20,
            vkCommentId: 30,
            text: 'Подозрительный комментарий 1',
            publishedAt: '2026-06-07T10:00:00Z',
            createdAt: '2026-06-07T10:00:00Z',
            source: 'vk',
          }
        ],
        total: 1,
        hasMore: false,
      }
    }
    vi.mocked(watchlistApi.fetchWatchlistAuthorDetails).mockResolvedValue(mockDetails)

    render(<WatchlistPage />, { wrapper: createWrapper() })

    const authorItem = await screen.findByText('Иван Иванов')
    await user.click(authorItem)

    await waitFor(() => {
      expect(watchlistApi.fetchWatchlistAuthorDetails).toHaveBeenCalled()
    })
    expect(vi.mocked(watchlistApi.fetchWatchlistAuthorDetails).mock.calls[0][0]).toBe(1)

    expect(await screen.findByText(/Москва/)).toBeInTheDocument()
    expect(screen.getByText('Активно отслеживается')).toBeInTheDocument()
    expect(screen.getByText('Подозрительный комментарий 1')).toBeInTheDocument()
    expect(screen.getByText('Найдено комментариев: 1')).toBeInTheDocument()
  })

  it('toggles settings panel and saves settings', async () => {
    const user = userEvent.setup()
    vi.mocked(watchlistApi.updateWatchlistSettings).mockResolvedValue({
      ...mockSettings,
      pollIntervalMinutes: 15,
    })

    render(<WatchlistPage />, { wrapper: createWrapper() })

    const settingsBtn = screen.getByText('Настройки')
    await user.click(settingsBtn)

    const pollInput = screen.getByLabelText('Интервал опроса (в минутах)')
    expect(pollInput).toHaveValue(10)

    // Instead of clear which resets value to 5, we press backspace once to turn 10 into 1, then type 5 to make it 15.
    await user.type(pollInput, '{backspace}5')

    const saveBtn = screen.getByText('Сохранить')
    await user.click(saveBtn)

    await waitFor(() => {
      expect(watchlistApi.updateWatchlistSettings).toHaveBeenCalled()
    })
    expect(vi.mocked(watchlistApi.updateWatchlistSettings).mock.calls[0][0]).toEqual({
      trackAllComments: true,
      pollIntervalMinutes: 15,
      maxAuthors: 100,
    })

    expect(await screen.findByText('Настройки успешно сохранены')).toBeInTheDocument()
  })

  it('handles force refresh and shows success toast', async () => {
    const user = userEvent.setup()
    vi.mocked(watchlistApi.refreshWatchlist).mockResolvedValue({
      status: 'ok',
      new_comments: 5,
    })

    render(<WatchlistPage />, { wrapper: createWrapper() })

    const refreshBtn = screen.getByText('Обновить сейчас')
    await user.click(refreshBtn)

    expect(watchlistApi.refreshWatchlist).toHaveBeenCalled()
    expect(await screen.findByText('Обновление успешно завершено. Найдено новых комментариев: 5')).toBeInTheDocument()
  })

  it('opens add author form and adds new author', async () => {
    const user = userEvent.setup()
    const newAuthor = {
      id: 3,
      authorVkId: 103,
      status: 'ACTIVE' as const,
      lastCheckedAt: null,
      lastActivityAt: null,
      foundCommentsCount: 0,
      monitoringStartedAt: '2026-06-08T00:00:00Z',
      monitoringStoppedAt: null,
      author: null,
      summary: { total: 0, suspicious: 0, lastAnalyzedAt: null, categories: [], levels: [] }
    }
    vi.mocked(watchlistApi.createWatchlistAuthor).mockResolvedValue(newAuthor)
    vi.mocked(watchlistApi.fetchWatchlistAuthorDetails).mockResolvedValue({
      ...newAuthor,
      comments: { items: [], total: 0, hasMore: false }
    })

    render(<WatchlistPage />, { wrapper: createWrapper() })

    const openAddFormBtn = screen.getByLabelText('Добавить автора')
    await user.click(openAddFormBtn)

    const input = screen.getByLabelText('Ввод VK ID автора')
    const submitBtn = screen.getByRole('button', { name: 'ОК' })

    await user.type(input, 'abc')
    await user.click(submitBtn)
    expect(screen.getByText('Введите корректный числовой VK ID')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '103')
    await user.click(submitBtn)

    await waitFor(() => {
      expect(watchlistApi.createWatchlistAuthor).toHaveBeenCalled()
    })
    expect(vi.mocked(watchlistApi.createWatchlistAuthor).mock.calls[0][0]).toEqual({ authorVkId: 103 })
    
    await waitFor(() => {
      expect(watchlistApi.fetchWatchlistAuthorDetails).toHaveBeenCalled()
    })
  })

  it('pauses and resumes monitoring of an author', async () => {
    const user = userEvent.setup()
    
    const mockDetailsActive = {
      ...mockAuthorActive,
      comments: { items: [], total: 0, hasMore: false }
    }
    vi.mocked(watchlistApi.fetchWatchlistAuthorDetails).mockResolvedValue(mockDetailsActive)
    vi.mocked(watchlistApi.updateWatchlistAuthor).mockResolvedValue({
      ...mockAuthorActive,
      status: 'STOPPED' as const,
    })

    render(<WatchlistPage />, { wrapper: createWrapper() })

    const authorItem = await screen.findByText('Иван Иванов')
    await user.click(authorItem)

    const pauseBtn = await screen.findByRole('button', { name: 'Приостановить' })
    await user.click(pauseBtn)

    await waitFor(() => {
      expect(watchlistApi.updateWatchlistAuthor).toHaveBeenCalled()
    })
    expect(vi.mocked(watchlistApi.updateWatchlistAuthor).mock.calls[0][0]).toBe(1)
    expect(vi.mocked(watchlistApi.updateWatchlistAuthor).mock.calls[0][1]).toEqual({ status: 'STOPPED' })
    expect(await screen.findByText('Статус мониторинга изменен')).toBeInTheDocument()
  })

  it('deletes an author from watchlist', async () => {
    const user = userEvent.setup()
    
    const mockDetails = {
      ...mockAuthorActive,
      comments: { items: [], total: 0, hasMore: false }
    }
    vi.mocked(watchlistApi.fetchWatchlistAuthorDetails).mockResolvedValue(mockDetails)
    vi.mocked(watchlistApi.deleteWatchlistAuthor).mockResolvedValue(undefined)

    render(<WatchlistPage />, { wrapper: createWrapper() })

    const authorItem = await screen.findByText('Иван Иванов')
    await user.click(authorItem)

    const deleteBtn = await screen.findByRole('button', { name: 'Удалить' })
    await user.click(deleteBtn)

    expect(screen.getByText('Удалить из списка?')).toBeInTheDocument()
    
    const confirmBtn = screen.getByRole('button', { name: 'Удалить' })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(watchlistApi.deleteWatchlistAuthor).toHaveBeenCalled()
    })
    expect(vi.mocked(watchlistApi.deleteWatchlistAuthor).mock.calls[0][0]).toBe(1)
    expect(await screen.findByText('Автор удален из списка')).toBeInTheDocument()

    expect(screen.getByText('Автор не выбран')).toBeInTheDocument()
  })
})
