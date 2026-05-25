import { useAuthStore } from '@/store/auth/authStore';

export const useCurrentUser = () => useAuthStore((state) => state.user)
