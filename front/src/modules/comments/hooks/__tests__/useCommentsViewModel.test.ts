import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useCommentsViewModel from '../useCommentsViewModel'

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
})
