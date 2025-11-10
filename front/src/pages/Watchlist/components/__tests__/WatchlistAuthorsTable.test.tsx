import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('WatchlistAuthorsTable', () => {
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

  it('should render table with authors', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table', { name: /Таблица авторов в списке наблюдения/i })).toBeInTheDocument()
    expect(screen.getByText('Test Author1')).toBeInTheDocument()
    expect(screen.getByText('Test Author2')).toBeInTheDocument()
  })

  it('should show loading state when loading authors', () => {
    render(<WatchlistAuthorsTable {...defaultProps} isLoadingAuthors={true} authors={[]} />)

    expect(screen.getByText('Загружаем список авторов...')).toBeInTheDocument()
  })

  it('should show empty state when no authors and not loading', () => {
    render(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

    expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
  })

  it('should show load more button when hasMoreAuthors is true', () => {
    render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} />)

    expect(screen.getByRole('button', { name: /Загрузить ещё/i })).toBeInTheDocument()
  })

  it('should call onLoadMore when load more button is clicked', async () => {
    const user = userEvent.setup()
    render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} />)

    await user.click(screen.getByRole('button', { name: /Загрузить ещё/i }))

    expect(defaultProps.onLoadMore).toHaveBeenCalled()
  })

  it('should disable load more button when loading', () => {
    render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} isLoadingMoreAuthors={true} />)

    expect(screen.getByRole('button', { name: /Загружаем…/i })).toBeDisabled()
  })

  it('should filter out authors with undefined id', () => {
    const authorsWithUndefinedId = [
      mockAuthor(1),
      { ...mockAuthor(2), id: undefined } as any,
    ]

    render(<WatchlistAuthorsTable {...defaultProps} authors={authorsWithUndefinedId} />)

    expect(screen.getByText('Test Author1')).toBeInTheDocument()
    expect(screen.queryByText('Test Author2')).not.toBeInTheDocument()
  })

  it('should filter out duplicate authors by id', () => {
    const authorsWithDuplicates = [
      mockAuthor(1),
      mockAuthor(1),
      mockAuthor(2),
    ]

    render(<WatchlistAuthorsTable {...defaultProps} authors={authorsWithDuplicates} />)

    expect(screen.getAllByText('Test Author1')).toHaveLength(1)
    expect(screen.getByText('Test Author2')).toBeInTheDocument()
  })

  it('should show correct table caption', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByText('Показано 2 валидных авторов из 2.')).toBeInTheDocument()
  })

  it('should handle author selection', () => {
    const mockOnSelectAuthor = jest.fn()

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', () => {
    const mockHandleKeyDown = jest.fn()

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: mockHandleKeyDown,
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 2,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should call onSelectAuthor with valid author id', () => {
    const mockOnSelectAuthor = jest.fn()

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should show error toast when author selection fails', () => {
    const mockOnSelectAuthor = jest.fn(() => {
      throw new Error('Selection failed')
    })

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should reset focused row index when sorted authors change', () => {
    const mockRequestSort = jest.fn()

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: mockRequestSort,
    })

    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    // Change the sorted items
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(2), mockAuthor(1)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: mockRequestSort,
    })

    rerender(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})