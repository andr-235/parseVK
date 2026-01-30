import { useMemo } from 'react'
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
import { Clock, Activity, Calendar, Zap, Save } from 'lucide-react'
import { formatAutomationDate } from '@/modules/settings/utils/automationFormatting'
import { useAutomationSettings } from '@/modules/settings/hooks/useAutomationSettings'

export const AutomationCard = () => {
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
