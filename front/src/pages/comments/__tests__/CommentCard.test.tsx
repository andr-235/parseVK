import type { Comment } from '@/shared/types'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import CommentCard from '../components/CommentCard'

vi.mock('@/shared/components/ui/avatar', () => ({
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
