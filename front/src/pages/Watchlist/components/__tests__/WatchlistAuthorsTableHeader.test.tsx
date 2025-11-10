import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { WatchlistAuthorsTableHeader } from '../WatchlistAuthorsTableHeader'
import type { WatchlistAuthorCard, TableColumn } from '@/types'

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

describe('WatchlistAuthorsTableHeader', () => {
  const defaultProps = {
    authorColumns: mockColumns,
    authorSortState: null,
    requestAuthorSort: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render table header with correct structure', () => {
    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} /></thead></table>)

    const header = screen.getByRole('row')
    expect(header).toBeInTheDocument()
  })

  it('should render all column headers', () => {
    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} /></thead></table>)

    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('Имя')).toBeInTheDocument()
    expect(screen.getByText('Статус')).toBeInTheDocument()
  })

  it('should render sortable columns with TableSortButton', () => {
    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} /></thead></table>)

    const sortButtons = screen.getAllByRole('button', { name: /Сортировать по/ })
    expect(sortButtons).toHaveLength(2) // Only ID and Имя are sortable
  })

  it('should render non-sortable columns as plain text', () => {
    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} /></thead></table>)

    // Статус should be plain text, not a button
    const statusHeader = screen.getByText('Статус')
    expect(statusHeader.tagName).not.toBe('BUTTON')
  })

  it('should set correct ARIA attributes for sortable headers', () => {
    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} /></thead></table>)

    const headerCells = screen.getAllByRole('columnheader')
    expect(headerCells).toHaveLength(3)

    headerCells.forEach((cell, index) => {
      expect(cell).toHaveAttribute('aria-colindex', (index + 1).toString())
    })
  })

  it('should set aria-sort="none" when no sorting is applied', () => {
    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} /></thead></table>)

    const sortableHeaders = screen.getAllByRole('columnheader').filter(header =>
      header.hasAttribute('aria-sort')
    )

    sortableHeaders.forEach(header => {
      expect(header).toHaveAttribute('aria-sort', 'none')
    })
  })

  it('should set aria-sort="ascending" when column is sorted ascending', () => {
    const propsWithAscSort = {
      ...defaultProps,
      authorSortState: { key: 'id', direction: 'asc' as const },
    }

    render(<table><thead><WatchlistAuthorsTableHeader {...propsWithAscSort} /></thead></table>)

    const idHeader = screen.getByRole('columnheader', { name: /ID/ })
    expect(idHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('should set aria-sort="descending" when column is sorted descending', () => {
    const propsWithDescSort = {
      ...defaultProps,
      authorSortState: { key: 'author.fullName', direction: 'desc' as const },
    }

    render(<table><thead><WatchlistAuthorsTableHeader {...propsWithDescSort} /></thead></table>)

    const nameHeader = screen.getByRole('columnheader', { name: /Имя/ })
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('should call requestAuthorSort when sortable column button is clicked', async () => {
    const user = userEvent.setup()
    const mockRequestSort = jest.fn()

    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} requestAuthorSort={mockRequestSort} /></thead></table>)

    const idSortButton = screen.getByRole('button', { name: 'Сортировать по ID' })
    await user.click(idSortButton)

    expect(mockRequestSort).toHaveBeenCalledWith('id')
  })

  it('should call requestAuthorSort with correct key for each sortable column', async () => {
    const user = userEvent.setup()
    const mockRequestSort = jest.fn()

    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} requestAuthorSort={mockRequestSort} /></thead></table>)

    const nameSortButton = screen.getByRole('button', { name: 'Сортировать по Имя' })
    await user.click(nameSortButton)

    expect(mockRequestSort).toHaveBeenCalledWith('author.fullName')
  })

  it('should handle keyboard activation of sort buttons', async () => {
    const user = userEvent.setup()
    const mockRequestSort = jest.fn()

    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} requestAuthorSort={mockRequestSort} /></thead></table>)

    const idSortButton = screen.getByRole('button', { name: 'Сортировать по ID' })

    // Focus and press Enter
    idSortButton.focus()
    await user.keyboard('{Enter}')

    expect(mockRequestSort).toHaveBeenCalledWith('id')
  })

  it('should handle keyboard activation with Space key', async () => {
    const user = userEvent.setup()
    const mockRequestSort = jest.fn()

    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} requestAuthorSort={mockRequestSort} /></thead></table>)

    const nameSortButton = screen.getByRole('button', { name: 'Сортировать по Имя' })

    // Focus and press Space
    nameSortButton.focus()
    await user.keyboard(' ')

    expect(mockRequestSort).toHaveBeenCalledWith('author.fullName')
  })

  it('should apply custom header className when provided', () => {
    const columnsWithClassName: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'ID',
        key: 'id',
        sortable: true,
        headerClassName: 'custom-header-class',
      },
    ]

    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} authorColumns={columnsWithClassName} /></thead></table>)

    const headerCell = screen.getByRole('columnheader', { name: /ID/ })
    expect(headerCell).toHaveClass('custom-header-class')
  })

  it('should handle empty columns array', () => {
    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} authorColumns={[]} /></thead></table>)

    const headerCells = screen.queryAllByRole('columnheader')
    expect(headerCells).toHaveLength(0)
  })

  it('should handle columns with complex keys', () => {
    const columnsWithComplexKeys: TableColumn<WatchlistAuthorCard>[] = [
      {
        header: 'Вложенное поле',
        key: 'author.profile.settings.theme',
        sortable: true,
      },
    ]

    render(<table><thead><WatchlistAuthorsTableHeader {...defaultProps} authorColumns={columnsWithComplexKeys} /></thead></table>)

    expect(screen.getByText('Вложенное поле')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сортировать по Вложенное поле' })).toBeInTheDocument()
  })
})