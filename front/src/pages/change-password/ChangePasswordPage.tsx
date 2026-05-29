import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Spinner } from '@/shared/components/ui/spinner'
import { BrandLogo } from '@/shared/components/common/BrandLogo'
import { authService } from '@/shared/auth/api/auth.api'
import { useAuthSession } from '@/shared/auth/hooks/useAuthSession'

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/

function ChangePasswordPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthSession()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = (): boolean => {
    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов')
      return false
    }

    if (!PASSWORD_COMPLEXITY_REGEX.test(newPassword)) {
      setError('Новый пароль должен содержать заглавные и строчные буквы, а также цифры')
      return false
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      return false
    }

    return true
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    try {
      const data = await authService.changePassword(oldPassword, newPassword)
      setAuth(data)
      navigate('/tasks', { replace: true })
    } catch {
      setError('Не удалось сменить пароль. Проверьте текущий пароль.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background-primary px-4 py-8 font-monitoring-body">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-br from-background-secondary via-background-primary to-background-secondary" />
        <div
          className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-accent-primary/10 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-accent-primary/5 blur-[120px] animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
      </div>

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />



      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="relative overflow-hidden rounded-card border border-border bg-background-secondary/90 shadow-soft-lg">
          {/* Top Border Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />

          {/* Header */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            {/* Logo with Glow */}
            <div className="mb-6 inline-block animate-in fade-in-0 zoom-in-95 duration-200">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-accent-primary/10 blur-xl" />
                <BrandLogo
                  size="lg"
                  className="relative drop-shadow-[0_0_30px_rgba(242,100,61,0.2)] transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-2 font-monitoring-display text-3xl font-bold tracking-tight text-text-light animate-in fade-in-0 slide-in-from-bottom-4 duration-200 delay-100">
              Смена <span className="text-accent-primary">пароля</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-text-secondary animate-in fade-in-0 slide-in-from-bottom-4 duration-200 delay-200">
              Обновите пароль для повышения безопасности
            </p>

            {/* Decorative Line */}
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
          </div>

          {/* Form Container */}
          <div className="px-8 pb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-200 delay-300">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label
                  htmlFor="old-password"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
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
                  disabled={isSubmitting}
                  className="h-11 border-border bg-background-primary/50 text-text-light placeholder:text-text-secondary/60 focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
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
                  disabled={isSubmitting}
                  className="h-11 border-border bg-background-primary/50 text-text-light placeholder:text-text-secondary/60 focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                  required
                />
                <p className="text-xs text-text-secondary font-mono-accent">
                  Min 8 chars · A-Z · a-z · 0-9
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-xs font-semibold uppercase tracking-wider text-text-secondary"
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
                  disabled={isSubmitting}
                  className="h-11 border-border bg-background-primary/50 text-text-light placeholder:text-text-secondary/60 focus:border-accent-primary/50 focus:ring-accent-primary/20 transition-all duration-200"
                  required
                />
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="animate-in slide-in-from-top-2 fade-in-0 rounded-lg border border-accent-danger/20 bg-accent-danger/10 px-4 py-3 text-sm text-accent-danger"
                >
                  <span className="font-mono-accent" aria-hidden="true">⚠</span> {error}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  className="group relative h-11 overflow-hidden bg-accent-primary font-semibold text-text-light shadow-soft-sm transition-all duration-300 hover:bg-accent-primary/90 hover:shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isSubmitting}
                >

                  <span className="relative flex items-center justify-center gap-2">
                    {isSubmitting ? (
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
                          aria-hidden="true"
                          focusable="false"
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

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  className="h-11 text-text-secondary hover:text-text-light hover:bg-background-sidebar-hover/40 transition-colors"
                >
                  ← Назад
                </Button>
              </div>
            </form>
          </div>

          {/* Bottom Accent Line */}
          <div className="h-1 bg-gradient-to-r from-accent-primary via-orange-500 to-accent-primary" />
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background-secondary/50 px-4 py-1.5 text-xs text-text-secondary font-mono-accent">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Secure Connection
          </span>
        </div>
      </div>


    </div>
  )
}

export default ChangePasswordPage
