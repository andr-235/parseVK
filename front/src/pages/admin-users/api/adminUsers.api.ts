import toast from 'react-hot-toast'
import { apiClient } from '@/shared/api'
import type { AdminUser, CreateUserPayload, TemporaryPasswordResponse } from '@/auth/types'

export const adminUsersService = {
  async listUsers(): Promise<AdminUser[]> {
    return apiClient.get<AdminUser[]>('/admin/users')
  },

  async createUser(payload: CreateUserPayload): Promise<AdminUser> {
    try {
      const result = await apiClient.post<AdminUser>('/admin/users', payload)
      toast.success('Пользователь добавлен')
      return result
    } catch (error) {
      toast.error('Не удалось добавить пользователя')
      throw error
    }
  },

  async deleteUser(userId: number): Promise<void> {
    try {
      await apiClient.delete<unknown>(`/admin/users/${userId}`)
      toast.success('Пользователь удалён')
    } catch (error) {
      toast.error('Не удалось удалить пользователя')
      throw error
    }
  },

  async setTemporaryPassword(userId: number): Promise<TemporaryPasswordResponse> {
    return apiClient.post<TemporaryPasswordResponse>(`/admin/users/${userId}/set-temporary-password`)
  },

  async resetPassword(userId: number): Promise<TemporaryPasswordResponse> {
    return apiClient.post<TemporaryPasswordResponse>(`/admin/users/${userId}/reset-password`)
  },
}
