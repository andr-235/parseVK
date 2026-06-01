import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterToolbar } from '../FilterToolbar'

describe('FilterToolbar', () => {
  const defaultProps = {
    search: '',
    onSearchChange: vi.fn(),
    groupFilter: 'Все группы',
    onGroupFilterChange: vi.fn(),
    statusFilter: 'Все статусы',
    onStatusFilterChange: vi.fn(),
    onReset: vi.fn(),
    selectedCount: 0,
  }

  it('renders search input and selects', () => {
    render(<FilterToolbar {...defaultProps} />)
    expect(screen.getByLabelText('Поиск по тексту комментариев')).toBeInTheDocument()
    expect(screen.getByLabelText('Фильтр по группе')).toBeInTheDocument()
    expect(screen.getByLabelText('Фильтр по статусу')).toBeInTheDocument()
  })

  it('renders export and reset buttons', () => {
    render(<FilterToolbar {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Сбросить все фильтры' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Экспортировать в Excel' })).toBeInTheDocument()
  })

  it('shows selected count when > 0', () => {
    render(<FilterToolbar {...defaultProps} selectedCount={3} />)
    expect(screen.getByText('Выбрано: 3')).toBeInTheDocument()
  })

  it('calls onSearchChange on type', async () => {
    const onSearchChange = vi.fn()
    const user = userEvent.setup()
    render(<FilterToolbar {...defaultProps} onSearchChange={onSearchChange} />)
    const input = screen.getByLabelText('Поиск по тексту комментариев')
    await user.type(input, 'abc')
    expect(onSearchChange).toHaveBeenCalledTimes(3)
  })

  it('calls onReset on reset click', async () => {
    const onReset = vi.fn()
    const user = userEvent.setup()
    render(<FilterToolbar {...defaultProps} onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: 'Сбросить все фильтры' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
