import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, Hash, MessageSquare, Clock } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/utils'
import {
  MONITORING_TIME_RANGES,
  useMonitoringViewModel,
} from '@/modules/monitoring/hooks/useMonitoringViewModel'
import { MonitoringMessagesCard } from '@/modules/monitoring/components/MonitoringMessagesCard'
import { MonitoringHero } from '@/modules/monitoring/components/MonitoringHero'

const MONITORING_SOURCES = {
  whatsapp: {
    label: 'WhatsApp',
    sources: ['messages'],
  },
  max: {
    label: 'Max',
    sources: ['messages_max'],
  },
} as const

function MonitoringPage() {
  const { sourceKey } = useParams()
  const normalizedSourceKey = sourceKey?.toLowerCase()
  const activeSource =
    normalizedSourceKey === 'max' ? MONITORING_SOURCES.max : MONITORING_SOURCES.whatsapp
  const activeSourceKey = normalizedSourceKey === 'max' ? 'max' : 'whatsapp'
  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false)
  const keywordsPreviewCount = 8
  const {
    messages,
    searchInput,
    setSearchInput,
    usedKeywords,
    timeRange,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    autoRefresh,
    page,
    hasMore,
    lastUpdatedAt,
    stats,
    applyManualSearch,
    clearManualSearch,
    toggleAutoRefresh,
    changeTimeRange,
    loadMore,
    refreshNow,
  } = useMonitoringViewModel({ sources: [...activeSource.sources] })

  const isAutoRefreshActive = autoRefresh && page === 1
  const autoRefreshLabel = autoRefresh
    ? page > 1
      ? 'Автообновление приостановлено'
      : 'Автообновление включено'
    : 'Автообновление выключено'

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return '—'
    const date = new Date(lastUpdatedAt)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }, [lastUpdatedAt])

  const visibleKeywords = isKeywordsExpanded
    ? usedKeywords
    : usedKeywords.slice(0, keywordsPreviewCount)
  const hiddenKeywordsCount = Math.max(usedKeywords.length - visibleKeywords.length, 0)

  return (
    <div className="flex flex-col gap-10 max-w-[1600px] mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body">
      {/* Hero Section - fade in first */}
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <MonitoringHero
          sourceName={activeSource.label}
          sourceKey={activeSourceKey}
          autoRefresh={autoRefresh}
          isAutoRefreshActive={isAutoRefreshActive}
          autoRefreshLabel={autoRefreshLabel}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          onRefresh={refreshNow}
          onToggleAutoRefresh={toggleAutoRefresh}
        />
      </div>

      {/* Search Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">
            Поиск по ключевым словам
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-6 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Ручной поиск
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-500" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyManualSearch()
                    }
                  }}
                  placeholder="Ключевые слова через запятую или новую строку"
                  className="h-11 border-white/10 bg-slate-800/50 pl-11 text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200"
                />
              </div>
              <p className="text-xs text-slate-500">Подсказка: нажмите Enter для применения</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                onClick={applyManualSearch}
                className="h-11 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300"
              >
                Применить
              </Button>
              <Button
                variant="outline"
                onClick={clearManualSearch}
                className="h-11 border-white/10 bg-slate-800/50 text-white hover:bg-white/5 transition-all duration-200"
              >
                Сброс
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Период</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <div className="flex flex-wrap gap-2">
          {MONITORING_TIME_RANGES.map((option) => {
            const isActive = timeRange === option.value
            return (
              <Button
                key={option.value}
                type="button"
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => changeTimeRange(option.value)}
                className={cn(
                  'h-10 px-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'border-white/10 bg-slate-800/50 text-white hover:bg-white/5'
                )}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Statistics Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Статистика</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Messages Card */}
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 opacity-50 blur-lg" />
            <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                    Сообщений
                  </p>
                  <p className="font-monitoring-display text-3xl font-bold text-white">
                    {stats.total}
                  </p>
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
                  <Hash className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                    Ключей
                  </p>
                  <p className="font-monitoring-display text-3xl font-bold text-white">
                    {stats.usedKeywordsCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Last Updated Card */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-50 blur-lg" />
            <Card className="relative border border-white/10 bg-slate-900/80 backdrop-blur-2xl p-5 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide font-mono-accent">
                    Обновлено
                  </p>
                  <p className="font-monitoring-display text-lg font-semibold text-white">
                    {lastUpdatedLabel}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Active Keywords Section - staggered animation */}
      {usedKeywords.length > 0 && (
        <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-400">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <h2 className="font-monitoring-display text-2xl font-semibold text-white">
                Активные ключи
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
            </div>
            <Badge
              variant="outline"
              className="border-white/10 bg-slate-900/50 px-3 py-1 text-xs text-slate-400 font-mono-accent"
            >
              {usedKeywords.length} активны
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {visibleKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="outline"
                  className="rounded-full border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
            {hiddenKeywordsCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsKeywordsExpanded((value) => !value)}
                className="text-xs font-semibold text-slate-400 hover:text-white"
              >
                {isKeywordsExpanded ? 'Свернуть список' : `Показать ещё ${hiddenKeywordsCount}`}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Messages Section - staggered animation */}
      <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-500">
        <div className="flex items-center gap-4">
          <h2 className="font-monitoring-display text-2xl font-semibold text-white">Сообщения</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>

        <MonitoringMessagesCard
          messages={messages}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          isLoadingMore={isLoadingMore}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          usedKeywords={usedKeywords}
        />
      </div>
    </div>
  )
}

export default MonitoringPage
