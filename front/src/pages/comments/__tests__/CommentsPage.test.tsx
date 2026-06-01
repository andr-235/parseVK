import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentsPage } from '../CommentsPage'

let mockTableError: string | null = null
let mockTableRetryVersion = 0

vi.mock('../../../components/widgets/table/CommentsTable', () => ({
  CommentsTable: vi.fn(({ onSelect, onError }: { onSelect: (c: unknown) => void; onError: (e: string | null) => void }) => {
    setTimeout(() => onError(mockTableError), 0)
    mockTableRetryVersion++
    return <div data-testid={`comments-table-v${mockTableRetryVersion}`}>
      <button onClick={() => onSelect({ id: 1, text: 'Test', group: 'G', author: 'A', date: '01.01.2026', status: 'Новый' })}>
        Select comment
      </button>
    </div>
  }),
}))

vi.mock('../../../components/widgets/comments/detail/CommentDetail', () => ({
  CommentDetail: vi.fn(({ comment, onClose }: { comment: { id: number } | null; onClose: () => void }) => {
    if (!comment) return null
    return <div data-testid="comment-detail">
      <span>Comment #{comment.id}</span>
      <button onClick={onClose}>Close</button>
    </div>
  }),
}))

describe('CommentsPage', () => {
  beforeEach(() => {
    mockTableError = null
    mockTableRetryVersion = 0
  })

  it('renders page title and table', async () => {
    render(<CommentsPage />)
    expect(screen.getByText('Комментарии')).toBeInTheDocument()
    expect(await screen.findByTestId('comments-table-v1')).toBeInTheDocument()
  })

  it('shows detail panel when comment selected', async () => {
    const user = userEvent.setup()
    render(<CommentsPage />)
    await user.click(screen.getByText('Select comment'))
    expect(screen.getByTestId('comment-detail')).toBeInTheDocument()
    expect(screen.getByText('Comment #1')).toBeInTheDocument()
  })

  it('closes detail panel on close', async () => {
    const user = userEvent.setup()
    render(<CommentsPage />)
    await user.click(screen.getByText('Select comment'))
    expect(screen.getByTestId('comment-detail')).toBeInTheDocument()
    await user.click(screen.getByText('Close'))
    expect(screen.queryByTestId('comment-detail')).not.toBeInTheDocument()
  })

  it('shows error state when onError called with message', async () => {
    mockTableError = 'Failed to load'
    render(<CommentsPage />)
    expect(await screen.findByText('Ошибка загрузки')).toBeInTheDocument()
    expect(await screen.findByText('Failed to load')).toBeInTheDocument()
  })

  it('retries after error', async () => {
    mockTableError = 'Failed to load'
    const user = userEvent.setup()
    render(<CommentsPage />)
    expect(await screen.findByText('Ошибка загрузки')).toBeInTheDocument()

    mockTableError = null
    await user.click(screen.getByLabelText('Повторить загрузку'))
    expect(await screen.findByTestId('comments-table-v2')).toBeInTheDocument()
  })
})
