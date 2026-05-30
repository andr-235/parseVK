import toast from 'react-hot-toast'
import { apiClient, ApiError } from '@/shared/api'
import { buildCsrfHeaders } from '@/auth/config/lib/authSession'
import type { AuthResponse } from '@/auth/types'

async function handleAuthResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text().catch(() => null)
    throw new ApiError('Auth failed', response.status, body)
  }
  return response.json() as Promise<T>
}

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.raw('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })

      return handleAuthResponse<AuthResponse>(response)
    } catch (error) {
      toast.error('Неверные учетные данные')
      throw error
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.raw('/v1/auth/change-password', {
        method: 'POST',
        headers: buildCsrfHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: 'include',
      })

      return handleAuthResponse<AuthResponse>(response)
    } catch (error) {
      toast.error('Не удалось сменить пароль')
      throw error
    }
  },

  async logout(): Promise<void> {
    const response = await apiClient.raw('/v1/auth/logout', {
      method: 'POST',
      headers: buildCsrfHeaders(),
      credentials: 'include',
    })

    await handleAuthResponse(response)
  },
}
