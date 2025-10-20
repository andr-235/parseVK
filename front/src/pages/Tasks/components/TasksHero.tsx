import PageHeroCard from '../../../components/PageHeroCard'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'

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
  if (!value) {
    return '—'
  }

  try {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[TasksHero] Failed to format automation date', error)
    }
    return new Date(value).toLocaleString('ru-RU')
  }
}

function TasksHero({
  onCreateTask,
  isCreating,
  areGroupsLoading,
  hasGroups,
  formattedLastUpdated,
  automation,
  onAutomationRun,
  onOpenAutomationSettings,
  isAutomationLoading,
  isAutomationTriggering,
}: TasksHeroProps) {
  const createButtonText = isCreating
    ? 'Запуск...'
    : areGroupsLoading
      ? 'Загрузка групп...'
      : !hasGroups
        ? 'Нет доступных групп'
        : 'Создать задачу на парсинг групп'

  const actions = (
    <Button
      onClick={onCreateTask}
      disabled={isCreating || areGroupsLoading}
      className="w-full md:w-auto"
    >
      {isCreating ? (
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {createButtonText}
        </span>
      ) : (
        createButtonText
      )}
    </Button>
  )

  const automationEnabled = automation?.enabled ?? false
  const automationRunning = automation?.isRunning ?? false
  const automationBadgeVariant = automationEnabled ? 'secondary' : 'outline'
  const automationBadgeText = automationEnabled ? 'Автозапуск включён' : 'Автозапуск выключен'
  const nextRunText = automationEnabled
    ? formatDateTime(automation?.nextRunAt ?? null)
    : '—'
  const lastRunText = formatDateTime(automation?.lastRunAt ?? null)
  const runButtonDisabled =
    isAutomationLoading || isAutomationTriggering || automationRunning
  const runButtonLabel =
    isAutomationTriggering || automationRunning ? 'Запуск...' : 'Запустить сейчас'
  const showAutomationSkeleton = isAutomationLoading && !automation

  const footer = (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant={automationBadgeVariant}
          className={
            automationEnabled
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'border-border text-text-secondary'
          }
        >
          {showAutomationSkeleton ? 'Загрузка настроек...' : automationBadgeText}
        </Badge>
        <span className="text-sm text-text-secondary">
          Следующий запуск:{' '}
          <span className="font-medium text-text-primary">
            {showAutomationSkeleton ? '—' : nextRunText}
          </span>
        </span>
        <span className="text-sm text-text-secondary">
          Последний запуск:{' '}
          <span className="font-medium text-text-primary">
            {showAutomationSkeleton ? '—' : lastRunText}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          История задач обновлена:{' '}
          <span className="text-text-primary">{formattedLastUpdated}</span>
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAutomationRun}
            disabled={runButtonDisabled}
          >
            {runButtonLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenAutomationSettings}
          >
            Настроить автозапуск
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <PageHeroCard
      title="Задачи парсинга"
      description="Управляйте запуском парсинга, отслеживайте прогресс задач и возвращайтесь к истории запусков, чтобы вовремя реагировать на ошибки."
      actions={actions}
      footer={footer}
    />
  )
}

export default TasksHero
