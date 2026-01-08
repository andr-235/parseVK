import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BrandLogo } from '@/components/BrandLogo'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store'

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const authUser = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken && state.user))
  const mustChangePassword = Boolean(authUser?.isTemporaryPassword)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !mustChangePassword) {
      navigate('/tasks', { replace: true })
    }
  }, [isAuthenticated, mustChangePassword, navigate])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const data = await authService.login(username.trim(), password)
      setAuth(data)

      if (data.user.isTemporaryPassword) {
        setOldPassword(password)
        setPassword('')
        setUsername('')
        return
      }

      const redirectTo =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/tasks'
      navigate(redirectTo, { replace: true })
    } catch {
      setError('Неверный логин или пароль')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов')
      return
    }

    if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
      setError('Новый пароль должен содержать заглавные и строчные буквы, а также цифры')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setIsChanging(true)
    try {
      const data = await authService.changePassword(oldPassword, newPassword)
      setAuth(data)
      navigate('/tasks', { replace: true })
    } catch {
      setError('Не удалось сменить пароль. Проверьте текущий пароль.')
    } finally {
      setIsChanging(false)
    }
  }

  const handleLogout = () => {
    clearAuth()
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-primary px-4 py-10">
      <Card className="w-full max-w-md border-border/60 bg-background-secondary/90 shadow-soft-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-text-primary">
            {mustChangePassword ? 'Смена пароля' : 'Вход в систему'}
          </CardTitle>
          <CardDescription>
            {mustChangePassword
              ? `Пользователь ${authUser?.username ?? ''} должен сменить временный пароль.`
              : 'Используйте учетную запись администратора или пользователя, выданную администратором.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex justify-center">
            <BrandLogo size="lg" />
          </div>
          {mustChangePassword ? (
            <form className="space-y-5" onSubmit={handleChangePassword}>
              <div className="space-y-2">
                <Label htmlFor="old-password">Текущий пароль</Label>
                <Input
                  id="old-password"
                  type="password"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(event) => setOldPassword(event.target.value)}
                  placeholder="Введите текущий пароль"
                  disabled={isChanging}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Минимум 8 символов"
                  disabled={isChanging}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Минимум 8 символов, заглавные и строчные буквы, цифры.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Повторите пароль</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Повторите новый пароль"
                  disabled={isChanging}
                  required
                />
              </div>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="flex flex-col gap-2">
                <Button className="w-full" type="submit" disabled={isChanging}>
                  {isChanging ? (
                    <>
                      <Spinner className="size-4" />
                      Сохраняем...
                    </>
                  ) : (
                    'Сменить пароль'
                  )}
                </Button>
                <Button type="button" variant="ghost" onClick={handleLogout}>
                  Выйти
                </Button>
              </div>
            </form>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
