import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Settings as SettingsIcon, Send, Zap } from 'lucide-react'
import { cn } from '@/utils/common'
import { useAutomationSettings } from '@/hooks/settings/useAutomationSettings'
import { FeatureGridHero } from '@/components/common/FeatureGridHero'
import type { HeroCardConfig } from '@/components/common/FeatureGridHero'

export const SettingsHero = () => {
  const { settings, isTriggering, handleRunNow } = useAutomationSettings()

  const automationEnabled = settings?.enabled ?? false

  const cards: HeroCardConfig[] = [
    {
      icon: Zap,
      title: 'Автоматизация',
      subtitle: 'Расписание парсинга',
      bgGradientClass: 'from-accent-info/20 to-accent-primary/20',
      borderGradientClass: 'via-accent-info/50',
      iconBgClass: 'bg-accent-info/10',
      iconTextClass: 'text-accent-info',
      customContent: (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-monitoring-display text-sm font-semibold text-white">
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
      bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
      borderGradientClass: 'via-accent-primary/50',
      iconBgClass: 'bg-accent-primary/10',
      iconTextClass: 'text-accent-primary',
    },
    {
      icon: SettingsIcon,
      title: 'Конфигурация',
      subtitle: 'Общие параметры',
      bgGradientClass: 'from-accent-primary/20 to-accent-info/20',
      borderGradientClass: 'via-accent-primary/50',
      iconBgClass: 'bg-accent-primary/10',
      iconTextClass: 'text-accent-primary',
    },
  ]

  const actions = (
    <Button
      onClick={handleRunNow}
      size="lg"
      className={cn(
        'group relative h-11 shrink-0 overflow-hidden font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
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
  )

  const titleNode = (
    <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
      Настройки <span className="text-accent-info">системы</span>
    </h1>
  )

  return (
    <FeatureGridHero
      title={titleNode}
      description="Управление расписанием автоматического парсинга, интеграциями с внешними сервисами и уведомлениями."
      actions={actions}
      cards={cards}
      colsClass="grid-cols-1 gap-4 sm:grid-cols-3"
    />
  )
}

