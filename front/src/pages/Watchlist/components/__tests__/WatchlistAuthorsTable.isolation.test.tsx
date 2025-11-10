import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WatchlistAuthorsTable } from '../WatchlistAuthorsTable'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

// Mock all external dependencies to ensure isolation
const mockUseTableSorting = jest.fn()
const mockUseKeyboardNavigation = jest.fn()

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

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

jest.mock('@/components/SectionCard', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableCaption: ({ children, ...props }: any) => <caption {...props}>{children}</caption>,
}))

jest.mock('../WatchlistStates', () => ({
  LoadingState: () => <div>Loading State</div>,
  EmptyState: () => <div>Empty State</div>,
}))

jest.mock('../WatchlistAuthorsTableHeader', () => ({
  WatchlistAuthorsTableHeader: ({ authorColumns, authorSortState, requestAuthorSort }: any) => (
    <thead>
      <tr>
        {authorColumns.map((col: any) => (
          <th key={col.key}>
            {col.header}
            {col.sortable && (
              <button onClick={() => requestAuthorSort(col.key)}>
                Sort {col.header}
              </button>
            )}
          </th>
        ))}
      </tr>
    </thead>
  ),
}))

jest.mock('../WatchlistAuthorsTableBody', () => ({
  WatchlistAuthorsTableBody: ({ sortedAuthors, authorColumns, focusedRowIndex, onSelectAuthor, onKeyDown }: any) => (
    <tbody>
      {sortedAuthors.map((author: any, index: number) => (
        <tr key={author.id} data-row-index={index}>
          {authorColumns.map((col: any) => (
            <td key={col.key}>
              {col.render ? col.render(author, index) : author[col.key] || '—'}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  ),
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

describe('WatchlistAuthorsTable - Isolation Tests', () => {
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

    // Set up default mock returns
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

  it('should render with all mocked dependencies', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByText('Test Author1')).toBeInTheDocument()
    expect(screen.getByText('Test Author2')).toBeInTheDocument()
  })

  it('should call useTableSorting with correct parameters', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseTableSorting).toHaveBeenCalledWith(
      [mockAuthor(1), mockAuthor(2)], // validAuthors (filtered)
      mockColumns,
      {
        initialKey: 'lastActivityAt',
        initialDirection: 'desc',
      }
    )
  })

  it('should call useKeyboardNavigation with correct parameters', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 2, // length of sortedItems
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should filter out invalid authors before passing to hooks', () => {
    const authorsWithInvalid = [
      mockAuthor(1),
      { ...mockAuthor(2), id: undefined },
      mockAuthor(3),
    ]

    render(<WatchlistAuthorsTable {...defaultProps} authors={authorsWithInvalid} />)

    // Should only pass valid authors to useTableSorting
    expect(mockUseTableSorting).toHaveBeenCalledWith(
      [mockAuthor(1), mockAuthor(3)], // only valid authors
      mockColumns,
      expect.any(Object)
    )
  })

  it('should handle empty authors array', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [],
      sortState: null,
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

    expect(mockUseTableSorting).toHaveBeenCalledWith(
      [], // empty valid authors
      mockColumns,
      expect.any(Object)
    )

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 0,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should handle single author', () => {
    const singleAuthor = [mockAuthor(1)]

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={singleAuthor} />)

    expect(mockUseTableSorting).toHaveBeenCalledWith(
      [mockAuthor(1)],
      mockColumns,
      expect.any(Object)
    )

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 1,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should pass correct onSelect callback to keyboard navigation', () => {
    const mockOnSelectAuthor = jest.fn()
    let capturedOnSelect: any

    mockUseKeyboardNavigation.mockImplementation((options) => {
      capturedOnSelect = options.onSelect
      return {
        tableRef: { current: null },
        handleKeyDown: jest.fn(),
      }
    })

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

    // Simulate keyboard navigation calling onSelect with index 1
    capturedOnSelect(1)

    expect(mockOnSelectAuthor).toHaveBeenCalledWith(mockAuthor(2).id)
  })

  it('should handle sorting state changes', () => {
    const mockRequestSort = jest.fn()

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(2), mockAuthor(1)], // reversed order
      sortState: { key: 'id', direction: 'asc' },
      requestSort: mockRequestSort,
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    // The component should use the sorted items from the hook
    expect(screen.getByText('Test Author2')).toBeInTheDocument()
    expect(screen.getByText('Test Author1')).toBeInTheDocument()
  })

  it('should handle focus changes from keyboard navigation', () => {
    let capturedOnFocusChange: any

    mockUseKeyboardNavigation.mockImplementation((options) => {
      capturedOnFocusChange = options.onFocusChange
      return {
        tableRef: { current: null },
        handleKeyDown: jest.fn(),
      }
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    // The onFocusChange should be a function that updates internal state
    expect(typeof capturedOnFocusChange).toBe('function')
  })

  it('should render loading state when isLoadingAuthors is true and no data', () => {
    render(<WatchlistAuthorsTable {...defaultProps} isLoadingAuthors={true} authors={[]} />)

    expect(screen.getByText('Loading State')).toBeInTheDocument()
  })

  it('should render empty state when not loading and no valid authors', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [],
      sortState: null,
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

    expect(screen.getByText('Empty State')).toBeInTheDocument()
  })

  it('should render table when has valid data', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('should show load more button when hasMoreAuthors is true', () => {
    render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} />)

    expect(screen.getByRole('button', { name: /Загрузить ещё/ })).toBeInTheDocument()
  })

  it('should not show load more button when hasMoreAuthors is false', () => {
    render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={false} />)

    expect(screen.queryByRole('button', { name: /Загрузить ещё/ })).not.toBeInTheDocument()
  })

  it('should handle different column configurations', () => {
    const customColumns: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'Custom ID',
        key: 'id',
        sortable: false,
      },
      {
        header: 'Status',
        key: 'status',
        sortable: true,
        render: (author) => `Status: ${author.status}`,
      },
    ]

    render(<WatchlistAuthorsTable {...defaultProps} authorColumns={customColumns} />)

    expect(screen.getByText('Custom ID')).toBeInTheDocument()
    expect(screen.getByText('Status: ACTIVE')).toBeInTheDocument()
  })

  it('should handle errors in author filtering gracefully', () => {
    // Create an author that might cause issues during filtering
    const problematicAuthor = {
      ...mockAuthor(1),
      id: 'not-a-number' as any, // This should be filtered out
    }

    render(<WatchlistAuthorsTable {...defaultProps} authors={[problematicAuthor]} />)

    // Should filter out the invalid author and show empty state
    expect(screen.getByText('Empty State')).toBeInTheDocument()
  })

  it('should maintain isolation from external state changes', () => {
    // This test ensures the component doesn't rely on external state
    // that might change between renders
    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    // Re-render with same props - should work the same way
    rerender(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByText('Test Author1')).toBeInTheDocument()
    expect(screen.getByText('Test Author2')).toBeInTheDocument()
  })

  it('should handle rapid prop changes', () => {
    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    // Change authors
    rerender(<WatchlistAuthorsTable {...defaultProps} authors={[mockAuthor(3)]} />)

    expect(screen.getByText('Test Author3')).toBeInTheDocument()
    expect(screen.queryByText('Test Author1')).not.toBeInTheDocument()
  })
})