import { useAuthStore } from '@/shared/auth/store/authStore'

export const useCurrentUser = () => useAuthStore((state) => state.user)
