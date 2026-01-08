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
  const [isManualChangeMode, setIsManualChangeMode] = useState(false)
  const isManualChangePassword = isManualChangeMode && !mustChangePassword

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !mustChangePassword && !isManualChangePassword) {
      navigate('/tasks', { replace: true })
    }
  }, [isAuthenticated, isManualChangePassword, mustChangePassword, navigate])

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

    if (isManualChangePassword && !username.trim()) {
      setError('Введите логин')
      return
    }

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
      if (isManualChangePassword) {
        try {
          const loginData = await authService.login(username.trim(), oldPassword)
          setAuth(loginData)
        } catch {
          setError('Неверный логин или текущий пароль')
          return
        }
      }

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

  const handleSwitchToChangePassword = () => {
    setIsManualChangeMode(true)
    setError(null)
    if (!oldPassword && password) {
      setOldPassword(password)
    }
  }

  const handleSwitchToLogin = () => {
    setIsManualChangeMode(false)
    setError(null)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background-primary px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(37,99,235,0.18),transparent_60%),radial-gradient(120%_80%_at_100%_100%,rgba(14,165,233,0.12),transparent_55%)]"
      />
      <Card className="relative w-full max-w-xl overflow-hidden border-border/60 bg-background-secondary/90 shadow-soft-lg backdrop-blur">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-transparent"
        />
        <CardHeader className="relative z-10 items-center space-y-4 text-center">
          <BrandLogo size="xl" className="drop-shadow-[0_22px_60px_rgba(37,99,235,0.25)]" />
          <CardTitle className="text-3xl font-semibold text-text-primary">
            {mustChangePassword ? 'Смена пароля' : 'Вход в систему'}
          </CardTitle>
          <CardDescription className="text-base text-text-secondary">
            {mustChangePassword
              ? `Пользователь ${authUser?.username ?? ''} должен сменить временный пароль.`
              : 'Используйте учетную запись администратора или пользователя, выданную администратором.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {mustChangePassword || isManualChangePassword ? (
            <form className="space-y-5" onSubmit={handleChangePassword}>
              {isManualChangePassword && (
                <div className="space-y-2">
                  <Label htmlFor="username">Логин</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Введите логин"
                    disabled={isChanging}
                    required
                  />
                </div>
              )}
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
                {mustChangePassword ? (
                  <Button type="button" variant="ghost" onClick={handleLogout}>
                    Выйти
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={handleSwitchToLogin}>
                    Вернуться ко входу
                  </Button>
                )}
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
              <div className="flex flex-col gap-2">
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
                <Button type="button" variant="ghost" onClick={handleSwitchToChangePassword}>
                  Сменить пароль
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
