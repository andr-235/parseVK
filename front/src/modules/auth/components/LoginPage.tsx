import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { BrandLogo } from '@/shared/components/BrandLogo'
import { authService } from '@/modules/auth/api/auth.api'
import { useAuthSession } from '@/modules/auth/hooks/useAuthSession'

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, clearAuth, user: authUser, isAuthenticated } = useAuthSession()
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background-primary px-4 py-8">
      {/* Background gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(37,99,235,0.14),transparent_60%),radial-gradient(120%_80%_at_100%_100%,rgba(14,165,233,0.08),transparent_55%)]"
      />

      {/* Gradient border wrapper */}
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-br from-accent-primary/40 via-accent-primary/20 to-transparent opacity-75 blur-sm" />

        <Card className="relative overflow-hidden border-border/40 bg-background-primary/95 backdrop-blur-xl shadow-2xl">
          {/* Inner glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-transparent to-transparent"
          />

          <CardHeader className="relative z-10 items-center space-y-3 pb-4 pt-8 text-center">
            <div className="animate-in fade-in-0 zoom-in-95 duration-500">
              <BrandLogo
                size="lg"
                className="drop-shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
              <CardTitle className="text-2xl font-semibold tracking-tight text-text-primary">
                {mustChangePassword ? 'Смена пароля' : 'Вход в систему'}
              </CardTitle>
            </div>
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
              <CardDescription className="max-w-sm text-sm text-text-secondary/90">
                {mustChangePassword
                  ? `Пользователь ${authUser?.username ?? ''} должен сменить временный пароль.`
                  : 'Используйте учетную запись администратора или пользователя, выданную администратором.'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 px-6 pb-6 pt-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
            {mustChangePassword || isManualChangePassword ? (
              <form className="space-y-4" onSubmit={handleChangePassword}>
                {isManualChangePassword && (
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Логин
                    </Label>
                    <Input
                      id="username"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Введите логин"
                      disabled={isChanging}
                      className="transition-all duration-200 focus:scale-[1.01]"
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="old-password" className="text-sm font-medium">
                    Текущий пароль
                  </Label>
                  <Input
                    id="old-password"
                    type="password"
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    placeholder="Введите текущий пароль"
                    disabled={isChanging}
                    className="transition-all duration-200 focus:scale-[1.01]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    Новый пароль
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Минимум 8 символов"
                    disabled={isChanging}
                    className="transition-all duration-200 focus:scale-[1.01]"
                    required
                  />
                  <p className="text-xs text-muted-foreground/80">
                    Минимум 8 символов, заглавные и строчные буквы, цифры.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Повторите пароль
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Повторите новый пароль"
                    disabled={isChanging}
                    className="transition-all duration-200 focus:scale-[1.01]"
                    required
                  />
                </div>
                {error && (
                  <div className="animate-in slide-in-from-top-2 fade-in-0 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <CardFooter className="flex flex-col gap-2.5 px-0 pt-2">
                  <Button
                    className="w-full shadow-lg shadow-accent-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-accent-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                    type="submit"
                    disabled={isChanging}
                  >
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
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full transition-colors"
                    >
                      Выйти
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSwitchToLogin}
                      className="w-full transition-colors"
                    >
                      Вернуться ко входу
                    </Button>
                  )}
                </CardFooter>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Логин
                  </Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Введите логин"
                    disabled={isSubmitting}
                    className="transition-all duration-200 focus:scale-[1.01]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Пароль
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Введите пароль"
                    disabled={isSubmitting}
                    className="transition-all duration-200 focus:scale-[1.01]"
                    required
                  />
                  <p className="text-xs text-muted-foreground/80">Минимум 8 символов.</p>
                </div>
                {error && (
                  <div className="animate-in slide-in-from-top-2 fade-in-0 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <CardFooter className="flex flex-col gap-2.5 px-0 pt-2">
                  <Button
                    className="w-full shadow-lg shadow-accent-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-accent-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="size-4" />
                        Входим...
                      </>
                    ) : (
                      'Войти'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSwitchToChangePassword}
                    className="w-full transition-colors"
                  >
                    Сменить пароль
                  </Button>
                </CardFooter>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
