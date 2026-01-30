import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-border/60 bg-background-secondary/90 shadow-soft-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-text-primary">Смена пароля</CardTitle>
          <CardDescription>
            Для продолжения работы задайте новый пароль с заглавными и строчными буквами и цифрами.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="old-password">Текущий пароль</Label>
              <Input
                id="old-password"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                placeholder="Введите текущий пароль"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                Минимум 8 символов, минимум одна заглавная и одна строчная буква, а также цифра.
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
                disabled={isSubmitting}
                required
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Сохраняем...
                </>
              ) : (
                'Сменить пароль'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ChangePasswordPage
