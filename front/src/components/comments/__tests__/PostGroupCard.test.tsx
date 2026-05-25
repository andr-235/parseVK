import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PostGroupCard } from '../PostGroupCard'

vi.mock('../CommentAttachments', () => ({
  CommentAttachments: () => <div>attachments</div>,
}))

vi.mock('../CommentCard', () => ({
  default: () => null,
}))

describe('PostGroupCard', () => {
  it('shows matched post keyword form label when form differs from base word', () => {
    render(
      <PostGroupCard
        postText="В посте обсуждают клоунов"
        postAttachments={null}
        postGroup={{ name: 'Тестовая группа', photo: null }}
        comments={[
          {
            index: 0,
            comment: {
              id: 1,
              author: 'Автор',
              text: 'Комментарий',
              createdAt: '2026-03-16T00:00:00.000Z',
              isRead: false,
              isWatchlisted: false,
              matchedKeywords: [],
            },
            matchedKeywords: [
              {
                id: 1,
                word: 'клоун',
                forms: ['клоун', 'клоунов'],
                source: 'POST',
              },
            ],
          },
        ]}
        toggleReadStatus={async () => {}}
        showKeywordComments={false}
        showKeywordPosts={true}
      />
    )

    expect(screen.getByText('клоун / клоунов')).toBeInTheDocument()
  })
})
