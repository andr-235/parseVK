import type { CategorizedComment, CategorizedGroup } from '@/modules/comments/types/commentsTable'
import type { Comment } from '@/types'
import { fireEvent, render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import CommentsTableCard from '../CommentsTableCard'

vi.mock('../CommentCard', () => ({
  default: ({
    comment,
    onCategoryClick,
    matchedKeywords,
  }: {
    comment: Comment
    matchedKeywords: Array<{ category?: string | null }>
    onCategoryClick?: (category: string) => void
  }) => (
    <div>
      <span>{comment.text}</span>
      {matchedKeywords
        .map((keyword) => keyword.category)
        .filter(Boolean)
        .map((category) => (
          <button key={category} onClick={() => onCategoryClick?.(category!)}>
            {category}
          </button>
        ))}
    </div>
  ),
}))

vi.mock('../PostGroupCard', () => ({
  PostGroupCard: () => null,
}))

class MockIntersectionObserver {
  observe() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})

const createCategorizedComment = (
  id: number,
  text: string,
  category: string
): CategorizedComment => ({
  comment: {
    id,
    author: `Автор ${id}`,
    text,
    createdAt: '2026-03-16T00:00:00.000Z',
    isRead: false,
    isWatchlisted: false,
    matchedKeywords: [],
  },
  matchedKeywords: [{ id, word: text, category }],
  categories: [category],
})

const groupedComments: CategorizedGroup[] = [
  {
    category: 'Услуги',
    comments: [createCategorizedComment(1, 'Комментарий услуги', 'Услуги')],
  },
  {
    category: 'Акции',
    comments: [createCategorizedComment(2, 'Комментарий акции', 'Акции')],
  },
]

describe('CommentsTableCard', () => {
  it('filters comments by selected categories', async () => {
    render(
      <CommentsTableCard
        groupedComments={groupedComments}
        commentsWithoutKeywords={[]}
        commentIndexMap={
          new Map([
            [1, 0],
            [2, 1],
          ])
        }
        isLoading={false}
        emptyMessage="Нет комментариев"
        toggleReadStatus={async () => {}}
        onLoadMore={() => {}}
        hasMore={false}
        isLoadingMore={false}
        totalCount={2}
        loadedCount={2}
        visibleCount={2}
        showKeywordComments={true}
        showKeywordPosts={false}
        hasDefinedKeywords={true}
        keywordCommentsTotal={2}
      />
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Акции' })[0])

    expect(screen.getByText('Комментарий акции')).toBeInTheDocument()
    expect(screen.queryByText('Комментарий услуги')).not.toBeInTheDocument()
  })
})
