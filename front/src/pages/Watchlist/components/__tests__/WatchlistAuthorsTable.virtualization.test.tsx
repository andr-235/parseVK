import { render, screen } from '@testing-library/react'
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

describe('WatchlistAuthorsTable - Virtualization', () => {
  const defaultProps = {
    authors: Array.from({ length: 60 }, (_, i) => mockAuthor(i + 1)),
    totalAuthors: 60,
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
      sortedItems: defaultProps.authors,
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })
    mockUseKeyboardNavigation.mockReturnValue({
      tableRef: { current: null },
      handleKeyDown: jest.fn(),
    })
  })

  it('should use virtualization when authors count exceeds 50', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Показано 60 валидных авторов из 60. (виртуализированная таблица)')).toBeInTheDocument()
  })

  it('should not use virtualization when authors count is 50 or less', () => {
    const smallDataset = Array.from({ length: 50 }, (_, i) => mockAuthor(i + 1))

    mockUseTableSorting.mockReturnValue({
      sortedItems: smallDataset,
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={smallDataset} totalAuthors={50} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Показано 50 валидных авторов из 50.')).toBeInTheDocument()
    expect(screen.queryByText('виртуализированная таблица')).not.toBeInTheDocument()
  })

  it('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => mockAuthor(i + 1))

    mockUseTableSorting.mockReturnValue({
      sortedItems: largeDataset,
      sortState: { key: 'lastActivityAt', direction: 'desc' },
      requestSort: jest.fn(),
    })

    render(<WatchlistAuthorsTable {...defaultProps} authors={largeDataset} totalAuthors={1000} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Показано 1000 валидных авторов из 1000. (виртуализированная таблица)')).toBeInTheDocument()
  })

  it('should maintain table structure with virtualization', () => {
    render(<WatchlistAuthorsTable {...defaultProps} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveAttribute('role', 'grid')
    expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Таблица авторов в списке наблюдения')
  })
})