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

describe('WatchlistAuthorsTable - Edge Cases', () => {
  const defaultProps = {
    authors: [mockAuthor(1)],
    totalAuthors: 1,
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

  describe('Empty and null values', () => {
    it('should handle null authors array', () => {
      mockUseTableSorting.mockReturnValue({
        sortedItems: [],
        sortState: null,
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={null as any} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })

    it('should handle undefined authors array', () => {
      mockUseTableSorting.mockReturnValue({
        sortedItems: [],
        sortState: null,
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={undefined as any} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })

    it('should handle authors with null properties', () => {
      const authorWithNulls = {
        ...mockAuthor(1),
        author: {
          ...mockAuthor(1).author,
          fullName: null,
          firstName: null,
          lastName: null,
        },
        lastActivityAt: null,
        monitoringStartedAt: null,
      }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [authorWithNulls],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithNulls]} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle authors with undefined properties', () => {
      const authorWithUndefined = {
        ...mockAuthor(1),
        author: {
          ...mockAuthor(1).author,
          fullName: undefined,
          firstName: undefined,
          lastName: undefined,
        },
        lastActivityAt: undefined,
        monitoringStartedAt: undefined,
      }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [authorWithUndefined],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithUndefined]} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Extreme values', () => {
    it('should handle very large totalAuthors count', () => {
      render(<WatchlistAuthorsTable {...defaultProps} totalAuthors={999999} />)

      expect(screen.getByText('Показано 1 валидных авторов из 999999.')).toBeInTheDocument()
    })

    it('should handle negative totalAuthors count', () => {
      render(<WatchlistAuthorsTable {...defaultProps} totalAuthors={-100} />)

      expect(screen.getByText('Показано 1 валидных авторов из -100.')).toBeInTheDocument()
    })

    it('should handle zero totalAuthors count', () => {
      render(<WatchlistAuthorsTable {...defaultProps} totalAuthors={0} />)

      expect(screen.getByText('Показано 1 валидных авторов из 0.')).toBeInTheDocument()
    })

    it('should handle very large author IDs', () => {
      const authorWithLargeId = mockAuthor(999999999)

      mockUseTableSorting.mockReturnValue({
        sortedItems: [authorWithLargeId],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithLargeId]} />)

      expect(screen.getByText('999999999')).toBeInTheDocument()
    })

    it('should handle very long author names', () => {
      const longName = 'A'.repeat(1000)
      const authorWithLongName = {
        ...mockAuthor(1),
        author: {
          ...mockAuthor(1).author,
          fullName: longName,
        },
      }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [authorWithLongName],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithLongName]} />)

      expect(screen.getByText(longName)).toBeInTheDocument()
    })
  })

  describe('Invalid data types', () => {
    it('should handle string IDs (should be filtered out)', () => {
      const authorWithStringId = { ...mockAuthor(1), id: 'invalid' as any }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [],
        sortState: null,
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithStringId]} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })

    it('should handle boolean IDs (should be filtered out)', () => {
      const authorWithBooleanId = { ...mockAuthor(1), id: true as any }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [],
        sortState: null,
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithBooleanId]} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })

    it('should handle object IDs (should be filtered out)', () => {
      const authorWithObjectId = { ...mockAuthor(1), id: { invalid: true } as any }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [],
        sortState: null,
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithObjectId]} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })

    it('should handle array IDs (should be filtered out)', () => {
      const authorWithArrayId = { ...mockAuthor(1), id: [1, 2, 3] as any }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [],
        sortState: null,
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithArrayId]} />)

      expect(screen.getByText('Список авторов пуст')).toBeInTheDocument()
    })
  })

  describe('Malformed data structures', () => {
    it('should handle authors missing required properties', () => {
      const malformedAuthor = {
        id: 1,
        // Missing other required properties
      } as any

      mockUseTableSorting.mockReturnValue({
        sortedItems: [malformedAuthor],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[malformedAuthor]} />)

      // Should still render without crashing
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle authors with circular references', () => {
      const circularAuthor = mockAuthor(1)
      // Create a circular reference
      ;(circularAuthor as any).self = circularAuthor

      mockUseTableSorting.mockReturnValue({
        sortedItems: [circularAuthor],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[circularAuthor]} />)

      // Should render without crashing (JSON.stringify in sorting should handle it)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle authors with prototype pollution', () => {
      const pollutedAuthor = mockAuthor(1)
      // Add prototype pollution
      ;(pollutedAuthor as any).__proto__.toString = () => 'polluted'

      mockUseTableSorting.mockReturnValue({
        sortedItems: [pollutedAuthor],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[pollutedAuthor]} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Column configuration edge cases', () => {
    it('should handle empty columns array', () => {
      render(<WatchlistAuthorsTable {...defaultProps} authorColumns={[]} />)

      // Should show empty state since no columns to display
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })

    it('should handle columns with empty headers', () => {
      const columnsWithEmptyHeaders: TableColumn<WatchlistAuthorCard>[] = [
        {
          header: '',
          key: 'id',
          sortable: true,
        },
      ]

      render(<WatchlistAuthorsTable {...defaultProps} authorColumns={columnsWithEmptyHeaders} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle columns with special characters in keys', () => {
      const columnsWithSpecialKeys: TableColumn<WatchlistAuthorCard>[] = [
        {
          header: 'Special',
          key: 'author.profile.settings.theme',
          sortable: true,
        },
      ]

      render(<WatchlistAuthorsTable {...defaultProps} authorColumns={columnsWithSpecialKeys} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle columns with render functions that throw errors', () => {
      const columnsWithErrorRender: TableColumn<WatchlistAuthorCard>[] = [
        {
          header: 'Error Column',
          key: 'error',
          render: () => {
            throw new Error('Render error')
          },
        },
      ]

      render(<WatchlistAuthorsTable {...defaultProps} authorColumns={columnsWithErrorRender} />)

      expect(screen.getByText('Ошибка рендера')).toBeInTheDocument()
    })
  })

  describe('Callback edge cases', () => {
    it('should handle onSelectAuthor callback that throws', () => {
      const mockOnSelectAuthor = jest.fn(() => {
        throw new Error('Callback error')
      })

      render(<WatchlistAuthorsTable {...defaultProps} onSelectAuthor={mockOnSelectAuthor} />)

      // Component should still render
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should handle onLoadMore callback that throws', () => {
      const mockOnLoadMore = jest.fn(() => {
        throw new Error('Load more error')
      })

      render(<WatchlistAuthorsTable {...defaultProps} hasMoreAuthors={true} onLoadMore={mockOnLoadMore} />)

      // Component should still render
      expect(screen.getByRole('button', { name: /Загрузить ещё/ })).toBeInTheDocument()
    })

    it('should handle undefined callbacks', () => {
      render(<WatchlistAuthorsTable
        {...defaultProps}
        onSelectAuthor={undefined as any}
        onLoadMore={undefined as any}
      />)

      // Component should still render
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Performance edge cases', () => {
    it('should handle rapid re-renders', () => {
      const { rerender } = render(<WatchlistAuthorsTable {...defaultProps} />)

      // Rapid re-renders with different props
      for (let i = 0; i < 10; i++) {
        rerender(<WatchlistAuthorsTable {...defaultProps} totalAuthors={i} />)
      }

      expect(screen.getByText('Показано 1 валидных авторов из 9.')).toBeInTheDocument()
    })

    it('should handle large datasets in memory', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => mockAuthor(i + 1))

      mockUseTableSorting.mockReturnValue({
        sortedItems: largeDataset.slice(0, 100), // Simulate pagination
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={largeDataset} totalAuthors={10000} />)

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Accessibility edge cases', () => {
    it('should handle very long aria-labels', () => {
      const longAriaLabel = 'A'.repeat(1000)
      const authorWithLongName = {
        ...mockAuthor(1),
        author: {
          ...mockAuthor(1).author,
          fullName: longAriaLabel,
        },
      }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [authorWithLongName],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithLongName]} />)

      const row = screen.getByRole('row')
      expect(row.getAttribute('aria-label')).toContain(longAriaLabel)
    })

    it('should handle special characters in aria-labels', () => {
      const specialChars = 'Test & <Author> "with" \'quotes\''
      const authorWithSpecialChars = {
        ...mockAuthor(1),
        author: {
          ...mockAuthor(1).author,
          fullName: specialChars,
        },
      }

      mockUseTableSorting.mockReturnValue({
        sortedItems: [authorWithSpecialChars],
        sortState: { key: 'lastActivityAt', direction: 'desc' },
        requestSort: jest.fn(),
      })

      render(<WatchlistAuthorsTable {...defaultProps} authors={[authorWithSpecialChars]} />)

      const row = screen.getByRole('row')
      expect(row.getAttribute('aria-label')).toContain(specialChars)
    })
  })
})