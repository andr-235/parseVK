import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommentDetail } from '../CommentDetail'
import type { Comment } from '../../../../../types/comments'

const mockComment: Comment = {
  id: 42,
  text: 'Подозрительный комментарий',
  group: 'Группа #123',
  author: 'Иван Иванов',
  date: '01.06.2026',
  status: 'Новый',
  postUrl: 'https://vk.com/wall-123_456',
}

describe('CommentDetail', () => {
  it('renders empty state when no comment', () => {
    render(<CommentDetail comment={null} onClose={() => {}} />)
    expect(screen.getByText('Выберите комментарий для просмотра деталей')).toBeInTheDocument()
  })

  it('renders comment details when provided', () => {
    render(<CommentDetail comment={mockComment} onClose={() => {}} />)
    expect(screen.getByText('Комментарий #42')).toBeInTheDocument()
    expect(screen.getByText('Подозрительный комментарий')).toBeInTheDocument()
    expect(screen.getByText('Группа #123')).toBeInTheDocument()
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText('01.06.2026')).toBeInTheDocument()
    expect(screen.getByText('Новый')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    render(<CommentDetail comment={mockComment} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Отметить как чисто' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Отметить как нарушение' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Открыть в источнике' })).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<CommentDetail comment={mockComment} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Закрыть панель деталей' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has complementary role', () => {
    render(<CommentDetail comment={mockComment} onClose={() => {}} />)
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })
})
