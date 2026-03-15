import { beforeEach, describe, expect, it, vi } from 'vitest'

const { setQueryDataMock } = vi.hoisted(() => ({
  setQueryDataMock: vi.fn(),
}))

vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual<typeof import('@/shared/api')>('@/shared/api')
  return {
    ...actual,
    queryClient: {
      ...actual.queryClient,
      setQueryData: setQueryDataMock,
    },
  }
})

import { useCommentsStore } from '../commentsStore'

describe('commentsStore query gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCommentsStore.setState({
      comments: [],
      isLoading: false,
      isLoadingMore: false,
      isQueryEnabled: false,
      hasMore: true,
      totalCount: 0,
      nextCursor: null,
      readCount: 0,
      unreadCount: 0,
      filters: {
        readStatus: 'unread',
        keywords: [],
      },
    })
  })

  it('normalizes filters and enables query when requested', () => {
    useCommentsStore.getState().setFilters(
      {
        readStatus: 'all',
        search: '  test  ',
        keywords: [' foo ', '', 'foo', 'bar '],
      },
      { enableQuery: true }
    )

    expect(useCommentsStore.getState().filters).toEqual({
      readStatus: 'all',
      search: 'test',
      keywords: ['foo', 'bar'],
    })
    expect(useCommentsStore.getState().isQueryEnabled).toBe(true)
  })

  it('can disable query without changing filters', () => {
    useCommentsStore.setState({
      isQueryEnabled: true,
      filters: {
        readStatus: 'read',
        keywords: ['alpha'],
      },
    })

    useCommentsStore.getState().setQueryEnabled(false)

    expect(useCommentsStore.getState().isQueryEnabled).toBe(false)
    expect(useCommentsStore.getState().filters).toEqual({
      readStatus: 'read',
      keywords: ['alpha'],
    })
  })

  it('updates current query cache when comment becomes watchlisted', () => {
    useCommentsStore.setState({
      comments: [
        {
          id: 101,
          author: 'Author 101',
          authorId: null,
          authorUrl: null,
          authorAvatar: null,
          commentUrl: null,
          text: 'Comment 101',
          postText: null,
          postAttachments: null,
          postGroup: null,
          createdAt: '2026-03-16T00:00:00.000Z',
          publishedAt: null,
          isRead: false,
          isDeleted: false,
          watchlistAuthorId: null,
          isWatchlisted: false,
          matchedKeywords: [],
        },
      ],
      filters: {
        readStatus: 'unread',
        keywords: ['alpha'],
      },
    })

    useCommentsStore.getState().markWatchlisted(101, 555)

    expect(useCommentsStore.getState().comments[0]).toMatchObject({
      id: 101,
      watchlistAuthorId: 555,
      isWatchlisted: true,
    })
    expect(setQueryDataMock).toHaveBeenCalledTimes(1)
  })
})
