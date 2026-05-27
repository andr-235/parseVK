import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BrandLogo } from '@/components/common/BrandLogo'
import { authService } from '@/api/auth/auth.api'
import { useAuthSession } from '@/hooks/auth/useAuthSession'

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

// Static array constant for animated background particles to prevent GC churn on typing/re-renders
const DECORATIVE_PARTICLES = [...Array(20)].map((_, i) => ({
  id: i,
  left: `${(i * 7 + 13) % 100}%`,
  top: `${(i * 11 + 23) % 100}%`,
  delay: `${(i * 0.7).toFixed(1)}s`,
  duration: `${(15 + (i * 1.3) % 10).toFixed(1)}s`,
}))

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-8 font-monitoring-body">
      {/* Animated Mesh Gradient Background (A11y Hidden) */}
      <div className="absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-[#24130d] via-[#101012] to-[#1a110e]" />
        <div
          className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-orange-500/5 blur-[120px] animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
      </div>

      {/* Grid Overlay (A11y Hidden) */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating Particles (A11y Hidden) */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {DECORATIVE_PARTICLES.map((particle) => (
          <div
            key={particle.id}
            className="absolute h-1 w-1 rounded-full bg-primary/30 animate-float"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card using semantic border variables */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl backdrop-blur-2xl">
          {/* Top Border Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {/* Header */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            {/* Logo with Glow */}
            <div className="mb-6 inline-block animate-in fade-in-0 zoom-in-95 duration-700">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
                <BrandLogo
                  size="lg"
                  className="relative drop-shadow-[0_0_30px_rgba(242,100,61,0.2)] transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-2 font-monitoring-display text-3xl font-bold tracking-tight text-white animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
              {mustChangePassword ? (
                <>
                  Смена <span className="text-primary">пароля</span>
                </>
              ) : (
                <>
                  Центр <span className="text-primary">аналитики</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-zinc-400 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
              {mustChangePassword
                ? `Пользователь ${authUser?.username ?? ''} должен установить новый пароль`
                : 'Система аналитики и мониторинга VK'}
            </p>

            {/* Decorative Line */}
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {/* Form Container */}
          <div className="px-8 pb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
            {mustChangePassword || isManualChangePassword ? (
              <form className="space-y-5" onSubmit={handleChangePassword}>
                {isManualChangePassword && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-xs font-medium uppercase tracking-wider text-zinc-400"
                    >
                      Логин
                    </Label>
                    <div className="relative">
                      <Input
                        id="username"
                        autoComplete="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Введите логин"
                        disabled={isChanging}
                        className="h-11 border-border bg-background/50 text-zinc-100 placeholder:text-zinc-600 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                        required
                      />
                      <div className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-200 peer-focus:opacity-100" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="old-password"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-400"
                  >
                    Текущий пароль
                  </Label>
                  <Input
                    id="old-password"
                    type="password"
                    autoComplete="current-password"
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    placeholder="••••••••"
                    disabled={isChanging}
                    className="h-11 border-border bg-background/50 text-zinc-100 placeholder:text-zinc-600 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-password"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-400"
                  >
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
                    className="h-11 border-border bg-background/50 text-zinc-100 placeholder:text-zinc-600 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-zinc-500 font-mono-accent">
                    Min 8 chars · A-Z · a-z · 0-9
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-400"
                  >
                    Повторите пароль
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="••••••••"
                    disabled={isChanging}
                    className="h-11 border-border bg-background/50 text-zinc-100 placeholder:text-zinc-600 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    required
                  />
                </div>

                {error && (
                  <div className="animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <span className="font-mono-accent">⚠</span> {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    className="group relative h-11 overflow-hidden bg-gradient-to-r from-primary to-orange-600 font-semibold text-white shadow-lg shadow-primary/15 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isChanging}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isChanging ? (
                        <>
                          <Spinner className="size-4" />
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <svg
                            className="size-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Сменить пароль
                        </>
                      )}
                    </span>
                  </Button>

                  {mustChangePassword ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleLogout}
                      className="h-11 text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors"
                    >
                      Выйти из системы
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSwitchToLogin}
                      className="h-11 text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors"
                    >
                      ← Вернуться ко входу
                    </Button>
                  )}
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-400"
                  >
                    Логин
                  </Label>
                  <div className="relative group">
                    <Input
                      id="username"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Введите логин"
                      disabled={isSubmitting}
                      className="h-11 border-border bg-background/50 text-zinc-100 placeholder:text-zinc-600 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-medium uppercase tracking-wider text-zinc-400"
                  >
                    Пароль
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    className="h-11 border-border bg-background/50 text-zinc-100 placeholder:text-zinc-600 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-zinc-500 font-mono-accent">Минимум 8 символов</p>
                </div>

                {error && (
                  <div className="animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <span className="font-mono-accent">⚠</span> {error}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    className="group relative h-11 overflow-hidden bg-gradient-to-r from-primary to-orange-600 font-semibold text-white shadow-lg shadow-primary/15 transition-all duration-300 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-orange-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Spinner className="size-4" />
                          Вход в систему...
                        </>
                      ) : (
                        <>
                          <svg
                            className="size-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                          Войти
                        </>
                      )}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSwitchToChangePassword}
                    className="h-11 text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors"
                  >
                    Сменить пароль
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Bottom Accent Line */}
          <div className="h-1 bg-gradient-to-r from-primary via-orange-500 to-primary" />
        </div>

        {/* Version Badge using unified border variables */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs text-zinc-400 backdrop-blur-sm font-mono-accent">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            System Online
          </span>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          50% {
            transform: translateY(-100vh) translateX(50px);
          }
        }
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  )
}

export default LoginPage

