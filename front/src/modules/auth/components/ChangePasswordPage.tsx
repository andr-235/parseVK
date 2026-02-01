import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { BrandLogo } from '@/shared/components/BrandLogo'
import { authService } from '@/modules/auth/api/auth.api'
import { useAuthSession } from '@/modules/auth/hooks/useAuthSession'

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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 py-8 font-monitoring-body">
      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-cyan-950" />
        <div
          className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/30 blur-[120px] animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute right-0 bottom-0 h-[600px] w-[600px] rounded-full bg-cyan-500/20 blur-[120px] animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-[100px] animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '4s' }}
        />
      </div>

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400/40 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glow Effect */}
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-50 blur-2xl" />

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-2xl">
          {/* Top Border Glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Header */}
          <div className="relative px-8 pt-10 pb-6 text-center">
            {/* Logo with Glow */}
            <div className="mb-6 inline-block animate-in fade-in-0 zoom-in-95 duration-700">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-xl" />
                <BrandLogo
                  size="lg"
                  className="relative drop-shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-transform duration-300 hover:scale-105"
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="mb-2 font-monitoring-display text-3xl font-bold tracking-tight text-white animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
              Смена <span className="text-cyan-400">пароля</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-slate-400 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
              Обновите пароль для повышения безопасности
            </p>

            {/* Decorative Line */}
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          </div>

          {/* Form Container */}
          <div className="px-8 pb-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label
                  htmlFor="old-password"
                  className="text-xs font-medium uppercase tracking-wider text-slate-300"
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-xs font-medium uppercase tracking-wider text-slate-300"
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                  required
                />
                <p className="text-xs text-slate-500 font-mono-accent">
                  Min 8 chars · A-Z · a-z · 0-9
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-xs font-medium uppercase tracking-wider text-slate-300"
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
                  className="h-11 border-white/10 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
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
                  className="group relative h-11 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
                  className="h-11 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  ← Назад
                </Button>
              </div>
            </form>
          </div>

          {/* Bottom Accent Line */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-1.5 text-xs text-slate-400 backdrop-blur-sm font-mono-accent">
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

export default ChangePasswordPage
