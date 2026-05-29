import { useMemo } from 'react'
import { PageHeader } from '@/shared/components/common'
import {
  Play,
  Settings as SettingsIcon,
  Send,
  Zap,
  Clock,
  Activity,
  Calendar,
  Save,
  Smartphone,
  Key,
  Hash,
  Info,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { cn } from '@/shared/utils'
import { useAutomationSettings } from '@/pages/settings/hooks/useAutomationSettings'
import { useTelegramSettings } from '@/pages/settings/hooks/useTelegramSettings'
import { formatAutomationDate } from '@/pages/settings/utils/automationFormatting'

function AutomationCard() {
  const {
    settings,
    formState,
    isFormDisabled,
    isUpdating,
    handleToggle,
    handleTimeChange,
    handlePostLimitChange,
    handleSubmit,
  } = useAutomationSettings()

  const nextRun = useMemo(() => {
    if (!settings?.nextRunAt) {
      return '—'
    }
    return formatAutomationDate(settings.nextRunAt)
  }, [settings?.nextRunAt])

  const lastRun = useMemo(() => {
    if (!settings?.lastRunAt) {
      return '—'
    }
    return formatAutomationDate(settings.lastRunAt)
  }, [settings?.lastRunAt])

  return (
    <Card className="flex h-full flex-col border-border/50 bg-background-secondary/40 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent-primary/10 p-2 text-accent-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Расписание парсинга</CardTitle>
            <CardDescription>Настройка ежедневных задач</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <form id="automation-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Автоматический запуск</Label>
                <p className="text-sm text-muted-foreground">
                  Создавать задачи на парсинг всех групп каждый день
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formState.enabled}
                  onChange={handleToggle}
                  className="h-5 w-5 rounded border-border bg-background text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                  disabled={isFormDisabled}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="automation-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Время запуска
              </Label>
              <Input
                id="automation-time"
                type="time"
                value={formState.time}
                onChange={handleTimeChange}
                disabled={isFormDisabled}
                className="bg-background/50"
                required
              />
              <p className="text-xs text-muted-foreground">Время сервера</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="automation-post-limit" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Лимит постов
              </Label>
              <Input
                id="automation-post-limit"
                type="number"
                min={1}
                max={100}
                value={formState.postLimit}
                onChange={handlePostLimitChange}
                disabled={isFormDisabled}
                className="bg-background/50"
                required
              />
              <p className="text-xs text-muted-foreground">Постов на группу</p>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t border-border/50 bg-background/30 pt-4">
        <div className="grid w-full grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col gap-1 rounded-md border border-border/50 bg-background/50 p-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> Следующий запуск
            </span>
            <span className="font-medium">{nextRun}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-border/50 bg-background/50 p-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" /> Последний запуск
            </span>
            <span className="font-medium">{lastRun}</span>
          </div>
        </div>
        <Button type="submit" form="automation-form" className="w-full" disabled={isFormDisabled}>
          {isUpdating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Сохраняем...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить расписание
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function TelegramCard() {
  const {
    formState,
    isLoading,
    isSaving,
    handlePhoneChange,
    handleApiIdChange,
    handleApiHashChange,
    handleSubmit,
  } = useTelegramSettings()

  const isDisabled = isLoading || isSaving

  return (
    <Card className="flex h-full flex-col border-border/50 bg-background-secondary/40 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Telegram API</CardTitle>
            <CardDescription>Настройки подключения</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <div className="flex items-start gap-3 rounded-md bg-orange-500/10 p-4 text-sm text-orange-600 dark:text-orange-400">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p>Для работы интеграции требуются API credentials.</p>
            <p className="text-xs opacity-80">
              Их можно получить на{' '}
              <a
                href="https://my.telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:opacity-100"
              >
                my.telegram.org
              </a>
            </p>
          </div>
        </div>

        <form id="telegram-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="telegram-phone" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              Номер телефона
            </Label>
            <Input
              id="telegram-phone"
              type="tel"
              value={formState.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+79998887766"
              disabled={isDisabled}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-api-id" className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              API ID
            </Label>
            <Input
              id="telegram-api-id"
              type="number"
              value={formState.apiId}
              onChange={handleApiIdChange}
              placeholder="12345678"
              disabled={isDisabled}
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-api-hash" className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              API Hash
            </Label>
            <Input
              id="telegram-api-hash"
              value={formState.apiHash}
              onChange={handleApiHashChange}
              placeholder="abcdef1234567890..."
              disabled={isDisabled}
              className="bg-background/50 font-mono text-xs"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="mt-auto border-t border-border/50 bg-background/30 pt-4">
        <Button
          type="submit"
          form="telegram-form"
          className="w-full"
          disabled={isDisabled}
          variant="secondary"
        >
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Сохраняем...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить настройки
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

function SettingsPage() {
  const { settings, isTriggering, handleRunNow } = useAutomationSettings()
  const automationEnabled = settings?.enabled ?? false

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="grid"
          colsClass="grid-cols-1 gap-4 sm:grid-cols-3"
          title="Настройки системы"
          description="Управление расписанием автоматического парсинга, интеграциями с внешними сервисами и уведомлениями."
          actions={
            <Button
              onClick={handleRunNow}
              size="lg"
              className={cn(
                'group relative h-11 shrink-0 overflow-hidden font-semibold text-text-light shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
                automationEnabled
                  ? 'bg-accent-primary shadow-accent-primary/25 hover:shadow-accent-primary/40'
                  : 'bg-background-secondary border border-border/60 text-text-secondary shadow-soft-sm'
              )}
              disabled={!settings || isTriggering || settings?.isRunning}
            >
              {automationEnabled && (
                <div className="absolute inset-0 bg-accent-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              )}
              {isTriggering || settings?.isRunning ? (
                <>
                  <span className="relative w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  <span className="relative">Запуск...</span>
                </>
              ) : (
                <>
                  <Play className="relative w-5 h-5 mr-2 fill-current" />
                  <span className="relative">Запустить сейчас</span>
                </>
              )}
            </Button>
          }
          cards={[
            {
              icon: Zap,
              title: 'Автоматизация',
              subtitle: 'Расписание парсинга',
              iconBgClass: 'bg-accent-info/10',
              iconTextClass: 'text-accent-info',
              customContent: (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-monitoring-display text-sm font-semibold text-text-primary">
                      Автоматизация
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        'uppercase text-[10px] tracking-wider font-semibold rounded-full font-mono-accent',
                        automationEnabled
                          ? 'border border-accent-success/25 bg-accent-success/10 text-accent-success'
                          : 'border border-border/60 bg-background-primary/50 text-text-secondary'
                      )}
                    >
                      {automationEnabled ? 'Вкл' : 'Выкл'}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-secondary">Расписание парсинга</p>
                </div>
              ),
            },
            {
              icon: Send,
              title: 'Telegram',
              subtitle: 'Интеграция и уведомления',
              iconBgClass: 'bg-accent-primary/10',
              iconTextClass: 'text-accent-primary',
            },
            {
              icon: SettingsIcon,
              title: 'Конфигурация',
              subtitle: 'Общие параметры',
              iconBgClass: 'bg-accent-primary/10',
              iconTextClass: 'text-accent-primary',
            },
          ]}
        />
      </div>

      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Конфигурация модулей
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <AutomationCard />
          <TelegramCard />
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
