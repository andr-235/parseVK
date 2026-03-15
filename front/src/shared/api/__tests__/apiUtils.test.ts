import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequest } from '../apiUtils'
import { useAuthStore } from '@/modules/auth/store'

const { refreshAccessTokenMock } = vi.hoisted(() => ({
  refreshAccessTokenMock: vi.fn(),
}))

vi.mock('@/modules/auth', async () => {
  const actual = await vi.importActual<typeof import('@/modules/auth')>('@/modules/auth')
  return {
    ...actual,
    refreshAccessToken: refreshAccessTokenMock,
  }
})

describe('createRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      accessToken: 'old-access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        username: 'admin',
        role: 'admin',
        isTemporaryPassword: false,
      },
    })
  })

  it('retries the original request with a new access token after 401', async () => {
    refreshAccessTokenMock.mockResolvedValue('new-access-token')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

    globalThis.fetch = fetchMock as typeof fetch

    const response = await createRequest('/api/comments')

    expect(response.status).toBe(200)
    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const firstHeaders = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    const retryHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers)

    expect(firstHeaders.get('Authorization')).toBe('Bearer old-access-token')
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-access-token')
  })
})
