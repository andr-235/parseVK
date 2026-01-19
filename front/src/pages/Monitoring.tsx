import { useMemo } from 'react'
import { Pause, Play, RefreshCw, Search } from 'lucide-react'
import PageTitle from '@/components/PageTitle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMonitoringViewModel } from '@/modules/monitoring/hooks/useMonitoringViewModel'
import { MonitoringMessagesCard } from '@/modules/monitoring/components/MonitoringMessagesCard'

function Monitoring() {
  const {
    messages,
    searchInput,
    setSearchInput,
    usedKeywords,
    isLoading,
    isRefreshing,
    error,
    autoRefresh,
    lastUpdatedAt,
    stats,
    applyManualSearch,
    clearManualSearch,
    toggleAutoRefresh,
    refreshNow,
  } = useMonitoringViewModel()

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return '—'
    const date = new Date(lastUpdatedAt)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date)
  }, [lastUpdatedAt])

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <PageTitle>Мониторинг сообщений</PageTitle>
          <p className="max-w-2xl text-muted-foreground">
            Автоматический поиск сообщений по ключевым словам в подключённой базе. Можно задать
            собственный список ключей вручную.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshNow()}
            disabled={isLoading || isRefreshing}
            className="h-9"
          >
            <RefreshCw className={`mr-2 size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={toggleAutoRefresh}
            className="h-9"
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

      <Card className="border-border/60">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Ручной поиск по ключевым словам
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      applyManualSearch()
                    }
                  }}
                  placeholder="Ключевые слова через запятую или новую строку"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={applyManualSearch}>
                Применить
              </Button>
              <Button size="sm" variant="outline" onClick={clearManualSearch}>
                Сброс
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="bg-muted">
              Сообщений: {stats.total}
            </Badge>
            <Badge variant="secondary" className="bg-muted">
              Ключей: {stats.usedKeywordsCount}
            </Badge>
            <Badge variant="secondary" className="bg-muted">
              Обновлено: {lastUpdatedLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {usedKeywords.length > 0 ? (
              usedKeywords.map((keyword) => (
                <Badge key={keyword} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">Нет активных ключевых слов</span>
            )}
          </div>
        </CardContent>
      </Card>

      <MonitoringMessagesCard
        messages={messages}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
      />
    </div>
  )
}

export default Monitoring
