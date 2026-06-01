import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaginationBar } from '../PaginationBar'

describe('PaginationBar', () => {
  const defaultProps = {
    page: 1,
    totalPages: 5,
    pageSize: 25,
    totalItems: 112,
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
  }

  it('renders page range info', () => {
    render(<PaginationBar {...defaultProps} />)
    expect(screen.getByText('1–25 из 112')).toBeInTheDocument()
  })

  it('renders correct page numbers', () => {
    render(<PaginationBar {...defaultProps} />)
    expect(screen.getByLabelText('Страница 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Страница 5')).toBeInTheDocument()
  })

  it('highlights current page', () => {
    render(<PaginationBar {...defaultProps} page={3} />)
    const current = screen.getByLabelText('Страница 3')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('disables prev on first page', () => {
    render(<PaginationBar {...defaultProps} page={1} />)
    expect(screen.getByLabelText('Предыдущая страница')).toBeDisabled()
  })

  it('disables next on last page', () => {
    render(<PaginationBar {...defaultProps} page={5} />)
    expect(screen.getByLabelText('Следующая страница')).toBeDisabled()
  })

  it('calls onPageChange on page click', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(<PaginationBar {...defaultProps} page={1} onPageChange={onPageChange} />)
    await user.click(screen.getByLabelText('Страница 3'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange on prev/next click', async () => {
    const onPageChange = vi.fn()
    const user = userEvent.setup()
    render(<PaginationBar {...defaultProps} page={3} onPageChange={onPageChange} />)

    await user.click(screen.getByLabelText('Предыдущая страница'))
    expect(onPageChange).toHaveBeenCalledWith(2)

    await user.click(screen.getByLabelText('Следующая страница'))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('renders ellipsis for many pages', () => {
    render(<PaginationBar {...defaultProps} totalPages={10} page={5} />)
    const ellipses = screen.getAllByText('…')
    expect(ellipses).toHaveLength(2)
  })

  it('no ellipsis for few pages', () => {
    render(<PaginationBar {...defaultProps} totalPages={5} page={3} />)
    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })
})
