import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
import type { AuthResponse } from '@/types/auth'

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await createRequest(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
        skipRefresh: true,
      })

      return await handleResponse<AuthResponse>(response, 'Failed to login')
    } catch (error) {
      toast.error('Неверные учетные данные')
      throw error
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await createRequest(`${API_URL}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword }),
      })

      return await handleResponse<AuthResponse>(response, 'Failed to change password')
    } catch (error) {
      toast.error('Не удалось сменить пароль')
      throw error
    }
  },
}
