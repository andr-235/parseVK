import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Spinner } from '@/shared/components/ui/spinner'
import {
  getRefreshDelayMs,
  isTokenExpired,
  refreshAccessToken,
} from '@/auth/config/lib/authSession'
import { useAuthStore } from '@/auth/store'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [isReady, setIsReady] = useState(false)
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    let isMounted = true

    if (hasBootstrapped.current && !accessToken) {
      setIsReady(true)
      return
    }

    const bootstrap = async () => {
      const { clearAuth } = useAuthStore.getState()
      const needsRefresh = !accessToken || isTokenExpired(accessToken)

      if (needsRefresh) {
        const refreshedToken = await refreshAccessToken()
        if (!refreshedToken) {
          clearAuth()
        }
      }

      if (isMounted) {
        hasBootstrapped.current = true
        setIsReady(true)
      }
    }

    bootstrap()

    return () => {
      isMounted = false
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void refreshAccessToken()
    }, getRefreshDelayMs(accessToken))

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [accessToken])

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
