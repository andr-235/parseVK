import { useEffect, useState, type ReactNode } from 'react'
import { Spinner } from '@/shared/ui/spinner'
import { getRefreshDelayMs, isTokenExpired, refreshAccessToken } from '@/modules/auth'
import { useAuthStore } from '@/modules/auth/store'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      const { clearAuth } = useAuthStore.getState()
      const needsRefresh = !accessToken || isTokenExpired(accessToken)

      if (needsRefresh) {
        if (!refreshToken) {
          clearAuth()
        } else {
          const refreshedToken = await refreshAccessToken()
          if (!refreshedToken) {
            clearAuth()
          }
        }
      }

      if (isMounted) {
        setIsReady(true)
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [accessToken, refreshToken])

  useEffect(() => {
    if (!accessToken || !refreshToken) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void refreshAccessToken()
    }, getRefreshDelayMs(accessToken))

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [accessToken, refreshToken])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span>Проверяем сессию...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
