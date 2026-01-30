import { Plus, Play, Settings, Calendar, Clock } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { cn } from '@/lib/utils'

interface TasksHeroAutomationInfo {
  enabled: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  isRunning: boolean
}

interface TasksHeroProps {
  onCreateTask: () => void
  isCreating: boolean
  areGroupsLoading: boolean
  hasGroups: boolean
  formattedLastUpdated: string
  automation: TasksHeroAutomationInfo | null
  onAutomationRun: () => void
  onOpenAutomationSettings: () => void
  isAutomationLoading: boolean
  isAutomationTriggering: boolean
}

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

function TasksHero({
  onCreateTask,
  isCreating,
  areGroupsLoading,
  hasGroups,
  automation,
  onAutomationRun,
  onOpenAutomationSettings,
  isAutomationLoading,
  isAutomationTriggering,
}: TasksHeroProps) {
  const automationEnabled = automation?.enabled ?? false
  const nextRunText = automationEnabled ? formatDateTime(automation?.nextRunAt ?? null) : '—'
  const lastRunText = formatDateTime(automation?.lastRunAt ?? null)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Задачи парсинга</h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Управляйте сбором данных из ВКонтакте. Создавайте новые задачи или настройте
            автоматический парсинг по расписанию.
          </p>
        </div>

        <Button
          onClick={onCreateTask}
          size="lg"
          className="shadow-soft-md shrink-0"
          disabled={isCreating || areGroupsLoading || !hasGroups}
        >
          {isCreating ? (
            <>
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Создание...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Новая задача
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Automation Status Card */}
        <Card className="md:col-span-2">
          <div className="flex flex-col justify-between gap-5 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Автоматизация</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      'uppercase text-[10px] tracking-wider font-semibold rounded-full',
                      automationEnabled
                        ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-500'
                        : 'border border-border/60 bg-muted/60 text-muted-foreground'
                    )}
                  >
                    {automationEnabled ? 'Включено' : 'Выключено'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Настройте регулярный сбор данных без вашего участия
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onOpenAutomationSettings}>
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-2.5 text-sm">
                <div className="p-2 rounded-full bg-sky-500/10 text-sky-500">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Следующий запуск
                  </span>
                  <span className="font-semibold text-foreground">{nextRunText}</span>
                </div>
              </div>

              <div className="w-px h-8 bg-border" />

              <div className="flex items-center gap-2.5 text-sm">
                <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Последний запуск
                  </span>
                  <span className="font-semibold text-foreground">{lastRunText}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Action Card */}
        <Card className="flex flex-col items-center justify-center gap-3 p-6 text-center">
          <Button
            variant="outline"
            className="h-12 w-full text-base font-medium"
            onClick={onAutomationRun}
            disabled={isAutomationLoading || isAutomationTriggering || automation?.isRunning}
          >
            {isAutomationTriggering ? (
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Play className="w-5 h-5 mr-2 fill-current" />
            )}
            Запустить сейчас
          </Button>
          <p className="text-xs text-muted-foreground px-4">
            Принудительный запуск парсинга всех активных групп
          </p>
        </Card>
      </div>
    </div>
  )
}

export default TasksHero
