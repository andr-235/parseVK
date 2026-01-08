export type UserRole = 'admin' | 'user'

export interface AuthUser {
  id: number
  username: string
  role: UserRole
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface AdminUser extends AuthUser {
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  username: string
  password: string
  role?: UserRole
}
