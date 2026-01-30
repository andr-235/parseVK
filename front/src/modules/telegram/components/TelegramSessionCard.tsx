import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Copy, LogOut, RefreshCw, Shield, User } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { useTelegramSession } from '@/modules/telegram/hooks/useTelegramSession'

export default function TelegramSessionCard() {
  const {
    authStep,
    authCode,
    setAuthCode,
    authPassword,
    setAuthPassword,
    authLoading,
    authError,
    authHint,
    authResult,
    handleStartNewSession,
    handleResetAuth,
    handleConfirmAuth,
    handleCopySession,
  } = useTelegramSession()

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Сессия</CardTitle>
        </div>
        <CardDescription>Статус подключения к Telegram</CardDescription>
      </CardHeader>
      <CardContent>
        {authStep === 'code' && (
          <form onSubmit={handleConfirmAuth} className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Код подтверждения
              </label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Введите код"
                disabled={authLoading}
              />
              <p className="text-xs text-muted-foreground">{authHint}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Пароль (2FA)</label>
              <Input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Если установлен"
                disabled={authLoading}
              />
            </div>

            {authError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {authError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={authLoading} className="flex-1">
                {authLoading ? 'Проверка...' : 'Подтвердить'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAuth}
                disabled={authLoading}
              >
                Отмена
              </Button>
            </div>
          </form>
        )}

        {authStep === 'success' && authResult && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{authResult.username || 'Без имени'}</p>
                    <p className="text-xs text-muted-foreground">{authResult.phoneNumber}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20"
                >
                  Активно
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={handleCopySession}
              >
                <Copy className="mr-2 h-4 w-4" />
                Скопировать StringSession
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={handleStartNewSession}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Пересоздать сессию
              </Button>
            </div>
          </div>
        )}

        {authStep === 'success' && !authResult && (
          <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <LogOut className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Нет активной сессии</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                Создайте новую сессию для работы с Telegram API
              </p>
            </div>
            <Button onClick={handleStartNewSession} disabled={authLoading}>
              {authLoading ? 'Загрузка...' : 'Создать сессию'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
