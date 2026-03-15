import { describe, expect, it } from 'vitest'
import { mergeWatchlistAuthors } from '../useWatchlistQueries'
import type { WatchlistAuthorCard } from '@/modules/watchlist/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

const buildAuthor = (id: number, status: WatchlistAuthorCard['status'] = 'ACTIVE'): WatchlistAuthorCard => ({
  id,
  authorVkId: id * 10,
  status,
  lastCheckedAt: null,
  lastActivityAt: null,
  foundCommentsCount: 0,
  totalComments: 0,
  monitoringStartedAt: '2026-03-16T00:00:00.000Z',
  monitoringStoppedAt: status === 'STOPPED' ? '2026-03-16T01:00:00.000Z' : null,
  settingsId: 1,
  author: {
    vkUserId: id * 10,
    firstName: `Name${id}`,
    lastName: `Last${id}`,
    fullName: `Name${id} Last${id}`,
    avatar: null,
    profileUrl: null,
    screenName: `user_${id}`,
    domain: null,
  },
  analysisSummary: createEmptyPhotoAnalysisSummary(),
})

describe('mergeWatchlistAuthors', () => {
  it('keeps loaded extra pages and hides load more when all authors are already present', () => {
    const incoming = Array.from({ length: 20 }, (_, index) => buildAuthor(index + 1))
    const existing = Array.from({ length: 30 }, (_, index) => buildAuthor(index + 1))

    const result = mergeWatchlistAuthors(incoming, existing, 30)

    expect(result.authors).toHaveLength(30)
    expect(result.hasMoreAuthors).toBe(false)
  })

  it('drops stopped extras from previously loaded pages', () => {
    const incoming = [buildAuthor(1), buildAuthor(2)]
    const existing = [buildAuthor(1), buildAuthor(2), buildAuthor(3, 'STOPPED'), buildAuthor(4)]

    const result = mergeWatchlistAuthors(incoming, existing, 4)

    expect(result.authors.map((item) => item.id)).toEqual([1, 2, 4])
    expect(result.hasMoreAuthors).toBe(true)
  })
})
