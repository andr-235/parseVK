import { filterValidAuthors, validateAuthorId } from '@/modules/watchlist/utils/watchlistUtils'
import type { WatchlistAuthorCard } from '@/types'
import { createEmptyPhotoAnalysisSummary } from '@/types'

describe('watchlistUtils', () => {
  describe('validateAuthorId', () => {
    it('should return true for valid number ID', () => {
      expect(validateAuthorId(1)).toBe(true)
      expect(validateAuthorId(0)).toBe(true)
      expect(validateAuthorId(-1)).toBe(true)
    })

    it('should return false for undefined ID', () => {
      expect(validateAuthorId(undefined)).toBe(false)
    })
  })

  describe('filterValidAuthors', () => {
    const mockAuthor = (id?: number): WatchlistAuthorCard => ({
      id: id as number,
      authorVkId: 123,
      status: 'ACTIVE',
      lastCheckedAt: null,
      lastActivityAt: '2023-01-01T00:00:00Z',
      foundCommentsCount: 10,
      totalComments: 10,
      monitoringStartedAt: '2023-01-01T00:00:00Z',
      monitoringStoppedAt: null,
      settingsId: 1,
      author: {
        vkUserId: 123,
        firstName: 'Test',
        lastName: 'Author',
        fullName: 'Test Author',
        avatar: null,
        profileUrl: null,
        screenName: null,
        domain: null,
      },
      analysisSummary: createEmptyPhotoAnalysisSummary(),
    })

    it('should filter out authors with undefined id', () => {
      const authors = [
        mockAuthor(1),
        mockAuthor(undefined),
        mockAuthor(2),
      ]

      const result = filterValidAuthors(authors)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })

    it('should remove duplicate authors by id', () => {
      const authors = [
        mockAuthor(1),
        mockAuthor(1),
        mockAuthor(2),
      ]

      const result = filterValidAuthors(authors)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })

    it('should return empty array for empty input', () => {
      const result = filterValidAuthors([])
      expect(result).toEqual([])
    })

    it('should return empty array when all authors have undefined id', () => {
      const authors = [
        mockAuthor(undefined),
        mockAuthor(undefined),
      ]

      const result = filterValidAuthors(authors)
      expect(result).toEqual([])
    })

    it('should preserve order of valid authors', () => {
      const authors = [
        mockAuthor(3),
        mockAuthor(undefined),
        mockAuthor(1),
        mockAuthor(2),
        mockAuthor(undefined),
      ]

      const result = filterValidAuthors(authors)

      expect(result).toHaveLength(3)
      expect(result[0].id).toBe(3)
      expect(result[1].id).toBe(1)
      expect(result[2].id).toBe(2)
    })

    it('should handle mixed valid and invalid authors with duplicates', () => {
      const authors = [
        mockAuthor(1),
        mockAuthor(undefined),
        mockAuthor(1),
        mockAuthor(2),
        mockAuthor(undefined),
        mockAuthor(2),
      ]

      const result = filterValidAuthors(authors)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })
  })
})