import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.user))

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/tasks', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const data = await authService.login(username.trim(), password)
      setAuth(data)

      const redirectTo =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/tasks'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError('Неверный логин или пароль')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 py-10">
      <Card className="w-full max-w-md border-border/60 bg-background-secondary/90 shadow-soft-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-text-primary">Вход в систему</CardTitle>
          <CardDescription>
            Используйте учетную запись администратора или пользователя, выданную администратором.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Введите логин"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Введите пароль"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">Минимум 8 символов.</p>
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Входим...
                </>
              ) : (
                'Войти'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
