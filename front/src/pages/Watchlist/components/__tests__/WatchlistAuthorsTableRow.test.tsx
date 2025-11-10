import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { WatchlistAuthorsTableRow } from '../WatchlistAuthorsTableRow'
import type { WatchlistAuthorCard, TableColumn } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

// Mock dependencies
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
    render: (author) => author.status === 'ACTIVE' ? 'Активен' : 'Неактивен',
  },
]

const mockColumnsWithPrimitive: TableColumn<WatchlistAuthorCard>[] = [
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

describe('WatchlistAuthorsTableRow', () => {
  const defaultProps = {
    author: mockAuthor(1),
    index: 0,
    authorColumns: mockColumns,
    focusedRowIndex: null,
    sortedAuthorsLength: 3,
    onSelectAuthor: jest.fn(),
    onKeyDown: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render table row with correct attributes', () => {
    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} /></tbody></table>)

    const row = screen.getByRole('row')
    expect(row).toHaveAttribute('id', 'author-row-1')
    expect(row).toHaveAttribute('data-row-index', '0')
    expect(row).toHaveAttribute('tabIndex', '-1')
    expect(row).toHaveAttribute('aria-rowindex', '1')
    expect(row).toHaveAttribute('aria-selected', 'false')
    expect(row).toHaveAttribute('aria-label', 'Автор Test Author1, строка 1 из 3')
  })

  it('should render cells with correct ARIA attributes', () => {
    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} /></tbody></table>)

    const cells = screen.getAllByRole('gridcell')
    expect(cells).toHaveLength(3)

    cells.forEach((cell, index) => {
      expect(cell).toHaveAttribute('aria-colindex', (index + 1).toString())
    })
  })

  it('should render primitive column values correctly', () => {
    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} authorColumns={mockColumnsWithPrimitive} /></tbody></table>)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Test Author1')).toBeInTheDocument()
  })

  it('should render custom column render function', () => {
    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} /></tbody></table>)

    expect(screen.getByText('Активен')).toBeInTheDocument()
  })

  it('should call onSelectAuthor when row is clicked', async () => {
    const user = userEvent.setup()
    const mockOnSelectAuthor = jest.fn()

    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} onSelectAuthor={mockOnSelectAuthor} /></tbody></table>)

    await user.click(screen.getByRole('row'))

    expect(mockOnSelectAuthor).toHaveBeenCalledWith(mockAuthor(1))
  })

  it('should have correct cursor and hover styles', () => {
    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} /></tbody></table>)

    const row = screen.getByRole('row')
    expect(row).toHaveClass('cursor-pointer', 'hover:bg-muted/40')
  })

  it('should set tabIndex to 0 when focused', () => {
    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} focusedRowIndex={0} /></tbody></table>)

    const row = screen.getByRole('row')
    expect(row).toHaveAttribute('tabIndex', '0')
    expect(row).toHaveAttribute('aria-selected', 'true')
  })

  it('should call onKeyDown when keyboard event occurs', () => {
    const mockOnKeyDown = jest.fn()

    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} onKeyDown={mockOnKeyDown} /></tbody></table>)

    const row = screen.getByRole('row')
    fireEvent.keyDown(row, { key: 'Enter' })

    expect(mockOnKeyDown).toHaveBeenCalledWith(expect.any(Object), 0)
  })

  it('should handle render errors gracefully', () => {
    const columnsWithError: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'Error Column',
        key: 'error',
        render: () => {
          throw new Error('Render error')
        },
      },
    ]

    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} authorColumns={columnsWithError} /></tbody></table>)

    expect(screen.getByText('Ошибка рендера')).toBeInTheDocument()
  })

  it('should render empty value when render function throws error and no emptyValue provided', () => {
    const columnsWithError: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'Error Column',
        key: 'error',
        render: () => {
          throw new Error('Render error')
        },
      },
    ]

    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} authorColumns={columnsWithError} /></tbody></table>)

    expect(screen.getByText('Ошибка рендера')).toBeInTheDocument()
  })

  it('should render custom empty value when render function throws error', () => {
    const columnsWithError: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'Error Column',
        key: 'error',
        emptyValue: 'Custom empty',
        render: () => {
          throw new Error('Render error')
        },
      },
    ]

    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} authorColumns={columnsWithError} /></tbody></table>)

    expect(screen.getByText('Custom empty')).toBeInTheDocument()
  })

  it('should render empty value for primitive columns when value is null', () => {
    const columnsWithEmpty: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'Empty Column',
        key: 'nonexistent',
        emptyValue: '—',
      },
    ]

    render(<table><tbody><WatchlistAuthorsTableRow {...defaultProps} authorColumns={columnsWithEmpty} /></tbody></table>)

    expect(screen.getByText('—')).toBeInTheDocument()
  })
})