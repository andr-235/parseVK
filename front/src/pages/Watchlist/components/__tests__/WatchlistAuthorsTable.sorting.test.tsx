import { render, screen, fireEvent } from '@testing-library/react'
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
    header: 'Статус',
    key: 'status',
    sortable: false,
  },
]

describe('WatchlistAuthorsTable - Sorting', () => {
  const defaultProps = {
    authors: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
    totalAuthors: 3,
    hasMoreAuthors: false,
    isLoadingAuthors: false,
    isLoadingMoreAuthors: false,
    authorColumns: mockColumns,
    onSelectAuthor: jest.fn(),
    onLoadMore: jest.fn(),
  }

  let mockRequestSort: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockRequestSort = jest.fn()
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: mockRequestSort,
    })
    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: jest.fn(),
    })
  })

  it('should initialize with default sorting', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseTableSorting).toHaveBeenCalledWith(
      [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
      mockColumns,
      {
        initialKey: 'lastActivityAt',
        initialDirection: 'desc',
      }
    )
  })

  it('should render sortable columns with proper headers', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    // Headers are rendered by WatchlistAuthorsTableHeader component
    // We test that the table renders correctly with sorting enabled
  })

  it('should handle sorting state changes', () => {
    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    // Change sorting state
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(3), mockAuthor(2), mockAuthor(1)],
      sortState: { key: 'id', direction: 'asc' },
      requestSort: mockRequestSort,
    })

    rerender(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should maintain sorting when data updates', () => {
    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    // Update authors list
    const newAuthors = [mockAuthor(4), mockAuthor(5)]
    mockUseTableSorting.mockReturnValue({
      sortedItems: newAuthors,
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: mockRequestSort,
    })

    rerender(<WatchlistAuthorsTable {...defaultProps} authors={newAuthors} totalAuthors={2} />)

    expect(mockUseTableSorting).toHaveBeenCalledWith(
      newAuthors,
      mockColumns,
      {
        initialKey: 'lastActivityAt',
        initialDirection: 'desc',
      }
    )
  })

  it('should handle empty sorting state', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [],
      sortState: { key: null, direction: null },
      requestSort: mockRequestSort,
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={[]} totalAuthors={0} />)

    expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
  })

  it('should preserve sorting when filtering authors', () => {
    const authorsWithInvalid = [
      mockAuthor(1),
      { ...mockAuthor(2), id: undefined } as any,
      mockAuthor(3),
    ]

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(3)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: mockRequestSort,
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={authorsWithInvalid} />)

    expect(screen.getByText('Test Author1')).toBeInTheDocument()
    expect(screen.getByText('Test Author3')).toBeInTheDocument()
    expect(screen.queryByText('Test Author2')).not.toBeInTheDocument()
  })

  it('should handle sorting with different column types', () => {
    const columnsWithDifferentTypes: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'ID',
        key: 'id',
        sortable: true,
      },
      {
        header: 'Число',
        key: 'foundCommentsCount',
        sortable: true,
      },
      {
        header: 'Дата',
        key: 'lastActivityAt',
        sortable: true,
      },
    ]

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2)],
      sortState: { key: 'foundCommentsCount', direction: 'desc' },
      requestSort: mockRequestSort,
    })

    render(<WatchlistAuthorsTable {...defaultProps} authorColumns={columnsWithDifferentTypes} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})