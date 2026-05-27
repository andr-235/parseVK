import { AutomationCard } from '@/components/settings/AutomationCard'
import { TelegramCard } from '@/components/settings/TelegramCard'
import { PageHeader } from '@/components/common'
import { Play, Settings as SettingsIcon, Send, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/common'
import { useAutomationSettings } from '@/hooks/settings/useAutomationSettings'

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

      {/* Settings Cards - staggered animation */}
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
