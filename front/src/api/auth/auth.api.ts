import toast from 'react-hot-toast'
import { GATEWAY_API_URL } from '@/api/common'
import { createRequest, handleResponse } from '@/api/common'
import { buildCsrfHeaders } from '@/config/auth/lib/authSession'
import type { AuthResponse } from '@/types/auth'

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await createRequest(`${GATEWAY_API_URL}/v1/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
        skipRefresh: true,
        credentials: 'include',
      })

      return await handleResponse<AuthResponse>(response, 'Failed to login')
    } catch (error) {
      toast.error('Неверные учетные данные')
      throw error
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await createRequest(`${GATEWAY_API_URL}/v1/auth/change-password`, {
        method: 'POST',
        headers: buildCsrfHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
        credentials: 'include',
      })

      return await handleResponse<AuthResponse>(response, 'Failed to change password')
    } catch (error) {
      toast.error('Не удалось сменить пароль')
      throw error
    }
  },

  async logout(): Promise<void> {
    const response = await createRequest(`${GATEWAY_API_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: buildCsrfHeaders(),
      credentials: 'include',
      skipRefresh: true,
    })

    await handleResponse(response, 'Failed to logout')
  },
}
