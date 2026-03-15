import { beforeEach, describe, expect, it } from 'vitest'
import { useCommentsStore } from '../commentsStore'

describe('commentsStore query gating', () => {
  beforeEach(() => {
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
})
