import { useAuthStore } from '@/modules/auth'

export const useCurrentUser = () => useAuthStore((state) => state.user)
