import { QueryClient } from '@tanstack/react-query'
import type { Persister } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const STORAGE_KEY = 'parsevk-query-cache'

const createStoragePersister = (): Persister | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const { localStorage } = window
    const testKey = `${STORAGE_KEY}__test`
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)

    return createSyncStoragePersister({
      storage: localStorage,
      key: STORAGE_KEY,
      throttleTime: 1000,
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[QueryClient] Не удалось инициализировать persister', error)
    }
    return null
  }
}

let cachedPersister: Persister | null | undefined

export const getQueryPersister = (): Persister | null => {
  if (cachedPersister !== undefined) {
    return cachedPersister
  }

  cachedPersister = createStoragePersister()
  return cachedPersister
}

export const queryClient = new QueryClient({
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
})
