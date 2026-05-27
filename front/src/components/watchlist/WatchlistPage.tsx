import { useWatchlistViewModel } from '@/hooks/watchlist/useWatchlistViewModel'
import { WatchlistTableCard } from '@/components/watchlist/WatchlistTableCard'
import { WatchlistAuthorDetails } from '@/components/watchlist/WatchlistAuthorDetails'
import { PageHeader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, RefreshCw, Clock, Users } from 'lucide-react'
import { cn } from '@/utils/common'
import { WATCHLIST_CONSTANTS } from '@/config/watchlist/watchlist'
import { isValidWatchlistSettings } from '@/utils/watchlist/watchlistUtils'

function WatchlistPage() {
  const {
    filteredAuthors,
    totalAuthors,
    hasMoreAuthors,
    isLoadingAuthors,
    isLoadingMoreAuthors,
    currentAuthor,
    isLoadingAuthorDetails,
    settings,
    isUpdatingSettings,
    searchTerm,
    setSearchTerm,
    authorColumns,
    commentColumns,
    handleRefresh,
    handleLoadMore,
    handleToggleTrackAll,
    handleSelectAuthor,
  } = useWatchlistViewModel()

  const trackingEnabled = settings?.trackAllComments ?? false

  const renderHeader = () => {
    if (!settings) {
      return <div className="text-slate-400">{WATCHLIST_CONSTANTS.LOADING_SETTINGS_TEXT}</div>
    }

    if (!isValidWatchlistSettings(settings)) {
      return <div className="text-red-400">{WATCHLIST_CONSTANTS.INVALID_SETTINGS_ERROR}</div>
    }

    return (
      <PageHeader
        variant="grid"
        colsClass="grid-cols-1 gap-4 md:grid-cols-3"
        title={
          <>
            Авторы <span className="text-accent-primary">на карандаше</span>
          </>
        }
        description="Отслеживайте активность выбранных авторов в комментариях. Система автоматически проверяет новые комментарии от этих пользователей во всех отслеживаемых группах."
        actions={
          <Button
            onClick={handleRefresh}
            size="lg"
            variant="outline"
            className="h-11 shrink-0 border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50 transition-all duration-200"
            disabled={isLoadingAuthors}
          >
            <RefreshCw className={cn('mr-2 w-5 h-5', isLoadingAuthors && 'animate-spin')} />
            Обновить
          </Button>
        }
        cards={[
          {
            icon: Users,
            title: 'Статус мониторинга',
            subtitle: '',
            bgGradientClass: 'from-accent-primary/5 to-background-secondary',
            customContent: (
              <div className="flex flex-col justify-between gap-5 h-full w-full">
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
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
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

                  <div className="w-px h-8 bg-border/60" />

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
            ),
          },
          {
            icon: Eye,
            title: 'Режим отслеживания',
            subtitle: '',
            customContent: (
              <div className="flex flex-col gap-4 h-full w-full justify-center min-h-[140px]">
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
                      ? 'bg-primary text-white shadow-soft-sm hover:bg-orange-600'
                      : 'border-border/60 bg-background-secondary text-white hover:bg-white/5 hover:border-primary/50'
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
              </div>
            ),
          },
        ]}
      />
    )
  }

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        {renderHeader()}
      </div>

      {/* Watchlist Table - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Список авторов
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        <WatchlistTableCard
          authors={filteredAuthors}
          totalAuthors={totalAuthors}
          hasMoreAuthors={hasMoreAuthors}
          isLoadingAuthors={isLoadingAuthors}
          isLoadingMoreAuthors={isLoadingMoreAuthors}
          authorColumns={authorColumns}
          onSelectAuthor={handleSelectAuthor}
          onLoadMore={handleLoadMore}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Author Details - staggered animation */}
      {currentAuthor && (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
          <WatchlistAuthorDetails
            currentAuthor={currentAuthor}
            isLoadingAuthorDetails={isLoadingAuthorDetails}
            commentColumns={commentColumns}
          />
        </div>
      )}
    </div>
  )
}

export default WatchlistPage
