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
          owner_id: -123,
          created_at: '2026-06-01T10:00:00Z',
          author: { display_name: 'Group Name', full_name: 'Full' },
          group: { name: 'Group Name', screen_name: 'group_screen' },
          is_read: true,
        },
        {
          id: 2,
          text: 'Another comment',
          owner_id: 456,
          created_at: '2026-05-15T00:00:00Z',
          is_read: false,
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
      group: 'Group Name',
      author: 'Group Name',
      authorUrl: undefined,
      authorScreenName: undefined,
      authorAvatar: undefined,
      groupUrl: 'https://vk.com/group_screen',
      groupScreenName: 'group_screen',
      groupAvatar: undefined,
      date: '01.06.2026',
      status: 'Проверка',
    })

    expect(result.comments[1]).toEqual({
      id: 2,
      text: 'Another comment',
      group: 'Пользователь #456',
      author: 'vk456',
      authorUrl: undefined,
      authorScreenName: undefined,
      authorAvatar: undefined,
      groupUrl: undefined,
      groupScreenName: undefined,
      groupAvatar: undefined,
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
      items: [{ id: 1, text: 'x', owner_id: 1, created_at: '2026-01-01T00:00:00Z', author: { full_name: 'Full Name' }, is_read: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].author).toBe('Full Name')
  })

  it('maps profile_url from backend author', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', owner_id: 1, created_at: '2026-01-01T00:00:00Z', author: { display_name: 'User', profile_url: 'https://vk.com/id123' }, is_read: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].authorUrl).toBe('https://vk.com/id123')
  })

  it('falls back to vk+ownerId when no author', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', owner_id: 42, created_at: '2026-01-01T00:00:00Z', is_read: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].author).toBe('vk42')
  })

  it('returns dash when created_at is nullish', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', owner_id: 1, created_at: null, is_read: false } as never],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].date).toBe('—')
  })

  it('returns dash for invalid date string', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', owner_id: 1, created_at: 'not-a-date', is_read: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].date).toBe('—')
  })

  it('falls back to "Неизвестный" when author and owner_id are missing', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', owner_id: 0, created_at: '2026-01-01T00:00:00Z', is_read: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].author).toBe('Неизвестный')
  })

  it('handles missing optional fields gracefully', async () => {
    mockApiGet.mockResolvedValueOnce({
      items: [{ id: 1, text: 'x', owner_id: 1, created_at: '2026-01-01T00:00:00Z', is_read: false }],
      total: 1, hasMore: false,
    })
    const result = await fetchComments({ page: 1, pageSize: 10 })
    expect(result.comments[0].authorUrl).toBeUndefined()
    expect(result.comments[0].authorAvatar).toBeUndefined()
    expect(result.comments[0].groupUrl).toBeUndefined()
    expect(result.comments[0].groupAvatar).toBeUndefined()
  })
})
