import { Plus, Play, Settings, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/common'

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
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-semibold tracking-tight text-white">
            Задачи парсинга
          </h1>
          <p className="font-monitoring-body text-sm font-normal text-text-secondary max-w-xl">
            Управляйте сбором данных из ВКонтакте. Создавайте новые задачи или настройте
            автоматический парсинг по расписанию.
          </p>
        </div>

        <Button
          onClick={onCreateTask}
          size="lg"
          className="h-10 shrink-0 bg-accent-primary px-6 text-sm font-semibold tracking-wide text-text-light shadow-soft-sm transition-all duration-200 hover:bg-accent-primary/90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreating || areGroupsLoading}
          aria-label="Создать новую задачу парсинга"
        >
          {isCreating ? (
            <>
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              <span>Создание...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              <span>Новая задача</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
        {/* Automation Status Card */}
        <div className="relative md:col-span-2 flex">
          <Card className="relative overflow-hidden border border-border/60 bg-background-secondary shadow-soft-sm h-full w-full flex flex-col justify-between">
            <div className="flex flex-col justify-between gap-5 p-6 h-full w-full">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-monitoring-body text-base font-semibold text-text-primary">
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
                      {automationEnabled ? 'Включено' : 'Выключено'}
                    </Badge>
                  </div>
                  <p className="font-monitoring-body text-sm font-normal text-text-secondary">
                    Настройте регулярный сбор данных без вашего участия
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenAutomationSettings}
                  className="hover:bg-background-primary/40 transition-colors"
                  aria-label="Открыть настройки автоматизации"
                >
                  <Settings className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="p-2 rounded-full bg-accent-info/10 text-accent-info">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70">
                      Следующий запуск
                    </span>
                    <span className="font-mono-accent text-xs font-medium text-text-primary">{nextRunText}</span>
                  </div>
                </div>

                <div className="w-px h-8 bg-border/60" />

                <div className="flex items-center gap-2.5 text-sm">
                  <div className="p-2 rounded-full bg-accent-primary/10 text-accent-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-monitoring-body text-xs font-semibold uppercase tracking-wider text-text-secondary/70">
                      Последний запуск
                    </span>
                    <span className="font-mono-accent text-xs font-medium text-text-primary">{lastRunText}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Action Card */}
        <div className="relative flex">
          <Card className="relative flex flex-col items-center justify-center gap-4 p-6 text-center border border-border/60 bg-background-secondary shadow-soft-sm overflow-hidden h-full w-full">
            <Button
              variant="outline"
              className="h-10 w-full text-sm font-semibold border-accent-primary/20 bg-accent-primary/5 text-accent-primary hover:bg-accent-primary hover:text-text-light hover:border-accent-primary transition-all duration-200"
              onClick={onAutomationRun}
              disabled={isAutomationLoading || isAutomationTriggering || automation?.isRunning}
              aria-label="Запустить автоматический сбор данных сейчас"
            >
              {isAutomationTriggering ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2 fill-current" />
              )}
              Запустить сейчас
            </Button>
            <p className="font-monitoring-body text-xs font-normal text-text-secondary/70 px-4 leading-relaxed">
              Принудительный запуск парсинга всех активных групп
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TasksHero
