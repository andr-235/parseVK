import { apiGet, apiPost, apiPatch, apiDelete } from './client'

export type AdminUser = {
  id: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  isTemporaryPassword: boolean
}

type BackendAdminUser = {
  id: string
  username: string
  role: string
  is_active: boolean
  created_at: string
  is_temporary_password: boolean
}

function mapUser(bu: BackendAdminUser): AdminUser {
  return {
    id: bu.id,
    username: bu.username,
    role: bu.role,
    isActive: bu.is_active,
    createdAt: bu.created_at,
    isTemporaryPassword: bu.is_temporary_password,
  }
}

export type CreateUserPayload = {
  username: string
  password: string
  role?: string
}

export type UpdateUserPayload = {
  isActive?: boolean
  role?: string
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const data = await apiGet<BackendAdminUser[]>('/admin/users')
  return data.map(mapUser)
}

export async function createAdminUser(data: CreateUserPayload): Promise<AdminUser> {
  const res = await apiPost<BackendAdminUser>('/admin/users', data)
  return mapUser(res)
}

export async function updateAdminUser(id: string, data: UpdateUserPayload): Promise<AdminUser> {
  const payload: Record<string, unknown> = {}
  if (data.isActive !== undefined) payload.is_active = data.isActive
  if (data.role !== undefined) payload.role = data.role
  const res = await apiPatch<BackendAdminUser>(`/admin/users/${id}`, payload)
  return mapUser(res)
}

export async function deleteAdminUser(id: string) {
  return apiDelete<{ status: string }>(`/admin/users/${id}`)
}

export async function setTemporaryPassword(id: string) {
  return apiPost<{ temporaryPassword: string }>(`/admin/users/${id}/set-temporary-password`)
}

export async function resetPassword(id: string) {
  return apiPost<{ status: string }>(`/admin/users/${id}/reset-password`)
}
