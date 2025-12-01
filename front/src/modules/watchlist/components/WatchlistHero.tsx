import { memo, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeroCard from '@/components/PageHeroCard'
import { WATCHLIST_CONSTANTS } from '../constants/watchlist'
import type { WatchlistHeroProps } from '@/types/watchlist'
import { isValidWatchlistSettings } from '@/utils/watchlistUtils'
import WatchlistHeroErrorBoundary from '@/components/WatchlistHeroErrorBoundary'

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
  if (!settings) {
    return <div>{WATCHLIST_CONSTANTS.LOADING_SETTINGS_TEXT}</div>
  }

  // Валидация settings с помощью guard function
  if (!isValidWatchlistSettings(settings)) {
    return <div>{WATCHLIST_CONSTANTS.INVALID_SETTINGS_ERROR}</div>
  }

  const handleRefresh = useCallback(() => {
    onRefresh()
  }, [onRefresh])

  const handleToggleTrackAll = useCallback(() => {
    onToggleTrackAll()
  }, [onToggleTrackAll])
  const heroDescription = useMemo(() => {
    // Формирует описание автора: показывает описание с интервалом опроса и лимитом авторов
    return `Список авторов «На карандаше». Проверка активности каждые ${settings.pollIntervalMinutes} мин., лимит одновременно обновляемых авторов — ${settings.maxAuthors}.`
  }, [settings])

  const footer = useMemo((): ReactNode => {
    // Создает массив бейджей для отображения количества авторов и интервала опроса
    const badges = [
      <Badge key="authors" variant="secondary" className="bg-white/20 text-text-primary">
        {`${WATCHLIST_CONSTANTS.AUTHORS_BADGE_PREFIX}${totalAuthors || 0}`}
      </Badge>,
    ]

    badges.push(
      <Badge key="interval" variant="outline">
        {`${WATCHLIST_CONSTANTS.INTERVAL_BADGE_PREFIX}${settings.pollIntervalMinutes}${WATCHLIST_CONSTANTS.INTERVAL_BADGE_SUFFIX}`}
      </Badge>
    )

    return badges
  }, [settings, totalAuthors])

  const toggleButtonText = useMemo(() => {
    return isUpdatingSettings
      ? WATCHLIST_CONSTANTS.SAVING_TEXT
      : settings.trackAllComments
        ? WATCHLIST_CONSTANTS.DISABLE_TRACK_ALL_TEXT
        : WATCHLIST_CONSTANTS.ENABLE_TRACK_ALL_TEXT
  }, [isUpdatingSettings, settings])

  const refreshButton = useMemo(() => (
    <Button type="button" variant="outline" onClick={handleRefresh} disabled={isLoadingAuthors} aria-label="Обновить список">
      {WATCHLIST_CONSTANTS.REFRESH_BUTTON_TEXT}
    </Button>
  ), [handleRefresh, isLoadingAuthors])

  const toggleTrackAllButton = useMemo(() => (
    <Button
      type="button"
      variant={settings.trackAllComments ? 'default' : 'outline'}
      onClick={handleToggleTrackAll}
      disabled={isUpdatingSettings}
      aria-label={toggleButtonText}
    >
      {toggleButtonText}
    </Button>
  ), [handleToggleTrackAll, settings, isUpdatingSettings, toggleButtonText])

  return (
    <PageHeroCard
      title="Авторы на карандаше"
      description={heroDescription}
      actions={(
        <div className="flex flex-col gap-2 sm:flex-row">
          {refreshButton}
          {toggleTrackAllButton}
        </div>
      )}
      footer={footer}
    />
  )
}

const WatchlistHeroWithErrorBoundary = memo(WatchlistHeroComponent)

WatchlistHeroWithErrorBoundary.displayName = 'WatchlistHero'

export const WatchlistHero = (props: WatchlistHeroProps) => (
  <WatchlistHeroErrorBoundary>
    <WatchlistHeroWithErrorBoundary {...props} />
  </WatchlistHeroErrorBoundary>
)