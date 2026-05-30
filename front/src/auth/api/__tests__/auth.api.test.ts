import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createRequestMock, buildCsrfHeadersMock } = vi.hoisted(() => ({
  createRequestMock: vi.fn(),
  buildCsrfHeadersMock: vi.fn(() => ({ 'X-CSRF-Token': 'csrf-token' })),
}))

vi.mock('@/shared/api', () => ({
  GATEWAY_API_URL: '/api',
  apiClient: {
    raw: (url: string, options?: RequestInit) => createRequestMock('/api' + url, options),
  },
}))

vi.mock('@/auth/config/lib/authSession', () => ({
  buildCsrfHeaders: buildCsrfHeadersMock,
}))

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}))

import { authService } from '../auth.api'

describe('authService gateway contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createRequestMock.mockResolvedValue(
      new Response(JSON.stringify({
        accessToken: 'access-token',
        user: {
          id: 'user-1',
          username: 'admin',
          role: 'admin',
          isActive: true,
          isSuperuser: true,
        },
      }), { status: 200 })
    )
  })

  it('logs in through gateway with cookie credentials and no refresh token body contract', async () => {
    const result = await authService.login('admin', 'password')

    expect(result).not.toHaveProperty('refreshToken')
    expect(createRequestMock).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'password' }),
        credentials: 'include',
      })
    )
  })

  it('sends csrf header and cookie credentials for password changes', async () => {
    await authService.changePassword('old-password', 'NewPassword1')

    expect(createRequestMock).toHaveBeenCalledWith(
      '/api/v1/auth/change-password',
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-CSRF-Token': 'csrf-token' },
        body: JSON.stringify({ oldPassword: 'old-password', newPassword: 'NewPassword1' }),
        credentials: 'include',
      })
    )
  })
})
