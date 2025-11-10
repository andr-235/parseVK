import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('WatchlistAuthorsTable - Keyboard Navigation', () => {
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize keyboard navigation hook with correct parameters', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 3,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should pass table ref to keyboard navigation hook', () => {
    const mockTableRef = { current: document.createElement('table') }

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: mockTableRef,
      handleKeyDown: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    // The table should have the ref from the hook
    const table = screen.getByRole('table')
    expect(table).toBe(mockTableRef.current)
  })

  it('should call onSelectAuthor when keyboard navigation triggers selection', () => {
    const mockOnSelectAuthor = jest.fn()
    const mockOnSelect = jest.fn()
    const mockOnFocusChange = jest.fn()

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: jest.fn(),
    })

    // Manually trigger the onSelect callback that would be passed to the hook
    mockUseKeyboardNavigation.mockImplementation(({ onSelect }) => {
      // Simulate keyboard navigation calling onSelect with index 1
      setTimeout(() => onSelect?.(1), 0)

      return {
        tableRef: { current: null },
        handleKeyDown: jest.fn(),
      }
    })

    render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

    // Wait for the async selection to happen
    setTimeout(() => {
      expect(mockOnSelectAuthor).toHaveBeenCalledWith(mockAuthor(2).id)
    }, 10)
  })

  it('should handle focus changes from keyboard navigation', () => {
    const mockOnFocusChange = jest.fn()

    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    mockUseKeyboardNavigation.mockImplementation(({ onFocusChange }) => {
      // Simulate keyboard navigation calling onFocusChange
      setTimeout(() => onFocusChange?.(2), 0)

      return {
        tableRef: { current: null },
        handleKeyDown: jest.fn(),
      }
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    // The focus change should be handled internally by the component
    // This test verifies the hook is called with the correct callback
    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 3,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should handle ArrowDown key press', () => {
    const mockHandleKeyDown = jest.fn()

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: mockHandleKeyDown,
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 'ArrowDown' })

    expect(mockHandleKeyDown).toHaveBeenCalledWith(expect.any(Object), expect.any(Number))
  })

  it('should handle ArrowUp key press', () => {
    const mockHandleKeyDown = jest.fn()

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: mockHandleKeyDown,
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 'ArrowUp' })

    expect(mockHandleKeyDown).toHaveBeenCalledWith(expect.any(Object), expect.any(Number))
  })

  it('should handle Enter key press', () => {
    const mockHandleKeyDown = jest.fn()

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: mockHandleKeyDown,
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 'Enter' })

    expect(mockHandleKeyDown).toHaveBeenCalledWith(expect.any(Object), expect.any(Number))
  })

  it('should handle Space key press', () => {
    const mockHandleKeyDown = jest.fn()

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: mockHandleKeyDown,
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: ' ' })

    expect(mockHandleKeyDown).toHaveBeenCalledWith(expect.any(Object), expect.any(Number))
  })

  it('should handle other key presses without calling handleKeyDown', () => {
    const mockHandleKeyDown = jest.fn()

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: mockHandleKeyDown,
    })

    render(<WatchlistAuthorsTable {...defaultProps} />)

    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 'a' })

    expect(mockHandleKeyDown).not.toHaveBeenCalled()
  })

  it('should update keyboard navigation when sorted items change', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 2,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })

    // Change the sorted items
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2), mockAuthor(3)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    rerender(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 3,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should handle empty sorted items array', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={[]} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 0,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should handle single item in sorted items', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={[mockAuthor(1)]} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledWith({
      itemsLength: 1,
      onSelect: expect.any(Function),
      onFocusChange: expect.any(Function),
    })
  })

  it('should handle keyboard navigation errors gracefully', () => {
    const mockHandleKeyDown = jest.fn(() => {
      throw new Error('Keyboard navigation error')
    })

    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: mockHandleKeyDown,
    })

    // Mock console.error to avoid test output pollution
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<WatchlistAuthorsTable {...defaultProps} />)

    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 'ArrowDown' })

    expect(mockHandleKeyDown).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error handling keyboard navigation:',
      expect.any(Error)
    )

    consoleSpy.mockRestore()
  })

  it('should maintain keyboard navigation when component re-renders', () => {
    mockUseTableSorting.mockReturnValue({
      sortedItems: [mockAuthor(1), mockAuthor(2)],
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(mockUseKeyboardNavigation).toHaveBeenCalledTimes(1)

    // Re-render with same props
    rerender(<WatchlistAuthorsTable {...defaultProps} />)

    // Hook should be called again due to re-render
    expect(mockUseKeyboardNavigation).toHaveBeenCalledTimes(2)
  })
})