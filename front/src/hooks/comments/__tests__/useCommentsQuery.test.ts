import { describe, expect, it } from 'vitest'
import { mergeCommentsSyncData, shouldNotifyCommentsSyncError } from '../useCommentsQuery'

const buildComment = (id: number) => ({
  id,
  author: `Author ${id}`,
  authorId: null,
  authorUrl: null,
  authorAvatar: null,
  commentUrl: null,
  text: `Comment ${id}`,
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
})

describe('shouldNotifyCommentsSyncError', () => {
  it('returns true for initial sync failure without loaded comments', () => {
    expect(shouldNotifyCommentsSyncError(true, true, false)).toBe(true)
  })

  it('returns false for background sync failure when comments are already loaded', () => {
    expect(shouldNotifyCommentsSyncError(true, true, true)).toBe(false)
  })

  it('returns false when sync is disabled or there is no error', () => {
    expect(shouldNotifyCommentsSyncError(false, true, false)).toBe(false)
    expect(shouldNotifyCommentsSyncError(true, false, false)).toBe(false)
  })
})

describe('mergeCommentsSyncData', () => {
  it('keeps loaded extra pages during background sync', () => {
    const result = mergeCommentsSyncData(
      {
        comments: [buildComment(1), buildComment(2)],
        nextCursor: 'cursor-page-2',
        hasMore: true,
        totalCount: 4,
        readCount: 1,
        unreadCount: 3,
        filters: { readStatus: 'unread', keywords: [] },
      },
      {
        comments: [buildComment(1), buildComment(2), buildComment(3), buildComment(4)],
        nextCursor: null,
        hasMore: false,
        totalCount: 4,
        readCount: 1,
        unreadCount: 3,
      }
    )

    expect(result.comments.map((comment) => comment.id)).toEqual([1, 2, 3, 4])
    expect(result.hasMore).toBe(false)
    expect(result.nextCursor).toBeNull()
  })

  it('preserves later cursor when extra pages are already loaded but more pages still exist', () => {
    const result = mergeCommentsSyncData(
      {
        comments: [buildComment(1), buildComment(2)],
        nextCursor: 'cursor-page-2',
        hasMore: true,
        totalCount: 6,
        readCount: 1,
        unreadCount: 5,
        filters: { readStatus: 'unread', keywords: [] },
      },
      {
        comments: [buildComment(1), buildComment(2), buildComment(3), buildComment(4)],
        nextCursor: 'cursor-page-3',
        hasMore: true,
        totalCount: 6,
        readCount: 1,
        unreadCount: 5,
      }
    )

    expect(result.comments.map((comment) => comment.id)).toEqual([1, 2, 3, 4])
    expect(result.hasMore).toBe(true)
    expect(result.nextCursor).toBe('cursor-page-3')
  })
})
