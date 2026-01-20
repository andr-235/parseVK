import { useMemo, useState } from 'react'
import { Pause, Play, RefreshCw, Search } from 'lucide-react'
import PageTitle from '@/components/PageTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMonitoringViewModel } from '@/modules/monitoring/hooks/useMonitoringViewModel'
import { MonitoringMessagesCard } from '@/modules/monitoring/components/MonitoringMessagesCard'

function Monitoring() {
  const [isKeywordsExpanded, setIsKeywordsExpanded] = useState(false)
  const keywordsPreviewCount = 8
  const {
    messages,
    searchInput,
    setSearchInput,
    usedKeywords,
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
    loadMore,
    refreshNow,
  } = useMonitoringViewModel()

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
    <div className="flex flex-col gap-10 pb-12 pt-6 font-monitoring-body text-text-primary">
      <Card className="relative overflow-hidden rounded-[28px] border-border/50 bg-[linear-gradient(135deg,rgba(14,165,233,0.12)_0%,rgba(34,197,94,0.08)_40%,rgba(251,191,36,0.1)_100%)] shadow-soft-lg motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-6 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9)_0%,rgba(12,74,110,0.45)_40%,rgba(120,53,15,0.35)_100%)]">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.35)_1px,transparent_0)] [background-size:26px_26px] dark:opacity-20" />
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl" />

        <CardContent className="relative z-10 flex flex-col gap-6 p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                Мониторинг
              </div>
              <PageTitle className="font-monitoring-display text-3xl sm:text-4xl md:text-5xl">
                Мониторинг сообщений
              </PageTitle>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Автоматический поиск сообщений по ключевым словам в подключённой базе. Можно задать
                собственный список ключей вручную и быстро сверить обновления.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-soft-sm backdrop-blur">
                <span
                  className={`size-2 rounded-full ${
                    isAutoRefreshActive
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] motion-safe:animate-pulse'
                      : autoRefresh
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                        : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                  }`}
                />
                <span>{autoRefreshLabel}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshNow()}
                disabled={isLoading || isRefreshing}
                className="h-10 rounded-full border-border/60 bg-background/70 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary shadow-soft-sm backdrop-blur transition hover:bg-background/90"
              >
                <RefreshCw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoRefresh}
                className={`h-10 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.2em] shadow-soft-sm transition ${
                  autoRefresh
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-200'
                    : 'border-border/60 bg-background/70 text-text-primary hover:bg-background/90'
                }`}
              >
                {autoRefresh ? (
                  <>
                    <Pause className="mr-2 size-4" />
                    Автообновление
                  </>
                ) : (
                  <>
                    <Play className="mr-2 size-4" />
                    Автообновление
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Ручной поиск по ключевым словам
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyManualSearch()
                    }
                  }}
                  placeholder="Ключевые слова через запятую или новую строку"
                  className="h-12 rounded-2xl border-border/50 bg-background/70 pl-11 text-sm shadow-soft-sm backdrop-blur"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Подсказка: нажмите Enter, чтобы применить набор ключей.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Button
                size="sm"
                onClick={applyManualSearch}
                className="h-11 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-soft-md transition hover:from-sky-500/90 hover:to-emerald-500/90"
              >
                Применить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearManualSearch}
                className="h-11 rounded-2xl border-border/60 bg-background/70 px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-text-primary shadow-soft-sm backdrop-blur transition hover:bg-background/90"
              >
                Сброс
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-soft-sm backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Сообщений
              </p>
              <p className="mt-2 font-monitoring-display text-3xl">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-soft-sm backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Ключей</p>
              <p className="mt-2 font-monitoring-display text-3xl">{stats.usedKeywordsCount}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-soft-sm backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Обновлено
              </p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{lastUpdatedLabel}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="uppercase tracking-[0.3em]">Активные ключи</span>
              <span>{usedKeywords.length ? `${usedKeywords.length} активны` : 'нет'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleKeywords.length > 0 ? (
                visibleKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="outline"
                    className="rounded-full border-border/60 bg-background/70 px-3 py-1 text-[11px] font-semibold text-text-primary shadow-soft-sm backdrop-blur"
                  >
                    {keyword}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">Нет активных ключевых слов</span>
              )}
            </div>
            {hiddenKeywordsCount > 0 && (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsKeywordsExpanded((value) => !value)}
                  className="h-8 px-2 text-xs font-semibold text-text-primary"
                >
                  {isKeywordsExpanded ? 'Свернуть список' : `Показать ещё ${hiddenKeywordsCount}`}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
  )
}

export default Monitoring
