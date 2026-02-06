import { memo, useCallback } from 'react'
import { Eye, EyeOff, RefreshCw, Clock, Users } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils'
import { WATCHLIST_CONSTANTS } from '@/modules/watchlist/constants/watchlist'
import type { WatchlistHeroProps } from '@/modules/watchlist/types'
import { isValidWatchlistSettings } from '@/modules/watchlist/utils/watchlistUtils'
import WatchlistHeroErrorBoundary from './WatchlistHeroErrorBoundary'

/**
 * Компонент героя страницы watchlist, отображающий настройки мониторинга,
 * количество отслеживаемых авторов и элементы управления.
 *
 * @param settings - Настройки watchlist (интервал опроса, лимит авторов, флаг отслеживания всех комментариев)
 * @param totalAuthors - Общее количество авторов в watchlist
 * @param isLoadingAuthors - Флаг загрузки списка авторов
 * @param isUpdatingSettings - Флаг обновления настроек
 * @param onRefresh - Callback для обновления списка авторов
 * @param onToggleTrackAll - Callback для переключения режима отслеживания всех комментариев
 */
function WatchlistHeroComponent({
  settings,
  totalAuthors,
  isLoadingAuthors,
  isUpdatingSettings,
  onRefresh,
  onToggleTrackAll,
}: WatchlistHeroProps) {
  const handleRefresh = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  const handleToggleTrackAll = useCallback(() => {
    onToggleTrackAll()
  }, [onToggleTrackAll])

  if (!settings) {
    return <div className="text-slate-400">{WATCHLIST_CONSTANTS.LOADING_SETTINGS_TEXT}</div>
  }

  if (!isValidWatchlistSettings(settings)) {
    return <div className="text-red-400">{WATCHLIST_CONSTANTS.INVALID_SETTINGS_ERROR}</div>
  }

  const trackingEnabled = settings.trackAllComments

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <h1 className="font-monitoring-display text-3xl font-bold tracking-tight text-white">
            Авторы <span className="text-cyan-400">на карандаше</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-lg">
            Отслеживайте активность выбранных авторов в комментариях. Система автоматически
            проверяет новые комментарии от этих пользователей во всех отслеживаемых группах.
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          size="lg"
          variant="outline"
          className="h-11 shrink-0 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50 transition-all duration-200"
          disabled={isLoadingAuthors}
        >
          <RefreshCw className={cn('mr-2 w-5 h-5', isLoadingAuthors && 'animate-spin')} />
          Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Monitoring Status Card */}
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
                      Статус мониторинга
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        'uppercase text-[10px] tracking-wider font-semibold rounded-full font-mono-accent',
                        trackingEnabled
                          ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                          : 'border border-amber-500/25 bg-amber-500/10 text-amber-400'
                      )}
                    >
                      {trackingEnabled ? 'Активен' : 'Пауза'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {trackingEnabled
                      ? 'Система отслеживает новые комментарии от выбранных авторов'
                      : 'Отслеживание приостановлено, обновление временных меток продолжается'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="p-2 rounded-full bg-cyan-500/10 text-cyan-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                      Интервал проверки
                    </span>
                    <span className="font-semibold text-slate-200">
                      {settings.pollIntervalMinutes} мин
                    </span>
                  </div>
                </div>

                <div className="w-px h-8 bg-white/10" />

                <div className="flex items-center gap-2.5 text-sm">
                  <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                      Макс. авторов/цикл
                    </span>
                    <span className="font-semibold text-slate-200">{settings.maxAuthors}</span>
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

          <Card className="relative flex flex-col gap-4 p-6 border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-2xl overflow-hidden">
            {/* Top Border Glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <div className="space-y-1">
              <h3 className="font-monitoring-display text-sm font-semibold text-white">
                Режим отслеживания
              </h3>
              <p className="text-xs text-slate-500">
                Всего авторов:{' '}
                <span className="font-mono-accent text-slate-300">{totalAuthors || 0}</span>
              </p>
            </div>

            <Button
              className={cn(
                'h-12 w-full text-base font-medium transition-all duration-200',
                trackingEnabled
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40'
                  : 'border-white/10 bg-slate-800/50 text-white hover:bg-white/5 hover:border-cyan-400/50'
              )}
              onClick={handleToggleTrackAll}
              disabled={isUpdatingSettings}
              variant={trackingEnabled ? 'default' : 'outline'}
            >
              {isUpdatingSettings ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : trackingEnabled ? (
                <EyeOff className="w-5 h-5 mr-2" />
              ) : (
                <Eye className="w-5 h-5 mr-2" />
              )}
              {isUpdatingSettings
                ? 'Сохранение...'
                : trackingEnabled
                  ? 'Приостановить'
                  : 'Активировать'}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

const WatchlistHeroWithErrorBoundary = memo(WatchlistHeroComponent)

WatchlistHeroWithErrorBoundary.displayName = 'WatchlistHero'

export const WatchlistHero = (props: WatchlistHeroProps) => (
  <WatchlistHeroErrorBoundary>
    <WatchlistHeroWithErrorBoundary {...props} />
  </WatchlistHeroErrorBoundary>
)
