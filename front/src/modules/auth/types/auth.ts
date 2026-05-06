export type UserRole = 'admin' | 'user'

export interface AuthUser {
  id: string
  username: string
  role: UserRole
  isActive: boolean
  isSuperuser: boolean
  isTemporaryPassword?: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface AdminUser {
  id: number
  username: string
  role: UserRole
  isTemporaryPassword?: boolean
  createdAt: string
  updatedAt: string
}

export interface TemporaryPasswordResponse {
  temporaryPassword: string
}

export interface CreateUserPayload {
  username: string
  password: string
  role?: UserRole
}
