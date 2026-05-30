import { useAuthStore } from '@/auth/store/authStore'

export const useCurrentUser = () => useAuthStore((state) => state.user)
