import { Plus, Play, Settings, Calendar, Clock } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils'

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
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
            Задачи <span className="text-cyan-400">парсинга</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg">
            Управляйте сбором данных из ВКонтакте. Создавайте новые задачи или настройте
            автоматический парсинг по расписанию.
          </p>
        </div>

        <Button
          onClick={onCreateTask}
          size="lg"
          className="group relative h-11 shrink-0 overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreating || areGroupsLoading || !hasGroups}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {isCreating ? (
            <>
              <span className="relative w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              <span className="relative">Создание...</span>
            </>
          ) : (
            <>
              <Plus className="relative w-5 h-5 mr-2" />
              <span className="relative">Новая задача</span>
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Automation Status Card */}
        <div className="relative md:col-span-2">
          {/* Glow Effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 opacity-50 blur-xl" />

          <Card className="relative overflow-hidden border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-2xl">
            {/* Top Border Glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="flex flex-col justify-between gap-5 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-monitoring-display font-semibold text-white">
                      Автоматизация
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        'uppercase text-[10px] tracking-wider font-semibold rounded-full font-mono-accent',
                        automationEnabled
                          ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                          : 'border border-white/10 bg-slate-800/50 text-slate-400'
                      )}
                    >
                      {automationEnabled ? 'Включено' : 'Выключено'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    Настройте регулярный сбор данных без вашего участия
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenAutomationSettings}
                  className="hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                      Следующий запуск
                    </span>
                    <span className="font-semibold text-slate-200">{nextRunText}</span>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10" />

                <div className="flex items-center gap-2.5 text-sm">
                  <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                      Последний запуск
                    </span>
                    <span className="font-semibold text-slate-200">{lastRunText}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Action Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 opacity-50 blur-xl" />

          <Card className="relative flex flex-col items-center justify-center gap-3 p-6 text-center border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-2xl overflow-hidden">
            {/* Top Border Glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <Button
              variant="outline"
              className="h-12 w-full text-base font-medium border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50 transition-all duration-200"
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
            <p className="text-xs text-slate-500 px-4">
              Принудительный запуск парсинга всех активных групп
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TasksHero
