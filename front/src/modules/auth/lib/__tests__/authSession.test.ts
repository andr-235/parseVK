import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const defaultUser = {
  id: 'user-1',
  username: 'admin',
  role: 'admin',
  isActive: true,
  isSuperuser: true,
}

const loadAuthModules = async () => {
  const [{ useAuthStore }, { refreshAccessToken }] = await Promise.all([
    import('@/modules/auth/store'),
    import('../authSession'),
  ])

  return {
    useAuthStore,
    refreshAccessToken,
  }
}

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
    Reflect.deleteProperty(globalThis, 'fetch')
  })

  it('keeps auth state on transient refresh failure', async () => {
    const { useAuthStore, refreshAccessToken } = await loadAuthModules()
    useAuthStore.setState({
      accessToken: 'valid-access-token',
      user: defaultUser,
    })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn(),
    } as Response) as typeof fetch

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(useAuthStore.getState().accessToken).toBe('valid-access-token')
    expect(useAuthStore.getState().user).toEqual(defaultUser)
  })

  it('keeps auth state when refresh request throws a network error', async () => {
    const { useAuthStore, refreshAccessToken } = await loadAuthModules()
    useAuthStore.setState({
      accessToken: 'valid-access-token',
      user: defaultUser,
    })

    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('network error')) as typeof fetch

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(useAuthStore.getState().accessToken).toBe('valid-access-token')
    expect(useAuthStore.getState().user).toEqual(defaultUser)
  })

  it('refreshes access token through the gateway cookie flow', async () => {
    const { useAuthStore, refreshAccessToken } = await loadAuthModules()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        accessToken: 'next-access-token',
        user: defaultUser,
      }),
    } as unknown as Response) as typeof fetch

    const result = await refreshAccessToken()

    expect(result).toBe('next-access-token')
    expect(useAuthStore.getState().accessToken).toBe('next-access-token')
    expect(useAuthStore.getState().user).toEqual(defaultUser)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/refresh'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      })
    )
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]).not.toHaveProperty(
      'body'
    )
  })

  it('clears auth state on fatal refresh response', async () => {
    const { useAuthStore, refreshAccessToken } = await loadAuthModules()
    useAuthStore.setState({
      accessToken: 'expired-access-token',
      user: defaultUser,
    })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: vi.fn(),
    } as Response) as typeof fetch

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
