import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Checkbox, Input, PasswordInput } from '../../components/ui'
import { ApiError } from '../../shared/api/client'
import { useAuth } from '../../store/auth'

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401: return 'Неверный логин или пароль'
      case 403: return 'Доступ запрещён'
      case 429: return 'Слишком много попыток. Попробуйте позже'
      default: return err.message || 'Произошла ошибка'
    }
  }
  return 'Ошибка соединения с сервером'
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggingIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function getFieldError(field: string): string | null {
    if (!touched[field]) return null
    if (field === 'username' && !username.trim()) return 'Введите логин'
    if (field === 'password' && !password) return 'Введите пароль'
    return null
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched({ username: true, password: true })
    if (!username.trim() || !password) {
      setError('Заполните все поля')
      return
    }
    setError(null)
    try {
      await login(username.trim(), password, rememberMe)
      navigate('/comments', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const usernameError = getFieldError('username')
  const passwordError = getFieldError('password')

  return (
    <div className="flex h-screen items-center justify-center bg-bg-main">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-center text-2xl font-semibold text-text-primary">ParseVK</h1>
        <div className="space-y-4 rounded-lg border border-border bg-bg-panel p-6">
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Логин</label>
            <Input
              id="login-username"
              type="text"
              placeholder="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur('username')}
              aria-invalid={!!usernameError}
              aria-describedby={usernameError ? 'login-username-error' : undefined}
              className="h-11 w-full focus-visible:ring-0"
              autoFocus
            />
            {usernameError && (
              <p id="login-username-error" className="text-xs text-danger" role="alert">{usernameError}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Пароль</label>
            <PasswordInput
              id="login-password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'login-password-error' : undefined}
              className="h-11 focus-visible:ring-0"
            />
            {passwordError && (
              <p id="login-password-error" className="text-xs text-danger" role="alert">{passwordError}</p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="text-sm text-text-primary">Запомнить меня</span>
          </label>
          {error && (
            <p className="text-xs text-danger" role="alert">{error}</p>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center min-h-[44px]"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Вход...' : 'Войти'}
          </Button>
        </div>
        <p className="text-center text-xs text-text-muted">
          Пароль можно восстановить через администратора
        </p>
      </form>
    </div>
  )
}
