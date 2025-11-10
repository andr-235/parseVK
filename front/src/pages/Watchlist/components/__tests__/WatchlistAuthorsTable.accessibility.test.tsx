import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WatchlistAuthorsTable } from '../WatchlistAuthorsTable'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

// Mock dependencies
const mockUseTableSorting = jest.fn()
const mockUseKeyboardNavigation = jest.fn()

jest.mock('@/hooks/useTableSorting')
jest.mock('@/hooks/useKeyboardNavigation')

jest.mock('@/utils/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}))

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}))

const mockAuthor = (id: number, overrides = {}): WatchlistAuthorCard => ({
  id,
  authorVkId: 123 + id,
  status: 'ACTIVE',
  lastCheckedAt: null,
  lastActivityAt: '2023-01-01T00:00:00Z',
  foundCommentsCount: 10,
  totalComments: 10,
  monitoringStartedAt: '2023-01-01T00:00:00Z',
  monitoringStoppedAt: null,
  settingsId: 1,
  author: {
    vkUserId: 123 + id,
    firstName: 'Test',
    lastName: `Author${id}`,
    fullName: `Test Author${id}`,
    avatar: null,
    profileUrl: null,
    screenName: null,
    domain: null,
  },
  analysisSummary: createEmptyPhotoAnalysisSummary(),
  ...overrides,
})

const mockColumns: TableColumn<WatchlistAuthorCard>[] = [
  {
    header: 'ID',
    key: 'id',
    sortable: true,
  },
  {
    header: 'Имя',
    key: 'author.fullName',
    sortable: true,
  },
]

describe('WatchlistAuthorsTable - Accessibility', () => {
  const defaultProps = {
    authors: [mockAuthor(1), mockAuthor(2)],
    totalAuthors: 2,
    hasMoreAuthors: false,
    isLoadingAuthors: false,
    isLoadingMoreAuthors: false,
    authorColumns: mockColumns,
    onSelectAuthor: jest.fn(),
    onLoadMore: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })
    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: jest.fn(),
    })
  })

  it('should have correct ARIA attributes on table', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    const table = screen.getByRole('table')
    expect(table).toHaveAttribute('role', 'grid')
    expect(table).toHaveAttribute('aria-label', 'Таблица авторов в списке наблюдения')
    expect(table).toHaveAttribute('aria-rowcount', '2')
    expect(table).toHaveAttribute('aria-colcount', '2')
    expect(table).toHaveAttribute('aria-describedby', 'watchlist-authors-caption')
  })

  it('should have aria-live region for status updates', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    const liveRegion = screen.getByText('Загружено 2 авторов из 2')
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    expect(liveRegion).toHaveClass('sr-only')
  })

  it('should announce loading states via aria-live', () => {
    render(<WatchlistAuthorsTable {...defaultProps} isLoadingAuthors={true} authors={[]} />)

    expect(screen.getByText('Загружаем список авторов...')).toHaveAttribute('aria-live', 'polite')
  })

  it('should announce loading more states via aria-live', () => {
    render(<WatchlistAuthorsTable {...defaultProps} isLoadingMoreAuthors={true} />)

    expect(screen.getByText('Загружаем дополнительные авторы...')).toHaveAttribute('aria-live', 'polite')
  })

  it('should announce empty state via aria-live', () => {
    render(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

    expect(screen.getByText('Список авторов пуст')).toHaveAttribute('aria-live', 'polite')
  })

  it('should have accessible load more button', () => {
    render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} />)

    const button = screen.getByRole('button', { name: /Загрузить ещё/i })
    expect(button).toHaveAttribute('aria-label', 'Загрузить ещё авторов')
  })

  it('should have accessible table caption', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    const caption = screen.getByText('Показано 2 валидных авторов из 2.')
    expect(caption).toHaveAttribute('id', 'watchlist-authors-caption')
  })

  it('should update aria-rowcount when authors change', () => {
    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '2')

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    rerender(<WatchlistAuthorsTable {...defaultProps} authors={[mockAuthor(1)]} totalAuthors={1} />)

    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '1')
  })

  it('should have screen reader only status announcements', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    const statusElements = screen.getAllByText(/Загружено|авторов/)
    statusElements.forEach(element => {
      expect(element).toHaveClass('sr-only')
    })
  })
})