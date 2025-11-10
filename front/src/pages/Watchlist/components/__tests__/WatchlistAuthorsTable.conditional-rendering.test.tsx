import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WatchlistAuthorsTable } from '../WatchlistAuthorsTable'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

// Mock dependencies
const mockUseTableSorting = jest.fn(() => ({
  sortedItems: [],
  sortState: { key: 'lastActivityAt', direction: 'desc' },
  requestSort: jest.fn(),
}))

const mockUseKeyboardNavigation = jest.fn(() => ({
  tableRef: { current: null },
  handleKeyDown: jest.fn(),
}))

jest.mock('@/hooks/useTableSorting', () => ({
  useTableSorting: mockUseTableSorting,
}))

jest.mock('@/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: mockUseKeyboardNavigation,
}))

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

describe('WatchlistAuthorsTable - Conditional Rendering', () => {
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
  })

  describe('Loading States', () => {
    it('should show loading state when isLoadingAuthors is true and authors array is empty', () => {
      render(<WatchlistAuthorsTable {...defaultProps} isLoadingAuthors={true} authors={[]} />)

      expect(screen.getByText('Загружаем список авторов...')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('should not show loading state when isLoadingAuthors is true but authors array has data', () => {
      render(<WatchlistAuthorsTable {...defaultProps} isLoadingAuthors={true} />)

      expect(screen.queryByText('Загружаем список авторов...')).not.toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should show loading more indicator when isLoadingMoreAuthors is true', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} isLoadingMoreAuthors={true} />)

      expect(screen.getByRole('button', { name: /Загружаем…/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Загружаем…/ })).toBeDisabled()
    })

    it('should show loading more button when hasMoreAuthors is true and not loading', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} />)

      expect(screen.getByRole('button', { name: /Загрузить ещё/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Загрузить ещё/ })).not.toBeDisabled()
    })
  })

  describe('Empty States', () => {
    it('should show empty state when not loading and no authors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('should not show empty state when loading', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authors={[]} isLoadingAuthors={true} />)

      expect(screen.queryByText('Список авторов пуст')).not.toBeInTheDocument()
      expect(screen.getByText('Загружаем список авторов...')).toBeInTheDocument()
    })

    it('should not show empty state when has authors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.queryByText('Список авторов пуст')).not.toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Data States', () => {
    it('should show table when has authors and columns', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Test Author1')).toBeInTheDocument()
      expect(screen.getByText('Test Author2')).toBeInTheDocument()
    })

    it('should not show table when no columns', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authorColumns={[]} />)

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      // Should show empty state since no data to display
    })

    it('should show table with filtered authors only', () => {
      const authorsWithInvalid = [
        mockAuthor(1),
        { ...mockAuthor(2), id: undefined },
        mockAuthor(3),
      ]

      render(<WatchlistAuthorsTable {...defaultProps} authors={authorsWithInvalid} />)

      expect(screen.getByText('Test Author1')).toBeInTheDocument()
      expect(screen.queryByText('Test Author2')).not.toBeInTheDocument()
      expect(screen.getByText('Test Author3')).toBeInTheDocument()
    })

    it('should show correct caption with valid authors count', () => {
      const authorsWithInvalid = [
        mockAuthor(1),
        { ...mockAuthor(2), id: undefined },
        mockAuthor(3),
      ]

      render(<WatchlistAuthorsTable {...defaultProps} authors={authorsWithInvalid} totalAuthors={3} />)

      expect(screen.getByText('Показано 2 валидных авторов из 3.')).toBeInTheDocument()
    })
  })

  describe('ARIA Live Regions', () => {
    it('should have aria-live region for loading states', () => {
      render(<WatchlistAuthorsTable {...defaultProps} isLoadingAuthors={true} authors={[]} />)

      const liveRegion = screen.getByText('Загружаем список авторов...').closest('[aria-live]')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true')
    })

    it('should have aria-live region for loading more', () => {
      render(<WatchlistAuthorsTable {...defaultProps} isLoadingMoreAuthors={true} />)

      const liveRegion = screen.getByText('Загружаем дополнительные авторы...').closest('[aria-live]')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('should have aria-live region for empty state', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

      const liveRegion = screen.getByText('Список авторов пуст').closest('[aria-live]')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('should have aria-live region for data loaded', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      const liveRegion = screen.getByText('Загружено 2 авторов из 2').closest('[aria-live]')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Load More Button', () => {
    it('should show load more button only when hasMoreAuthors is true', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} />)

      expect(screen.getByRole('button', { name: /Загрузить ещё/ })).toBeInTheDocument()
    })

    it('should not show load more button when hasMoreAuthors is false', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={false} />)

      expect(screen.queryByRole('button', { name: /Загрузить ещё/ })).not.toBeInTheDocument()
    })

    it('should disable load more button when loading authors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} isLoadingAuthors={true} />)

      expect(screen.getByRole('button', { name: /Загрузить ещё/ })).toBeDisabled()
    })

    it('should disable load more button when loading more authors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} isLoadingMoreAuthors={true} />)

      expect(screen.getByRole('button', { name: /Загружаем…/ })).toBeDisabled()
    })

    it('should have correct aria-label on load more button', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} />)

      expect(screen.getByRole('button', { name: /Загрузить ещё/ })).toHaveAttribute('aria-label', 'Загрузить ещё авторов')
    })
  })

  describe('Table Structure', () => {
    it('should have correct table attributes', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('role', 'grid')
      expect(table).toHaveAttribute('aria-label', 'Таблица авторов в списке наблюдения')
      expect(table).toHaveAttribute('aria-rowcount', '2')
      expect(table).toHaveAttribute('aria-colcount', '2')
      expect(table).toHaveAttribute('aria-describedby', 'watchlist-authors-caption')
    })

    it('should have correct caption', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      const caption = screen.getByText('Показано 2 валидных авторов из 2.')
      expect(caption).toHaveAttribute('id', 'watchlist-authors-caption')
    })

    it('should update aria-rowcount when authors change', () => {
      const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '2')

      rerender(<WatchlistAuthorsTable {...defaultProps} authors={[mockAuthor(1)]} />)

      expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero totalAuthors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} totalAuthors={0} />)

      expect(screen.getByText('Показано 2 валидных авторов из 0.')).toBeInTheDocument()
    })

    it('should handle negative totalAuthors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} totalAuthors={-1} />)

      expect(screen.getByText('Показано 2 валидных авторов из -1.')).toBeInTheDocument()
    })

    it('should handle empty authors array with totalAuthors > 0', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authors={[]} totalAuthors={5} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })

    it('should handle all authors filtered out', () => {
      const invalidAuthors = [
        { ...mockAuthor(1), id: undefined },
        { ...mockAuthor(2), id: null as any },
      ]

      render(<WatchlistAuthorsTable {...defaultProps} authors={invalidAuthors} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })

    it('should handle single author', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authors={[mockAuthor(1)]} totalAuthors={1} />)

      expect(screen.getByText('Показано 1 валидных авторов из 1.')).toBeInTheDocument()
    })
  })
})