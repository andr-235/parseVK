import '@testing-library/jest-dom'
import { vi } from 'vitest'

Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        DEV: process.env.NODE_ENV !== 'production',
        VITE_API_URL: process.env.VITE_API_URL || '/api',
        VITE_API_WS_URL: process.env.VITE_API_WS_URL || undefined,
      },
    },
  },
  writable: true,
  configurable: true,
})

vi.mock('@/shared/api', () => ({
  API_URL: '/api',
}))

vi.mock('@/shared/api', async () => {
  const { QueryClient } = await import('@tanstack/react-query')
  return {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          gcTime: 1000 * 60 * 10,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          retry: 1,
        },
        mutations: {
          retry: 1,
        },
      },
    }),
    getQueryPersister: () => null,
  }
})
