import { NavLink } from 'react-router-dom'
import { Activity, Eye, RefreshCw, Pause, Play, Search } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils'

interface MonitoringHeroProps {
  sourceName: string
  sourceKey: string
  autoRefresh: boolean
  isAutoRefreshActive: boolean
  autoRefreshLabel: string
  isRefreshing: boolean
  isLoading: boolean
  onRefresh: () => void
  onToggleAutoRefresh: () => void
}

const getNavButtonClasses = (isActive: boolean) =>
  cn(
    'h-10 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200',
    isActive
      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
      : 'border border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50'
  )

export const MonitoringHero = ({
  sourceName,
  sourceKey,
  autoRefresh,
  isAutoRefreshActive,
  autoRefreshLabel,
  isRefreshing,
  isLoading,
  onRefresh,
  onToggleAutoRefresh,
}: MonitoringHeroProps) => {
  const messagesPath = `/monitoring/${sourceKey}`
  const groupsPath = `/monitoring/${sourceKey}/groups`

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
              Мониторинг <span className="text-cyan-400">{sourceName}</span>
            </h1>
            <Badge
              variant="outline"
              className={cn(
                'uppercase text-[10px] tracking-wider font-semibold rounded-full font-mono-accent',
                isAutoRefreshActive
                  ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                  : autoRefresh
                    ? 'border border-amber-500/25 bg-amber-500/10 text-amber-400'
                    : 'border border-slate-500/25 bg-slate-500/10 text-slate-400'
              )}
            >
              <span
                className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                  isAutoRefreshActive
                    ? 'bg-emerald-400 animate-pulse'
                    : autoRefresh
                      ? 'bg-amber-400'
                      : 'bg-slate-400'
                )}
              />
              {autoRefreshLabel}
            </Badge>
          </div>
          <p className="text-slate-300 max-w-2xl text-lg">
            Автоматический поиск сообщений по ключевым словам в подключённой базе {sourceName}.
            Мгновенное отслеживание новых совпадений с настраиваемым интервалом обновления.
          </p>
        </div>

        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <NavLink to={messagesPath} className={({ isActive }) => getNavButtonClasses(isActive)}>
              Сообщения
            </NavLink>
            <NavLink to={groupsPath} className={({ isActive }) => getNavButtonClasses(isActive)}>
              Группы
            </NavLink>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onRefresh}
              size="sm"
              variant="outline"
              className="h-10 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50 transition-all duration-200"
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw className={cn('mr-2 w-4 h-4', isRefreshing && 'animate-spin')} />
              Обновить
            </Button>
            <Button
              onClick={onToggleAutoRefresh}
              size="sm"
              className={cn(
                'h-10 transition-all duration-200',
                autoRefresh
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40'
                  : 'border border-white/10 bg-slate-800/50 text-white hover:bg-white/5'
              )}
            >
              {autoRefresh ? (
                <>
                  <Pause className="mr-2 w-4 h-4" />
                  Остановить
                </>
              ) : (
                <>
                  <Play className="mr-2 w-4 h-4" />
                  Запустить
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monitoring Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Мониторинг
                </h3>
                <p className="text-xs text-slate-400">Отслеживание в реальном времени</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Keywords Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Ключевые слова
                </h3>
                <p className="text-xs text-slate-400">Автоматический поиск совпадений</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Auto-refresh Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Автообновление
                </h3>
                <p className="text-xs text-slate-400">Периодическая синхронизация</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Live View Card */}
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-pink-500/20 to-cyan-500/20 opacity-50 blur-lg" />
          <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-400/50 to-transparent" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-monitoring-display text-sm font-semibold text-white">
                  Live-просмотр
                </h3>
                <p className="text-xs text-slate-400">Актуальные данные</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
