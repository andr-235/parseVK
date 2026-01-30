import { useAuthStore } from '@/store'

export const useAuthSession = () => {
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.user))

  return {
    setAuth,
    clearAuth,
    user,
    isAuthenticated,
  }
}
