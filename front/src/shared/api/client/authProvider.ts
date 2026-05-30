import { refreshAccessToken } from '@/shared/auth/config/lib/authSession'
import { useAuthStore } from '@/shared/auth/store/authStore'

export interface AuthProvider {
  getAccessToken: () => string | null
  refreshAccessToken: () => Promise<string | null>
}

export const defaultAuthProvider: AuthProvider = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshAccessToken: async () => {
    try {
      const result = await refreshAccessToken()
      return result
    } catch {
      return null
    }
  },
}
