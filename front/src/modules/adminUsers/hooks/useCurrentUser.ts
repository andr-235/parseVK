import { useAuthStore } from '@/store'

export const useCurrentUser = () => useAuthStore((state) => state.user)
