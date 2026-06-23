import { apiDelete, apiGet, apiPatch, apiPost } from './client'

export type UserRole = 'admin' | 'user'
export type UserSortKey = 'username' | 'role' | 'isActive' | 'isTemporaryPassword' | 'createdAt'
export type SortDirection = 'asc' | 'desc'

export type AdminUser = {
  id: string
  username: string
  role: UserRole
  isActive: boolean
  createdAt: string
  isTemporaryPassword: boolean
}

type BackendAdminUser = {
  id: string
  username: string
  role: UserRole
  is_active: boolean
  created_at: string
  is_temporary_password: boolean
}

type BackendUserPage = {
  items: BackendAdminUser[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type AdminUsersQuery = {
  page: number
  pageSize: number
  search?: string
  role?: UserRole
  isActive?: boolean
  isTemporaryPassword?: boolean
  sortBy: UserSortKey
  sortDir: SortDirection
}

export type AdminUsersPage = Omit<BackendUserPage, 'items'> & { items: AdminUser[] }
export type CreateUserPayload = { username: string; password: string; role: UserRole }
export type UpdateUserPayload = { isActive?: boolean; role?: UserRole }
export type TemporaryPasswordResponse = { temporaryPassword: string }

function mapUser(user: BackendAdminUser): AdminUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    isTemporaryPassword: user.is_temporary_password,
  }
}

export async function fetchAdminUsers(query: AdminUsersQuery): Promise<AdminUsersPage> {
  const data = await apiGet<BackendUserPage>('/admin/users', query)
  return { ...data, items: data.items.map(mapUser) }
}

export async function createAdminUser(data: CreateUserPayload): Promise<AdminUser> {
  return mapUser(await apiPost<BackendAdminUser>('/admin/users', data))
}

export async function updateAdminUser(id: string, data: UpdateUserPayload): Promise<AdminUser> {
  const payload: Record<string, unknown> = {}
  if (data.isActive !== undefined) payload.is_active = data.isActive
  if (data.role !== undefined) payload.role = data.role
  return mapUser(await apiPatch<BackendAdminUser>(`/admin/users/${id}`, payload))
}

export function deleteAdminUser(id: string): Promise<void> {
  return apiDelete<void>(`/admin/users/${id}`)
}

export function setTemporaryPassword(id: string): Promise<TemporaryPasswordResponse> {
  return apiPost<TemporaryPasswordResponse>(`/admin/users/${id}/set-temporary-password`)
}

export function resetPassword(id: string): Promise<TemporaryPasswordResponse> {
  return apiPost<TemporaryPasswordResponse>(`/admin/users/${id}/reset-password`)
}
