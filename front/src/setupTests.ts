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

vi.mock('@/shared/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/api')>()
  const { QueryClient } = await import('@tanstack/react-query')

  return {
    ...actual,
    API_URL: '/api',
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

const originalConsoleError = console.error

vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const [firstArg] = args
  const message = typeof firstArg === 'string' ? firstArg : ''

  if (message.includes('not wrapped in act(...)')) {
    return
  }

  originalConsoleError(...args)
})
