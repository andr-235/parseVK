import { apiGet, apiPost } from './client'

export interface AuthUser {
  id: string
  username: string
  role: string
  isActive: boolean
  isSuperuser: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export function login(username: string, password: string) {
  return apiPost<AuthResponse>('/auth/login', { username, password })
}

export function logout() {
  return apiPost<{ status: string }>('/auth/logout')
}

export function fetchMe() {
  return apiGet<AuthUser>('/auth/me')
}

export function changePassword(oldPassword: string, newPassword: string) {
  return apiPost<AuthResponse>('/auth/change-password', { oldPassword, newPassword })
}
