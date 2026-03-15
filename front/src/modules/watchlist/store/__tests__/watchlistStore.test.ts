import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateAuthorMock, setQueryDataMock } = vi.hoisted(() => ({
  updateAuthorMock: vi.fn(),
  setQueryDataMock: vi.fn(),
}))

vi.mock('@/modules/watchlist/api/watchlist.api', () => ({
  watchlistService: {
    updateAuthor: updateAuthorMock,
  },
}))

vi.mock('@/shared/api', () => ({
  queryClient: {
    setQueryData: setQueryDataMock,
  },
}))

describe('watchlistStore updateAuthorStatus', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('clears selectedAuthor when the selected author is stopped', async () => {
    const { useWatchlistStore } = await import('../watchlistStore')

    useWatchlistStore.setState({
      authors: [
        {
          id: 10,
          authorVkId: 77,
          status: 'ACTIVE',
          commentsCount: 3,
          lastCommentAt: null,
          addedAt: '2026-03-16T00:00:00.000Z',
          updatedAt: '2026-03-16T00:00:00.000Z',
          author: {
            id: 77,
            fullName: 'Test Author',
            screenName: 'test_author',
            avatarUrl: null,
          },
        },
      ],
      totalAuthors: 1,
      selectedAuthor: {
        id: 10,
        authorVkId: 77,
        status: 'ACTIVE',
        commentsCount: 3,
        lastCommentAt: null,
        addedAt: '2026-03-16T00:00:00.000Z',
        updatedAt: '2026-03-16T00:00:00.000Z',
        author: {
          id: 77,
          fullName: 'Test Author',
          screenName: 'test_author',
          avatarUrl: null,
        },
        comments: [],
      },
    })

    updateAuthorMock.mockResolvedValue({
      id: 10,
      authorVkId: 77,
      status: 'STOPPED',
      commentsCount: 3,
      lastCommentAt: null,
      addedAt: '2026-03-16T00:00:00.000Z',
      updatedAt: '2026-03-16T00:00:00.000Z',
      author: {
        id: 77,
        fullName: 'Test Author',
        screenName: 'test_author',
        avatarUrl: null,
      },
    })

    await useWatchlistStore.getState().updateAuthorStatus(10, 'STOPPED')

    expect(useWatchlistStore.getState().selectedAuthor).toBeNull()
    expect(useWatchlistStore.getState().authors).toEqual([])
    expect(useWatchlistStore.getState().totalAuthors).toBe(0)
    expect(setQueryDataMock).toHaveBeenCalled()
  })
})
