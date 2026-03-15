import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const defaultUser = {
  id: 1,
  username: 'admin',
  role: 'admin' as const,
  isTemporaryPassword: false,
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
      refreshToken: 'valid-refresh-token',
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
    expect(useAuthStore.getState().refreshToken).toBe('valid-refresh-token')
    expect(useAuthStore.getState().user).toEqual(defaultUser)
  })

  it('keeps auth state when refresh request throws a network error', async () => {
    const { useAuthStore, refreshAccessToken } = await loadAuthModules()
    useAuthStore.setState({
      accessToken: 'valid-access-token',
      refreshToken: 'valid-refresh-token',
      user: defaultUser,
    })

    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('network error')) as typeof fetch

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(useAuthStore.getState().accessToken).toBe('valid-access-token')
    expect(useAuthStore.getState().refreshToken).toBe('valid-refresh-token')
    expect(useAuthStore.getState().user).toEqual(defaultUser)
  })
})
