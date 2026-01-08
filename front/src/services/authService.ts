import toast from 'react-hot-toast'
import { API_URL } from '@/lib/apiConfig'
import { createRequest, handleResponse } from '@/lib/apiUtils'
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
}
