import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchWatchlistAuthors,
  createWatchlistAuthor,
  fetchWatchlistAuthorDetails,
  updateWatchlistAuthor,
  deleteWatchlistAuthor,
  fetchWatchlistSettings,
  updateWatchlistSettings,
  refreshWatchlist
} from '../watchlist'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
const mockApiPatch = vi.fn()
const mockApiDelete = vi.fn()

vi.mock('../client', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPatch: (...args: unknown[]) => mockApiPatch(...args),
  apiDelete: (...args: unknown[]) => mockApiDelete(...args),
}))

const mockWatchlistAuthor = {
  id: 1,
  authorVkId: 12345,
  status: 'ACTIVE',
  lastCheckedAt: '2026-06-07T00:00:00Z',
  lastActivityAt: '2026-06-07T00:00:00Z',
  foundCommentsCount: 5,
  monitoringStartedAt: '2026-06-01T00:00:00Z',
  monitoringStoppedAt: null,
  author: {
    id: 1,
    vkAuthorId: 12345,
    displayName: 'Иван Иванов',
    fullName: 'Иван Иванов',
    photo50: null,
    screenName: 'ivanov',
    profileUrl: 'https://vk.com/ivanov',
    city: null,
    photosCount: null,
    friendsCount: null,
    followersCount: null,
    isVerified: false,
    createdAt: '2026-06-01T00:00:00Z',
    lastSeenAt: null,
  },
  summary: {
    total: 10,
    suspicious: 2,
    lastAnalyzedAt: null,
    categories: [],
    levels: [],
  }
}

const mockSettings = {
  id: 1,
  trackAllComments: true,
  pollIntervalMinutes: 10,
  maxAuthors: 100,
}

describe('watchlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchWatchlistAuthors calls GET', async () => {
    const response = { items: [mockWatchlistAuthor], total: 1, hasMore: false }
    mockApiGet.mockResolvedValueOnce(response)
    const result = await fetchWatchlistAuthors({ limit: 10, offset: 0, excludeStopped: true })
    expect(mockApiGet).toHaveBeenCalledWith('/watchlist/authors', { limit: 10, offset: 0, excludeStopped: true })
    expect(result).toEqual(response)
  })

  it('createWatchlistAuthor calls POST', async () => {
    mockApiPost.mockResolvedValueOnce(mockWatchlistAuthor)
    const payload = { authorVkId: 12345 }
    const result = await createWatchlistAuthor(payload)
    expect(mockApiPost).toHaveBeenCalledWith('/watchlist/authors', payload)
    expect(result).toEqual(mockWatchlistAuthor)
  })

  it('fetchWatchlistAuthorDetails calls GET with ID', async () => {
    const details = { ...mockWatchlistAuthor, comments: { items: [], total: 0, hasMore: false } }
    mockApiGet.mockResolvedValueOnce(details)
    const result = await fetchWatchlistAuthorDetails(1, { limit: 20 })
    expect(mockApiGet).toHaveBeenCalledWith('/watchlist/authors/1', { limit: 20 })
    expect(result).toEqual(details)
  })

  it('updateWatchlistAuthor calls PATCH', async () => {
    const updated = { ...mockWatchlistAuthor, status: 'STOPPED' }
    mockApiPatch.mockResolvedValueOnce(updated)
    const result = await updateWatchlistAuthor(1, { status: 'STOPPED' })
    expect(mockApiPatch).toHaveBeenCalledWith('/watchlist/authors/1', { status: 'STOPPED' })
    expect(result).toEqual(updated)
  })

  it('deleteWatchlistAuthor calls DELETE', async () => {
    mockApiDelete.mockResolvedValueOnce(undefined)
    await deleteWatchlistAuthor(1)
    expect(mockApiDelete).toHaveBeenCalledWith('/watchlist/authors/1')
  })

  it('fetchWatchlistSettings calls GET', async () => {
    mockApiGet.mockResolvedValueOnce(mockSettings)
    const result = await fetchWatchlistSettings()
    expect(mockApiGet).toHaveBeenCalledWith('/watchlist/settings')
    expect(result).toEqual(mockSettings)
  })

  it('updateWatchlistSettings calls PATCH', async () => {
    const updatedSettings = { ...mockSettings, pollIntervalMinutes: 5 }
    mockApiPatch.mockResolvedValueOnce(updatedSettings)
    const result = await updateWatchlistSettings({ pollIntervalMinutes: 5 })
    expect(mockApiPatch).toHaveBeenCalledWith('/watchlist/settings', { pollIntervalMinutes: 5 })
    expect(result).toEqual(updatedSettings)
  })

  it('refreshWatchlist calls POST', async () => {
    const refreshRes = { status: 'success', new_comments: 3 }
    mockApiPost.mockResolvedValueOnce(refreshRes)
    const result = await refreshWatchlist()
    expect(mockApiPost).toHaveBeenCalledWith('/watchlist/refresh')
    expect(result).toEqual(refreshRes)
  })
})
