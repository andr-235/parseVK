import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { WatchlistAuthorsTableBody } from '../WatchlistAuthorsTableBody'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

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

describe('WatchlistAuthorsTableBody', () => {
  const defaultProps = {
    sortedAuthors: [mockAuthor(1), mockAuthor(2)],
    authorColumns: mockColumns,
    focusedRowIndex: null,
    onSelectAuthor: jest.fn(),
    onKeyDown: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render table body with correct structure', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} /></table>)

    const tbody = screen.getByRole('rowgroup')
    expect(tbody).toBeInTheDocument()
  })

  it('should render correct number of rows', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} /></table>)

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(2)
  })

  it('should render rows with correct author data', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} /></table>)

    expect(screen.getByText('Test Author1')).toBeInTheDocument()
    expect(screen.getByText('Test Author2')).toBeInTheDocument()
  })

  it('should pass correct props to each WatchlistAuthorsTableRow', () => {
    const mockOnSelectAuthor = jest.fn()
    const mockOnKeyDown = jest.fn()

    render(<table><WatchlistAuthorsTableBody
      {...defaultProps}
      onSelectAuthor={mockOnSelectAuthor}
      onKeyDown={mockOnKeyDown}
      focusedRowIndex={0}
    /></table>)

    // The props are passed correctly if the component renders without errors
    // and the rows have the expected structure
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(2)

    // Check that the first row has focus
    expect(rows[0]).toHaveAttribute('tabindex', '0')
    expect(rows[1]).toHaveAttribute('tabindex', '-1')
  })

  it('should handle empty authors array', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} sortedAuthors={[]} /></table>)

    const rows = screen.queryAllByRole('row')
    expect(rows).toHaveLength(0)
  })

  it('should handle single author', () => {
    const singleAuthor = [mockAuthor(1)]

    render(<table><WatchlistAuthorsTableBody {...defaultProps} sortedAuthors={singleAuthor} /></table>)

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1)
    expect(screen.getByText('Test Author1')).toBeInTheDocument()
  })

  it('should handle large number of authors', () => {
    const manyAuthors = Array.from({ length: 100 }, (_, i) => mockAuthor(i + 1))

    render(<table><WatchlistAuthorsTableBody {...defaultProps} sortedAuthors={manyAuthors} /></table>)

    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(100)
  })

  it('should pass correct index to each row', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} /></table>)

    const rows = screen.getAllByRole('row')

    // Check data-row-index attributes
    expect(rows[0]).toHaveAttribute('data-row-index', '0')
    expect(rows[1]).toHaveAttribute('data-row-index', '1')
  })

  it('should pass sortedAuthorsLength to each row', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} /></table>)

    const rows = screen.getAllByRole('row')

    // Check aria-label contains the correct length
    expect(rows[0]).toHaveAttribute('aria-label', 'Автор Test Author1, строка 1 из 2')
    expect(rows[1]).toHaveAttribute('aria-label', 'Автор Test Author2, строка 2 из 2')
  })

  it('should handle authors with special characters in names', () => {
    const authorsWithSpecialChars = [
      mockAuthor(1, {
        author: {
          ...mockAuthor(1).author,
          fullName: 'Test & Author <script>',
        }
      }),
    ]

    render(<table><WatchlistAuthorsTableBody {...defaultProps} sortedAuthors={authorsWithSpecialChars} /></table>)

    // The text should be rendered as-is (React will escape it)
    expect(screen.getByText('Test & Author <script>')).toBeInTheDocument()
  })

  it('should handle authors with null or undefined values', () => {
    const authorsWithNulls = [
      mockAuthor(1, {
        author: {
          ...mockAuthor(1).author,
          fullName: null as any,
        }
      }),
    ]

    render(<table><WatchlistAuthorsTableBody {...defaultProps} sortedAuthors={authorsWithNulls} /></table>)

    // Should still render without crashing
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(1)
  })

  it('should handle columns with different configurations', () => {
    const columnsWithRender: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'ID',
        key: 'id',
        sortable: true,
      },
      {
        header: 'Статус',
        key: 'status',
        sortable: false,
        render: (author) => author.status === 'ACTIVE' ? 'Активен' : 'Неактивен',
      },
    ]

    render(<table><WatchlistAuthorsTableBody {...defaultProps} authorColumns={columnsWithRender} /></table>)

    expect(screen.getByText('Активен')).toBeInTheDocument()
  })

  it('should maintain row order based on sortedAuthors array', () => {
    const reversedAuthors = [mockAuthor(2), mockAuthor(1)]

    render(<table><WatchlistAuthorsTableBody {...defaultProps} sortedAuthors={reversedAuthors} /></table>)

    const rows = screen.getAllByRole('row')

    // Check that the order is maintained
    expect(rows[0]).toHaveAttribute('data-row-index', '0')
    expect(rows[1]).toHaveAttribute('data-row-index', '1')

    // And the aria-label reflects the position in the current sorted array
    expect(rows[0]).toHaveAttribute('aria-label', 'Автор Test Author2, строка 1 из 2')
    expect(rows[1]).toHaveAttribute('aria-label', 'Автор Test Author1, строка 2 из 2')
  })

  it('should handle focusedRowIndex changes', () => {
    const { rerender } = render(<table><WatchlistAuthorsTableBody {...defaultProps} focusedRowIndex={0} /></table>)

    let rows = screen.getAllByRole('row')
    expect(rows[0]).toHaveAttribute('tabindex', '0')
    expect(rows[1]).toHaveAttribute('tabindex', '-1')

    // Change focus to second row
    rerender(<table><WatchlistAuthorsTableBody {...defaultProps} focusedRowIndex={1} /></table>)

    rows = screen.getAllByRole('row')
    expect(rows[0]).toHaveAttribute('tabindex', '-1')
    expect(rows[1]).toHaveAttribute('tabindex', '0')
  })

  it('should handle focusedRowIndex being null', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} focusedRowIndex={null} /></table>)

    const rows = screen.getAllByRole('row')
    rows.forEach(row => {
      expect(row).toHaveAttribute('tabindex', '-1')
    })
  })

  it('should handle focusedRowIndex being out of bounds', () => {
    render(<table><WatchlistAuthorsTableBody {...defaultProps} focusedRowIndex={5} /></table>)

    const rows = screen.getAllByRole('row')
    rows.forEach(row => {
      expect(row).toHaveAttribute('tabindex', '-1')
    })
  })
})