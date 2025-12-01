import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'

import { getQueryPersister, queryClient } from '@/lib/queryClient'

const PERSIST_MAX_AGE = 1000 * 60 * 60 * 6 // 6 часов

function QueryProvider({ children }: PropsWithChildren) {
  const persister = useMemo(() => getQueryPersister(), [])

  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: PERSIST_MAX_AGE,
        }}
      >
        {children}
      </PersistQueryClientProvider>
    )
  }

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

export default QueryProvider

