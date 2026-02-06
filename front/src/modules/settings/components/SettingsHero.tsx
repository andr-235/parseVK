import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Play, Settings as SettingsIcon, Send, Zap } from 'lucide-react'
import { cn } from '@/shared/utils'
import { useAutomationSettings } from '@/modules/settings/hooks/useAutomationSettings'

export const SettingsHero = () => {
  const { settings, isTriggering, handleRunNow } = useAutomationSettings()

  const automationEnabled = settings?.enabled ?? false

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
            Настройки <span className="text-cyan-400">системы</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg">
            Управление расписанием автоматического парсинга, интеграциями с внешними сервисами и
            уведомлениями.
          </p>
        </div>

        <Button
          onClick={handleRunNow}
          size="lg"
          className={cn(
            'group relative h-11 shrink-0 overflow-hidden font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
            automationEnabled
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/25 hover:shadow-cyan-500/40'
              : 'bg-slate-700 shadow-slate-700/25'
          )}
          disabled={!settings || isTriggering || settings?.isRunning}
        >
          {automationEnabled && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Automation Status Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Zap className="w-5 h-5" />
              </div>
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
                        ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                        : 'border border-slate-500/25 bg-slate-500/10 text-slate-400'
                    )}
                  >
                    {automationEnabled ? 'Вкл' : 'Выкл'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">Расписание парсинга</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Telegram Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Send className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Telegram
                </h3>
                <p className="text-xs text-slate-400">Интеграция и уведомления</p>
              </div>
            </div>
          </Card>
        </div>

        {/* General Settings Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Конфигурация
                </h3>
                <p className="text-xs text-slate-400">Общие параметры</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
