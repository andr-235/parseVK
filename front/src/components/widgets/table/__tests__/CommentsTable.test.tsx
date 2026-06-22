import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentsTable } from '../CommentsTable'

const mockUseComments = vi.fn()

vi.mock('../../../../shared/hooks/useComments', () => ({
  useComments: (...args: unknown[]) => mockUseComments(...args),
}))

const comment = {
  id: 1,
  text: 'Опасный комментарий',
  group: 'Реальная группа',
  author: 'Автор',
  date: '01.06.2026',
  status: 'Новый' as const,
}

function renderTable() {
  return render(
    <CommentsTable
      onSelect={vi.fn()}
      selectedId={null}
      onError={vi.fn()}
    />,
  )
}

describe('CommentsTable', () => {
  beforeEach(() => {
    mockUseComments.mockReturnValue({
      data: { comments: [comment], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    })
  })

  it('renders returned moderated comments', () => {
    renderTable()

    expect(screen.getByText('Опасный комментарий')).toBeInTheDocument()
    expect(screen.getByText('Реальная группа')).toBeInTheDocument()
  })

  it('uses loaded comments as group filter options', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByLabelText('Фильтр по группе'))

    expect(screen.getByRole('option', { name: 'Реальная группа' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Группа А' })).not.toBeInTheDocument()
  })

  it('shows filtered-empty message when filters hide server rows', async () => {
    const user = userEvent.setup()
    renderTable()

    await user.click(screen.getByLabelText('Фильтр по статусу'))
    await user.click(screen.getByRole('option', { name: 'Чисто' }))

    expect(screen.getByText('Комментарии скрыты текущими фильтрами')).toBeInTheDocument()
    expect(screen.queryByText('Опасный комментарий')).not.toBeInTheDocument()
  })
})
