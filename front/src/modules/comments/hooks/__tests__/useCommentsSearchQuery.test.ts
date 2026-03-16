import { describe, expect, it } from 'vitest'
import {
  buildCommentsSearchPayload,
  shouldUseCommentsSearch,
} from '@/modules/comments/api/query/buildCommentsSearchQuery'
import { mapCommentsSearchResult } from '@/modules/comments/api/mappers/mapCommentsSearchResult'

describe('shouldUseCommentsSearch', () => {
  it('returns true when there is a free-text query', () => {
    expect(shouldUseCommentsSearch({ query: 'ремонт', viewMode: 'comments' })).toBe(true)
  })

  it('returns true for posts mode even without a query', () => {
    expect(shouldUseCommentsSearch({ query: '   ', viewMode: 'posts' })).toBe(true)
  })

  it('returns false for legacy comments mode without a query', () => {
    expect(shouldUseCommentsSearch({ query: '   ', viewMode: 'comments' })).toBe(false)
  })
})

describe('buildCommentsSearchPayload', () => {
  it('builds normalized payload for /comments/search', () => {
    expect(
      buildCommentsSearchPayload({
        query: '  ремонт квартиры  ',
        viewMode: 'comments',
        page: 2,
        pageSize: 10,
        keywords: ['ремонт'],
        keywordSource: 'COMMENT',
        readStatus: 'unread',
      })
    ).toEqual({
      query: 'ремонт квартиры',
      viewMode: 'comments',
      page: 2,
      pageSize: 10,
      keywords: ['ремонт'],
      keywordSource: 'COMMENT',
      readStatus: 'unread',
    })
  })
})

describe('mapCommentsSearchResult', () => {
  it('maps comment-mode response', () => {
    const result = mapCommentsSearchResult({
      source: 'elasticsearch',
      viewMode: 'comments',
      total: 1,
      page: 1,
      pageSize: 20,
      items: [
        {
          type: 'comment',
          commentId: 101,
          postId: 55,
          commentText: 'Нужен ремонт квартиры',
          postText: 'Ищем подрядчика',
          highlight: ['Нужен <em>ремонт</em> квартиры'],
        },
      ],
    })

    expect(result).toEqual({
      source: 'elasticsearch',
      viewMode: 'comments',
      total: 1,
      page: 1,
      pageSize: 20,
      items: [
        {
          type: 'comment',
          commentId: 101,
          postId: 55,
          commentText: 'Нужен ремонт квартиры',
          postText: 'Ищем подрядчика',
          highlight: ['Нужен <em>ремонт</em> квартиры'],
        },
      ],
    })
  })

  it('maps posts-mode response with nested comment items', () => {
    const result = mapCommentsSearchResult({
      source: 'elasticsearch',
      viewMode: 'posts',
      total: 1,
      page: 1,
      pageSize: 20,
      items: [
        {
          type: 'post',
          postId: 55,
          postText: 'Ищем подрядчика',
          comments: [
            {
              type: 'comment',
              commentId: 101,
              postId: 55,
              commentText: 'Нужен ремонт квартиры',
              postText: 'Ищем подрядчика',
              highlight: ['Нужен <em>ремонт</em> квартиры'],
            },
          ],
        },
      ],
    })

    expect(result.items[0]).toEqual({
      type: 'post',
      postId: 55,
      postText: 'Ищем подрядчика',
      comments: [
        {
          type: 'comment',
          commentId: 101,
          postId: 55,
          commentText: 'Нужен ремонт квартиры',
          postText: 'Ищем подрядчика',
          highlight: ['Нужен <em>ремонт</em> квартиры'],
        },
      ],
    })
  })
})
