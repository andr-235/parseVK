import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchComments } from '../comments'

const mockApiGet = vi.fn()
vi.mock('../client', () => ({
  apiGet: (...args: unknown[]) => mockApiGet(...args),
}))

describe('fetchComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps backend comments to frontend model', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [
        {
          id: 1,
          text: 'Test comment',
          ownerId: -123,
          createdAt: '2026-06-01T10:00:00Z',
          author: { displayName: 'Group Name', fullName: 'Full' },
          isRead: true,
        },
        {
          id: 2,
          text: 'Another comment',
          ownerId: 456,
          createdAt: '2026-05-15T00:00:00Z',
          isRead: false,
        },
      ],
      total: 2,
      hasMore: false,
    })

    const result = await fetchComments({ page: 1, pageSize: 10 })

    expect(result.total).toBe(2)
    expect(result.comments).toHaveLength(2)

    expect(result.comments[0]).toEqual({
      id: 1,
      text: 'Test comment',
      group: 'Группа #123',
      author: 'Group Name',
      date: '01.06.2026',
      status: 'Проверка',
    })

    expect(result.comments[1]).toEqual({
      id: 2,
      text: 'Another comment',
      group: 'Пользователь #456',
      author: 'vk456',
      date: '15.05.2026',
      status: 'Новый',
    })
  })

  it('computes correct offset from page/pageSize', async () => {
    mockApiGet.mockResolvedValueOnce({ items: [], total: 0, hasMore: false })
    await fetchComments({ page: 3, pageSize: 25 })
    expect(mockApiGet).toHaveBeenCalledWith('/comments', {
      offset: 50,
      limit: 25,
      search: undefined,
    })
  })

  it('passes search param when provided', async () => {
    mockApiGet.mockResolvedValueOnce({ items: [], total: 0, hasMore: false })
    await fetchComments({ page: 1, pageSize: 10, search: 'test' })
    expect(mockApiGet).toHaveBeenCalledWith('/comments', {
      offset: 0,
      limit: 10,
      search: 'test',
    })
  })

  it('handles empty response', async () => {
    mockApiGet.mockResolvedValueOnce({ items: [], total: 0, hasMore: false })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments).toEqual([])
    expect(result.total).toBe(0)
  })

  it('falls back to author fullName when displayName missing', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', ownerId: 1, createdAt: '2026-01-01T00:00:00Z', author: { fullName: 'Full Name' }, isRead: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].author).toBe('Full Name')
  })

  it('falls back to vk+ownerId when no author', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', ownerId: 42, createdAt: '2026-01-01T00:00:00Z', isRead: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].author).toBe('vk42')
  })
})
