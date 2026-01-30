import { useEffect, useState, type ReactNode } from 'react'
import { Spinner } from '@/shared/ui/spinner'
import { isTokenExpired, refreshAccessToken } from '@/modules/auth'
import { useAuthStore } from '@/store'

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
      if (refreshToken && (!accessToken || isTokenExpired(accessToken))) {
        await refreshAccessToken()
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
