import type { Comment } from '@/types'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CommentCard from '../CommentCard'

vi.mock('@/shared/ui/avatar', () => ({
  Avatar: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AvatarImage: () => null,
  AvatarFallback: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('../CommentAttachments', () => ({
  CommentAttachments: () => <div>attachments</div>,
}))

vi.mock('../CommentThread', () => ({
  CommentThread: () => null,
}))

const createComment = (): Comment => ({
  id: 1,
  author: 'Иван Иванов',
  text: 'Нужен ремонт под ключ',
  createdAt: '2026-03-16T00:00:00.000Z',
  isRead: false,
  isWatchlisted: false,
  matchedKeywords: [],
})

describe('CommentCard', () => {
  it('renders category tags and notifies about category click', async () => {
    const user = userEvent.setup()
    const onCategoryClick = vi.fn()

    render(
      <CommentCard
        comment={createComment()}
        index={1}
        toggleReadStatus={async () => {}}
        matchedKeywords={[
          { id: 1, word: 'ремонт', category: 'Услуги' },
          { id: 2, word: 'скидка', category: 'Акции' },
        ]}
        onCategoryClick={onCategoryClick}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Услуги' }))

    expect(screen.getByRole('button', { name: 'Акции' })).toBeInTheDocument()
    expect(onCategoryClick).toHaveBeenCalledWith('Услуги')
  })

  it('shows matched keyword form label when form differs from base word', () => {
    render(
      <CommentCard
        comment={{
          ...createComment(),
          text: 'Вижу клоунов в комментарии',
        }}
        index={1}
        toggleReadStatus={async () => {}}
        matchedKeywords={[{ id: 1, word: 'клоун', forms: ['клоун', 'клоунов'] }]}
      />
    )

    expect(screen.getByText('клоун / клоунов')).toBeInTheDocument()
  })
})
