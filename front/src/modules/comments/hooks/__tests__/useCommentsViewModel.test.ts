import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useCommentsViewModel from '../useCommentsViewModel'

const buildComment = (id: number, text: string, matchedKeywords: Array<{ id: number; word: string }> = []) => ({
  id,
  author: `Автор ${id}`,
  authorId: null,
  authorUrl: null,
  authorAvatar: null,
  commentUrl: null,
  text,
  postText: null,
  postAttachments: null,
  postGroup: null,
  createdAt: '2026-03-16T00:00:00.000Z',
  publishedAt: null,
  isRead: false,
  isDeleted: false,
  watchlistAuthorId: null,
  isWatchlisted: false,
  matchedKeywords,
})

const commentsStoreState = {
  comments: [],
  isLoading: false,
  fetchCommentsCursor: vi.fn(),
  setFilters: vi.fn(),
  setQueryEnabled: vi.fn(),
  isLoadingMore: false,
  hasMore: false,
  totalCount: 0,
  readCount: 0,
  unreadCount: 0,
  toggleReadStatus: vi.fn(),
  markWatchlisted: vi.fn(),
}

vi.mock('@/modules/comments/store', () => ({
  useCommentsStore: (selector: (state: typeof commentsStoreState) => unknown) =>
    selector(commentsStoreState),
}))

vi.mock('@/modules/keywords', () => ({
  useKeywordsStore: () => ({
    keywords: [{ id: 1, word: 'путлер', category: 'Оскорбление' }],
  }),
}))

vi.mock('@/modules/watchlist', () => ({
  useWatchlistStore: () => ({
    addAuthorFromComment: vi.fn(),
  }),
}))

vi.mock('@/modules/comments/hooks/useCommentsSearchQuery', () => ({
  useCommentsSearchQuery: () => ({
    data: null,
    isLoading: false,
  }),
}))

vi.mock('@/modules/comments/api/query/buildCommentsSearchQuery', () => ({
  buildCommentsSearchPayload: vi.fn(() => ({})),
  shouldUseCommentsSearch: vi.fn(() => false),
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('useCommentsViewModel', () => {
  it('does not enable keyword comment filter by default', () => {
    const { result } = renderHook(() => useCommentsViewModel())

    expect(result.current.showKeywordComments).toBe(false)
    expect(result.current.showKeywordPosts).toBe(false)
  })

  it('separates total, loaded and rendered counters in normal mode', () => {
    commentsStoreState.comments = [
      buildComment(1, 'первый комментарий', [{ id: 1, word: 'путлер' }]),
      buildComment(2, 'второй комментарий'),
      buildComment(3, 'третий комментарий'),
    ]
    commentsStoreState.totalCount = 9

    const { result } = renderHook(() => useCommentsViewModel())

    expect(result.current.totalCount).toBe(9)
    expect(result.current.loadedCount).toBe(3)
    expect(result.current.renderedCount).toBe(3)
  })
})
