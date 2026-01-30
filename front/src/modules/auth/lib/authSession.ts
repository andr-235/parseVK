import { API_URL } from '@/shared/api'
import { useAuthStore } from '@/store'
import type { AuthResponse } from '@/modules/auth/types'

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  const segments = token.split('.')
  if (segments.length < 2) {
    return null
  }

  const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')

  try {
    const decoded = atob(padded)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

export const isTokenExpired = (token: string, leewaySeconds = 30): boolean => {
  const payload = parseJwtPayload(token)
  const exp = typeof payload?.exp === 'number' ? payload.exp : null
  if (!exp) {
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  return exp <= now + leewaySeconds
}

let refreshPromise: Promise<string | null> | null = null

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      const { refreshToken, setAuth, clearAuth } = useAuthStore.getState()
      if (!refreshToken) {
        clearAuth()
        return null
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        clearAuth()
        return null
      }

      const data = (await response.json()) as AuthResponse
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      })
      return data.accessToken
    } catch {
      useAuthStore.getState().clearAuth()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}
