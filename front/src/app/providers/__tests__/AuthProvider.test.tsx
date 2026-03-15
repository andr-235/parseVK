import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { useAuthStore } from '@/modules/auth/store'

const {
  refreshAccessTokenMock,
  isTokenExpiredMock,
  getRefreshDelayMsMock,
} = vi.hoisted(() => ({
  refreshAccessTokenMock: vi.fn().mockResolvedValue('next-access-token'),
  isTokenExpiredMock: vi.fn(() => false),
  getRefreshDelayMsMock: vi.fn(() => 1_000),
}))

vi.mock('@/modules/auth', () => ({
  refreshAccessToken: refreshAccessTokenMock,
  isTokenExpired: isTokenExpiredMock,
  getRefreshDelayMs: getRefreshDelayMsMock,
}))

import { AuthProvider } from '../AuthProvider'

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      accessToken: 'valid-access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        username: 'admin',
        role: 'admin',
        isTemporaryPassword: false,
      },
    })
  })

  afterEach(() => {
    useAuthStore.getState().clearAuth()
  })

  it('schedules refresh before access token expires', async () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')

    await act(async () => {
      render(
        <AuthProvider>
          <div>app</div>
        </AuthProvider>,
      )

      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('app')).toBeInTheDocument()
    expect(getRefreshDelayMsMock).toHaveBeenCalledWith('valid-access-token')
    expect(setTimeoutSpy).toHaveBeenCalled()
    expect(setTimeoutSpy.mock.calls[0]?.[1]).toBe(1_000)
  })
})
