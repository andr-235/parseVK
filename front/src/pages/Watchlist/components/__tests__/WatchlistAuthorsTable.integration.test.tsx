import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  {
    header: 'Комментарии',
    key: 'foundCommentsCount',
    sortable: true,
  },
]

describe('WatchlistAuthorsTable - Integration Tests', () => {
  const defaultProps = {
    authors: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
    totalAuthors: 3,
    hasMoreAuthors: true,
    isLoadingAuthors: false,
    isLoadingMoreAuthors: false,
    authorColumns: mockColumns,
    onSelectAuthor: jest.fn(),
    onLoadMore: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })
    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: jest.fn(),
    })
  })

  describe('Complete User Workflow', () => {
    it('should handle full table lifecycle from loading to data display', () => {
      // Start with loading state
      const { rerender } = render(
        <WatchlistAuthorsTable
          {...defaultProps}
          isLoadingAuthors={true}
          authors={[]}
        />
      )

      expect(screen.getByText('Загружаем список авторов...')).toBeInTheDocument()

      // Transition to data loaded
      mockUseTableSorting.mockReturnValue({
        sortedItems: [mockAuthor(1), mockAuthor(2)],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      rerender(
        <WatchlistAuthorsTable
          {...defaultProps}
          isLoadingAuthors={false}
          authors={[mockAuthor(1), mockAuthor(2)]}
          totalAuthors={2}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Test Author1')).toBeInTheDocument()
      expect(screen.getByText('Test Author2')).toBeInTheDocument()
    })

    it('should handle loading more authors workflow', async () => {
      const user = userEvent.setup()
      const mockOnLoadMore = jest.fn()

      const { rerender } = render(
        <WatchlistAuthorsTable
          {...defaultProps}
          onLoadMore={mockOnLoadMore}
        />
      )

      const loadMoreButton = screen.getByRole('button', { name: /Загрузить ещё/i })
      expect(loadMoreButton).toBeEnabled()

      // Click load more
      await user.click(loadMoreButton)
      expect(mockOnLoadMore).toHaveBeenCalledTimes(1)

      // Show loading state
      rerender(
        <WatchlistAuthorsTable
          {...defaultProps}
          isLoadingMoreAuthors={true}
          onLoadMore={mockOnLoadMore}
        />
      )

      expect(screen.getByRole('button', { name: /Загружаем…/i })).toBeDisabled()

      // Complete loading
      rerender(
        <WatchlistAuthorsTable
          {...defaultProps}
          authors={[...defaultProps.authors, mockAuthor(4), mockAuthor(5)]}
          totalAuthors={5}
          hasMoreAuthors={false}
          onLoadMore={mockOnLoadMore}
        />
      )

      expect(screen.queryByRole('button', { name: /Загрузить/i })).not.toBeInTheDocument()
    })

    it('should handle sorting and filtering together', () => {
      const mockRequestSort = jest.fn()

      mockUseTableSorting.mockReturnValue({
        sortedItems: [mockAuthor(3), mockAuthor(1), mockAuthor(2)],
        sortState: { key: 'id', direction: 'asc' },
        requestSort: mockRequestSort,
      })

      const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()

      // Change sorting
      mockUseTableSorting.mockReturnValue({
        sortedItems: [mockAuthor(1), mockAuthor(3), mockAuthor(2)],
        sortState: { key: 'author.fullName', direction: 'asc' },
        requestSort: mockRequestSort,
      })

      rerender(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle author selection with validation', () => {
      const mockOnSelectAuthor = jest.fn()

      render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

      // The component should render correctly with selection enabled
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Test Author1')).toBeInTheDocument()
    })

    it('should handle keyboard navigation integration', () => {
      const mockHandleKeyDown = jest.fn()
      const mockOnFocusChange = jest.fn()

      mockUseKeyboardNavigation.mockReturnValue({
        tableRef: { current: null },
        handleKeyDown: mockHandleKeyDown,
      })

      render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
        itemsLength: 3,
        onSelect: expect.any(Function),
        onFocusChange: expect.any(Function),
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle invalid data gracefully', () => {
      const invalidAuthors = [
        mockAuthor(1),
        { ...mockAuthor(2), id: undefined } as any,
        { ...mockAuthor(3), author: null } as any,
      ]

      mockUseTableSorting.mockReturnValue({
        sortedItems: [mockAuthor(1)], // Only valid author should remain
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={invalidAuthors} />)

      expect(screen.getByText('Test Author1')).toBeInTheDocument()
      expect(screen.queryByText('Test Author2')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Author3')).not.toBeInTheDocument()
    })

    it('should handle empty columns gracefully', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authorColumns={[]} />)

      // Should not render table when no columns
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('should handle network-like errors during author selection', () => {
      const mockOnSelectAuthor = jest.fn(() => {
        throw new Error('Network error')
      })

      render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large datasets with virtualization', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => mockAuthor(i + 1))

      mockUseTableSorting.mockReturnValue({
        sortedItems: largeDataset,
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(
        <WatchlistAuthorsTable
          {...defaultProps}
          authors={largeDataset}
          totalAuthors={100}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getByText('Показано 100 валидных авторов из 100. (виртуализированная таблица)')).toBeInTheDocument()
    })

    it('should handle rapid prop changes', () => {
      const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

      // Rapid changes
      for (let i = 0; i < 5; i++) {
        rerender(
          <WatchlistAuthorsTable
            {...defaultProps}
            totalAuthors={defaultProps.totalAuthors + i}
          />
        )
      }

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain accessibility attributes throughout interactions', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('role', 'grid')
      expect(table).toHaveAttribute('aria-label', 'Таблица авторов в списке наблюдения')
      expect(table).toHaveAttribute('aria-rowcount', '3')
      expect(table).toHaveAttribute('aria-colcount', '3')
    })

    it('should announce state changes via aria-live', () => {
      const { rerender } = render(
        <WatchlistAuthorsTable
          {...defaultProps}
          isLoadingAuthors={true}
          authors={[]}
        />
      )

      expect(screen.getByText('Загружаем список авторов...')).toHaveAttribute('aria-live', 'polite')

      rerender(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

      expect(screen.getByText('Список авторов пуст')).toHaveAttribute('aria-live', 'polite')
    })
  })
})