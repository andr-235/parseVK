import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { useAuthStore } from '@/modules/auth/store'

const { refreshAccessTokenMock, isTokenExpiredMock, getRefreshDelayMsMock } = vi.hoisted(() => ({
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
    cleanup()

    act(() => {
      useAuthStore.getState().clearAuth()
    })
  })

  it('schedules refresh before access token expires', async () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AuthProvider>
        <div>app</div>
      </AuthProvider>
    )

    expect(await screen.findByText('app')).toBeInTheDocument()
    await waitFor(() => {
      expect(getRefreshDelayMsMock).toHaveBeenCalledWith('valid-access-token')
      expect(setTimeoutSpy).toHaveBeenCalled()
    })
    expect(setTimeoutSpy.mock.calls[0]?.[1]).toBe(1_000)
  })

  it('clears auth state when bootstrap refresh fails for an expired token', async () => {
    isTokenExpiredMock.mockReturnValue(true)
    refreshAccessTokenMock.mockResolvedValue(null)

    render(
      <AuthProvider>
        <div>app</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1)
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(useAuthStore.getState().refreshToken).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()
    })
    await waitFor(() => {
      expect(screen.getByText('app')).toBeInTheDocument()
    })
  })
})
