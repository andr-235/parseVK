import { useEffect, useState } from 'react'
import { metricsService, type ParsedMetrics } from '@/services/metricsService'
import { Card } from '@/shared/ui/card'

export default function Metrics() {
  const [metrics, setMetrics] = useState<ParsedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const raw = await metricsService.fetchMetrics()
      const parsed = metricsService.parsePrometheusMetrics(raw)
      setMetrics(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки метрик')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMetrics()
    const interval = setInterval(fetchMetrics, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Загрузка метрик...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">Ошибка: {error}</div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Метрики системы</h1>
        <button
          onClick={fetchMetrics}
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Обновить
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">HTTP Запросы</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Всего:</span>
              <span className="font-mono">{metrics.httpRequests.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">P50:</span>
              <span className="font-mono">
                {(metrics.httpRequests.duration.p50 * 1000).toFixed(0)}мс
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">P95:</span>
              <span className="font-mono">
                {(metrics.httpRequests.duration.p95 * 1000).toFixed(0)}мс
              </span>
            </div>
            <div className="mt-4 space-y-1">
              {Object.entries(metrics.httpRequests.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{status}:</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Задачи</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Активных:</span>
              <span className="font-mono">{metrics.tasks.active}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Всего:</span>
              <span className="font-mono">{metrics.tasks.total}</span>
            </div>
            <div className="mt-4 space-y-1">
              {Object.entries(metrics.tasks.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{status}:</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Watchlist</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Активных авторов:</span>
              <span className="font-mono">{metrics.watchlist.activeAuthors}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">VK API</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Всего:</span>
              <span className="font-mono">{metrics.vkApi.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">P50:</span>
              <span className="font-mono">{(metrics.vkApi.duration.p50 * 1000).toFixed(0)}мс</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">P95:</span>
              <span className="font-mono">{(metrics.vkApi.duration.p95 * 1000).toFixed(0)}мс</span>
            </div>
            <div className="mt-4 space-y-1">
              {Object.entries(metrics.vkApi.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{status}:</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Память</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heap Used:</span>
              <span className="font-mono">{metrics.system.memory.heapUsed.toFixed(2)} МБ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heap Total:</span>
              <span className="font-mono">{metrics.system.memory.heapTotal.toFixed(2)} МБ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RSS:</span>
              <span className="font-mono">{metrics.system.memory.rss.toFixed(2)} МБ</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">CPU</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">User:</span>
              <span className="font-mono">{metrics.system.cpu.user.toFixed(2)}с</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">System:</span>
              <span className="font-mono">{metrics.system.cpu.system.toFixed(2)}с</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
