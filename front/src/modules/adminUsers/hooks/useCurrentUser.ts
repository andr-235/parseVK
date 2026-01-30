import { useAuthStore } from '@/modules/auth/store'

export const useCurrentUser = () => useAuthStore((state) => state.user)
