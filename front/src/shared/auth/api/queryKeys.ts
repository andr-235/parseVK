import { queryKeys } from '@/shared/api'

export const authQueryKeys = {
  all: queryKeys.auth,
  currentUser: queryKeys.currentUser,
} as const
