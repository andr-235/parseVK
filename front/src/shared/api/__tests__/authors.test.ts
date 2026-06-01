import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchAuthors, verifyAuthor, deleteAuthor, refreshAuthors } from '../authors'

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

const backendAuthor = {
  id: 1,
  vkAuthorId: 12345,
  type: 'user',
  displayName: 'Иван Иванов',
  fullName: 'Иван Иванов',
  photo50: 'https://vk.com/photo.jpg',
  domain: 'ivanov',
  screenName: 'id12345',
  profileUrl: 'https://vk.com/id12345',
  city: { id: 1, title: 'Москва' },
  photosCount: 42,
  followersCount: 150,
  verifiedAt: '2026-05-30T00:00:00Z',
  isVerified: true,
  createdAt: '2026-05-30T00:00:00Z',
}

describe('authors API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchAuthors maps backend response', async () => {
    const backend = { items: [backendAuthor], total: 1, hasMore: false }
    mockApiGet.mockResolvedValueOnce(backend)
    const result = await fetchAuthors({ page: 1, limit: 20, type: 'user' })
    expect(mockApiGet).toHaveBeenCalledWith('/content/authors', { page: 1, limit: 20, type: 'user' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0].displayName).toBe('Иван Иванов')
    expect(result.items[0].vkAuthorId).toBe(12345)
    expect(result.items[0].photosCount).toBe(42)
    expect(result.items[0].city?.title).toBe('Москва')
  })

  it('fetchAuthors handles empty list', async () => {
    mockApiGet.mockResolvedValueOnce({ items: [], total: 0, hasMore: false })
    const result = await fetchAuthors()
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('fetchAuthors omits undefined params', async () => {
    mockApiGet.mockResolvedValueOnce({ items: [], total: 0, hasMore: false })
    await fetchAuthors({ search: undefined })
    expect(mockApiGet).toHaveBeenCalledWith('/content/authors', { search: undefined })
  })

  it('verifyAuthor calls PATCH', async () => {
    mockApiPatch.mockResolvedValueOnce({ status: 'success' })
    await verifyAuthor(12345)
    expect(mockApiPatch).toHaveBeenCalledWith('/content/authors/12345/verify', {})
  })

  it('deleteAuthor calls DELETE', async () => {
    mockApiDelete.mockResolvedValueOnce({ deleted: true })
    await deleteAuthor(12345)
    expect(mockApiDelete).toHaveBeenCalledWith('/content/authors/12345')
  })

  it('refreshAuthors calls POST and returns count', async () => {
    mockApiPost.mockResolvedValueOnce({ updated: 5 })
    const result = await refreshAuthors()
    expect(mockApiPost).toHaveBeenCalledWith('/content/authors/refresh')
    expect(result).toBe(5)
  })
})
