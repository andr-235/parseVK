import toast from 'react-hot-toast'
import { API_URL } from '@/shared/api'
import { createRequest, handleResponse } from '@/shared/api'
import type { AdminUser, CreateUserPayload, TemporaryPasswordResponse } from '@/modules/auth'

export const adminUsersService = {
  async listUsers(): Promise<AdminUser[]> {
    const response = await createRequest(`${API_URL}/admin/users`)
    return handleResponse<AdminUser[]>(response, 'Failed to fetch users')
  },

  async createUser(payload: CreateUserPayload): Promise<AdminUser> {
    try {
      const response = await createRequest(`${API_URL}/admin/users`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const result = await handleResponse<AdminUser>(response, 'Failed to create user')
      toast.success('Пользователь добавлен')
      return result
    } catch (error) {
      toast.error('Не удалось добавить пользователя')
      throw error
    }
  },

  async deleteUser(userId: number): Promise<void> {
    try {
      const response = await createRequest(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      toast.success('Пользователь удалён')
    } catch (error) {
      toast.error('Не удалось удалить пользователя')
      throw error
    }
  },

  async setTemporaryPassword(userId: number): Promise<TemporaryPasswordResponse> {
    const response = await createRequest(
      `${API_URL}/admin/users/${userId}/set-temporary-password`,
      {
        method: 'POST',
      }
    )
    return handleResponse<TemporaryPasswordResponse>(response, 'Failed to set temporary password')
  },

  async resetPassword(userId: number): Promise<TemporaryPasswordResponse> {
    const response = await createRequest(`${API_URL}/admin/users/${userId}/reset-password`, {
      method: 'POST',
    })
    return handleResponse<TemporaryPasswordResponse>(response, 'Failed to reset password')
  },
}
