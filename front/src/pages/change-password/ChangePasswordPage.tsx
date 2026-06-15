import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PasswordInput } from '../../components/ui'
import { ApiError } from '../../shared/api/client'
import { useAuth } from '../../store/auth'

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401: return 'Старый пароль неправильный'
      case 422: return 'Новый пароль не соответствует требованиям'
      case 429: return 'Слишком много попыток. Попробуйте позже'
      default: return err.message || 'Ошибка при смене пароля'
    }
  }
  return 'Ошибка соединения с сервером'
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { changePassword } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  function getFieldError(field: string): string | null {
    if (!touched[field]) return null
    if (field === 'oldPassword' && !oldPassword) return 'Введите старый пароль'
    if (field === 'newPassword') {
      if (!newPassword) return 'Введите новый пароль'
      if (newPassword.length < 8) return 'Минимум 8 символов'
    }
    if (field === 'confirmPassword') {
      if (!confirmPassword) return 'Подтвердите новый пароль'
      if (confirmPassword !== newPassword) return 'Пароли не совпадают'
    }
    return null
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setTouched({ oldPassword: true, newPassword: true, confirmPassword: true })

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('Заполните все поля')
      return
    }
    if (newPassword.length < 8) {
      setError('Новый пароль должен быть не менее 8 символов')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают')
      return
    }

    setLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      setSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const oldPasswordError = getFieldError('oldPassword')
  const newPasswordError = getFieldError('newPassword')
  const confirmPasswordError = getFieldError('confirmPassword')

  return (
    <div className="flex h-screen items-center justify-center bg-bg-main">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-2xl font-semibold text-text-primary">Смена пароля</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-bg-panel p-6"
        >
        <div className="space-y-1.5">
          <label htmlFor="old-password" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Старый пароль</label>
          <PasswordInput
            id="old-password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            onBlur={() => handleBlur('oldPassword')}
            aria-invalid={!!oldPasswordError}
            aria-describedby={oldPasswordError ? 'old-password-error' : undefined}
            className="h-11 focus-visible:ring-0"
            autoFocus
          />
          {oldPasswordError && (
            <p id="old-password-error" className="text-xs text-danger" role="alert">{oldPasswordError}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Новый пароль</label>
          <PasswordInput
            id="new-password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onBlur={() => handleBlur('newPassword')}
            aria-invalid={!!newPasswordError}
            aria-describedby={newPasswordError ? 'new-password-error' : undefined}
            className="h-11 focus-visible:ring-0"
          />
          {newPasswordError ? (
            <p id="new-password-error" className="text-xs text-danger" role="alert">{newPasswordError}</p>
          ) : (
            <p className="text-xs text-text-muted">минимум 8 символов</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-xs font-medium uppercase tracking-wider text-text-secondary">Подтверждение</label>
          <PasswordInput
            id="confirm-password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            aria-invalid={!!confirmPasswordError}
            aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
            className="h-11 focus-visible:ring-0"
          />
          {confirmPasswordError && (
            <p id="confirm-password-error" className="text-xs text-danger" role="alert">{confirmPasswordError}</p>
          )}
        </div>
        {error && (
          <p className="text-xs text-danger" role="alert">{error}</p>
        )}
        {success && (
          <p className="rounded-md bg-success-soft p-3 text-xs text-success" role="status">Пароль успешно изменён</p>
        )}
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="min-h-[44px]"
            disabled={loading || success}
          >
            {loading ? 'Смена...' : 'Сменить пароль'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="min-h-[44px]"
            onClick={() => navigate('/')}
          >
            Назад
          </Button>
        </div>
      </form>
    </div>
    </div>
  )
}
