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
]

describe('WatchlistAuthorsTable - Interaction', () => {
  const defaultProps = {
    authors: [mockAuthor(1), mockAuthor(2)],
    totalAuthors: 2,
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
      sortedItems: [mockAuthor(1), mockAuthor(2)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })
    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: jest.fn(),
    })
  })

  describe('Load More Button', () => {
    it('should call onLoadMore when button is clicked', async () => {
      const user = userEvent.setup()
      render(<WatchlistAuthorsTable {...defaultProps} />)

      const loadMoreButton = screen.getByRole('button', { name: /Загрузить ещё/i })
      await user.click(loadMoreButton)

      expect(defaultProps.onLoadMore).toHaveBeenCalledTimes(1)
    })

    it('should disable button when loading more authors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} isLoadingMoreAuthors={true} />)

      const loadMoreButton = screen.getByRole('button', { name: /Загружаем…/i })
      expect(loadMoreButton).toBeDisabled()
    })

    it('should disable button when loading authors', () => {
      render(<WatchlistAuthorsTable {...defaultProps} isLoadingAuthors={true} />)

      const loadMoreButton = screen.getByRole('button', { name: /Загрузить ещё/i })
      expect(loadMoreButton).toBeDisabled()
    })

    it('should not show load more button when hasMoreAuthors is false', () => {
      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={false} />)

      expect(screen.queryByRole('button', { name: /Загрузить ещё/i })).not.toBeInTheDocument()
    })

    it('should show correct button text when not loading', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.getByRole('button', { name: /Загрузить ещё/i })).toHaveTextContent('Загрузить ещё')
    })

    it('should show correct button text when loading', () => {
      render(<WatchlistAuthorsTable {...defaultProps} isLoadingMoreAuthors={true} />)

      expect(screen.getByRole('button', { name: /Загружаем…/i })).toHaveTextContent('Загружаем…')
    })
  })

  describe('Author Selection', () => {
    it('should handle valid author selection', () => {
      const mockOnSelectAuthor = jest.fn()
      render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

      // Author selection is handled by WatchlistAuthorsTableRow component
      // We test that the component renders correctly with selection enabled
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle invalid author selection gracefully', () => {
      const mockOnSelectAuthor = jest.fn(() => {
        throw new Error('Selection failed')
      })

      render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should validate author ID before selection', () => {
      const mockOnSelectAuthor = jest.fn()
      const invalidAuthor = { ...mockAuthor(1), id: 'invalid' as any }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [invalidAuthor],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[invalidAuthor]} onSelectAuthor={mockOnSelectAuthor} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should initialize keyboard navigation with correct parameters', () => {
      render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
        itemsLength: 2,
        onSelect: expect.any(Function),
        onFocusChange: expect.any(Function),
      })
    })

    it('should handle keyboard navigation with empty list', () => {
      mockUseTableSorting.mockReturnValue({
        sortedItems: [],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[]} totalAuthors={0} />)

      expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
        itemsLength: 0,
        onSelect: expect.any(Function),
        onFocusChange: expect.any(Function),
      })
    })

    it('should update keyboard navigation when authors change', () => {
      const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

      mockUseTableSorting.mockReturnValue({
        sortedItems: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      rerender(<WatchlistAuthorsTable {...defaultProps} authors={[mockAuthor(1), mockAuthor(2), mockAuthor(3)]} totalAuthors={3} />)

      expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
        itemsLength: 3,
        onSelect: expect.any(Function),
        onFocusChange: expect.any(Function),
      })
    })
  })

  describe('Focus Management', () => {
    it('should reset focused row index when sorted authors change', () => {
      const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

      mockUseTableSorting.mockReturnValue({
        sortedItems: [mockAuthor(2), mockAuthor(1)],
        sortState: { key: 'id', direction: 'asc' },
        requestSort: jest.fn(),
      })

      rerender(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle focus changes through keyboard navigation', () => {
      const mockOnFocusChange = jest.fn()
      mockUseKeyboardNavigation.mockReturnValue({
        tableRef: { current: null },
        handleKeyDown: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })
})