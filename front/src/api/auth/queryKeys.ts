import { queryKeys } from '@/api/common'

export const authQueryKeys = {
  all: queryKeys.auth,
  currentUser: queryKeys.currentUser,
} as const
