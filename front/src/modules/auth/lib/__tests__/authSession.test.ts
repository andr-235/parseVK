import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockStoreState = vi.hoisted(() => ({
  refreshToken: 'valid-refresh-token' as string | null,
  clearAuth: vi.fn(),
  setAuth: vi.fn(),
}))

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: vi.fn(() => mockStoreState),
  },
}))

import { refreshAccessToken } from '../authSession'

describe('refreshAccessToken', () => {
  beforeEach(() => {
    mockStoreState.refreshToken = 'valid-refresh-token'
    mockStoreState.clearAuth.mockReset()
    mockStoreState.setAuth.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(globalThis, 'fetch')
  })

  it('keeps auth state on transient refresh failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: vi.fn(),
    } as Response) as typeof fetch

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(mockStoreState.clearAuth).not.toHaveBeenCalled()
    expect(mockStoreState.setAuth).not.toHaveBeenCalled()
  })

  it('keeps auth state when refresh request throws a network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('network error')) as typeof fetch

    const result = await refreshAccessToken()

    expect(result).toBeNull()
    expect(mockStoreState.clearAuth).not.toHaveBeenCalled()
    expect(mockStoreState.setAuth).not.toHaveBeenCalled()
  })
})
