import { create } from 'zustand'
import type { AuthUser } from '../shared/api/auth'
import {
  login as apiLogin,
  logout as apiLogout,
  fetchMe,
  changePassword as apiChangePassword,
} from '../shared/api/auth'
import { setAccessToken } from '../shared/api/client'

interface AuthState {
  user: AuthUser | null
  isInitialized: boolean
  isLoggingIn: boolean

  init: () => Promise<void>
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  setUser: (user: AuthUser) => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  isLoggingIn: false,

  init: async () => {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
    if (token) {
      setAccessToken(token)
      try {
        const user = await fetchMe()
        set({ user, isInitialized: true })
        return
      } catch {
        sessionStorage.removeItem('accessToken')
        localStorage.removeItem('accessToken')
        setAccessToken(null)
      }
    }
    set({ isInitialized: true })
  },

  login: async (username, password, rememberMe = false) => {
    set({ isLoggingIn: true })
    try {
      const res = await apiLogin(username, password)
      setAccessToken(res.accessToken)
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem('accessToken', res.accessToken)
      set({ user: res.user })
    } finally {
      set({ isLoggingIn: false })
    }
  },

  logout: async () => {
    try {
      await apiLogout()
    } catch {
      // ignore
    }
    setAccessToken(null)
    sessionStorage.removeItem('accessToken')
    localStorage.removeItem('accessToken')
    set({ user: null })
  },

  changePassword: async (oldPassword, newPassword) => {
    const res = await apiChangePassword(oldPassword, newPassword)
    setAccessToken(res.accessToken)
    const storage = sessionStorage.getItem('accessToken') ? sessionStorage : localStorage
    storage.setItem('accessToken', res.accessToken)
    set({ user: res.user })
  },

  setUser: (user) => set({ user }),
}))
