import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthorsPage } from '../AuthorsPage'

const mockFetchAuthors = vi.fn()
const mockVerifyAuthor = vi.fn()
const mockDeleteAuthor = vi.fn()
const mockRefreshAuthors = vi.fn()

vi.mock('../../../shared/api/authors', () => ({
  fetchAuthors: (...args: unknown[]) => mockFetchAuthors(...args),
  verifyAuthor: (...args: unknown[]) => mockVerifyAuthor(...args),
  deleteAuthor: (...args: unknown[]) => mockDeleteAuthor(...args),
  refreshAuthors: (...args: unknown[]) => mockRefreshAuthors(...args),
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

const mockAuthor = {
  id: 1,
  vkAuthorId: 12345,
  type: 'user',
  displayName: 'Иван Иванов',
  fullName: 'Иван Иванов',
  photo50: 'https://vk.com/photo.jpg',
  domain: 'ivanov',
  screenName: 'id12345',
  profileUrl: 'https://vk.com/id12345',
  city: { id: 1, title: 'Москва' },
  photosCount: 42,
  friendsCount: 10,
  followersCount: 150,
  isVerified: true,
  verifiedAt: '2026-05-30T00:00:00Z',
  createdAt: '2026-05-01T00:00:00Z',
  lastSeenAt: '2026-05-30T00:00:00Z',
}

const mockAuthorUnverified = {
  ...mockAuthor,
  vkAuthorId: 67890,
  fullName: 'Петр Петров',
  displayName: 'Петр Петров',
  photo50: null,
  city: null,
  photosCount: null,
  followersCount: null,
  isVerified: false,
  verifiedAt: null,
}

const mockResponse = (items: typeof mockAuthor[]) => ({
  items,
  total: items.length,
  hasMore: false,
})

describe('AuthorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', () => {
    mockFetchAuthors.mockResolvedValueOnce(mockResponse([]))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(screen.getByText('Авторы')).toBeInTheDocument()
  })

  it('shows loading skeleton initially', () => {
    mockFetchAuthors.mockReturnValueOnce(new Promise(() => {}))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows authors after loading', async () => {
    mockFetchAuthors.mockResolvedValueOnce(mockResponse([mockAuthor]))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('Иван Иванов')).toBeInTheDocument()
    expect(await screen.findByText('Москва')).toBeInTheDocument()
  })

  it('shows photosCount', async () => {
    mockFetchAuthors.mockResolvedValueOnce(mockResponse([mockAuthor]))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('42')).toBeInTheDocument()
  })

  it('shows friendsCount', async () => {
    mockFetchAuthors.mockResolvedValueOnce(mockResponse([mockAuthor]))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('10')).toBeInTheDocument()
  })

  it('shows createdAt and lastSeenAt dates', async () => {
    mockFetchAuthors.mockResolvedValueOnce(mockResponse([mockAuthor]))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('01.05.2026')).toBeInTheDocument()
    expect(await screen.findByText('30.05.2026')).toBeInTheDocument()
  })

  it('shows empty state when no authors', async () => {
    mockFetchAuthors.mockResolvedValueOnce(mockResponse([]))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('Нет авторов')).toBeInTheDocument()
  })

  it('shows error state on fetch error', async () => {
    mockFetchAuthors.mockRejectedValueOnce(new Error('Network error'))
    render(<AuthorsPage />, { wrapper: createWrapper() })
    expect(await screen.findByText('Network error')).toBeInTheDocument()
  })
})
