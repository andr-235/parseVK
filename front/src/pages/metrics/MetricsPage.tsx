import { useEffect, useState, useMemo } from 'react'
import { metricsService, type ParsedMetrics } from '@/pages/metrics/api/metrics.api'
import { Button } from '@/shared/components/ui/button'
import { Card } from '@/shared/components/ui/card'
import { StatusBadge, type StatusBadgeTone } from '@/shared/components/ui/status-badge'
import { PageHeader, PageContainer } from '@/shared/components/common'
import {
  Activity,
  Cpu,
  Server,
  Layers,
  AlertTriangle,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from 'lucide-react'

function MetricsPage() {
  const [metrics, setMetrics] = useState<ParsedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [systemOpen, setSystemOpen] = useState(false)

  const fetchMetrics = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)
      const raw = await metricsService.fetchMetrics()
      const parsed = metricsService.parsePrometheusMetrics(raw)
      setMetrics(parsed)
      setLastUpdated(new Date())
    } catch (err) {
      if (!isBackground) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки метрик')
      } else {
        console.error('Ошибка фонового обновления метрик:', err)
      }
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchMetrics(false)
    const interval = setInterval(() => {
      void fetchMetrics(true)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Helper calculations for Gateway status
  const gatewayInfo = useMemo(() => {
    if (!metrics) return { status: 'healthy' as const, errorRate: 0, label: 'Норма' }
    const total = metrics.httpRequests.total
    const statusCodes = metrics.httpRequests.byStatus
    const error5xx = Object.entries(statusCodes)
      .filter(([status]) => status.startsWith('5'))
      .reduce((sum, [, count]) => sum + count, 0)
    const errorRate = total > 0 ? (error5xx / total) * 100 : 0
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    let label = 'Норма'
    if (errorRate > 10) {
      status = 'down'
      label = 'Сбой'
    } else if (errorRate > 2) {
      status = 'degraded'
      label = 'Загружен'
    }
    return { status, errorRate, label }
  }, [metrics])

  // Helper calculations for VK API status
  const vkInfo = useMemo(() => {
    if (!metrics) return { status: 'healthy' as const, errorRate: 0, label: 'Норма' }
    const total = metrics.vkApi.total
    const statusCodes = metrics.vkApi.byStatus
    const errors = Object.entries(statusCodes)
      .filter(([status]) => status.startsWith('5') || status === 'error')
      .reduce((sum, [, count]) => sum + count, 0)
    const errorRate = total > 0 ? (errors / total) * 100 : 0
    const p95Ms = metrics.vkApi.duration.p95 * 1000
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    let label = 'Норма'
    if (errorRate > 10 || p95Ms > 5000) {
      status = 'down'
      label = 'Сбой API'
    } else if (errorRate > 2 || p95Ms > 2000) {
      status = 'degraded'
      label = 'Задержки'
    }
    return { status, errorRate, label }
  }, [metrics])

  // Helper calculations for Tasks status
  const tasksInfo = useMemo(() => {
    if (!metrics) return { status: 'healthy' as const, label: 'Ожидание' }
    const total = metrics.tasks.total
    const statusCodes = metrics.tasks.byStatus
    const failed = statusCodes['failed'] || 0
    const failedRate = total > 0 ? (failed / total) * 100 : 0
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    let label = 'Норма'
    if (failedRate > 15) {
      status = 'degraded'
      label = 'Ошибки задач'
    }
    return { status, label }
  }, [metrics])

  // Helper calculations for System status
  const systemInfo = useMemo(() => {
    if (!metrics) return { status: 'healthy' as const, label: 'Норма' }
    const rss = metrics.system.memory.rss
    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    let label = 'Норма'
    if (rss > 1024) {
      status = 'down'
      label = 'Перегрузка RAM'
    } else if (rss > 512) {
      status = 'degraded'
      label = 'Превышен порог'
    }
    return { status, label }
  }, [metrics])

  const getStatusTone = (status: 'healthy' | 'degraded' | 'down'): StatusBadgeTone => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'degraded':
        return 'warning'
      case 'down':
        return 'danger'
    }
  }

  const renderStatusDistribution = (byStatus: Record<string, number>, total: number) => {
    if (Object.keys(byStatus).length === 0) {
      return <div className="text-text-secondary/70 italic text-sm">нет данных по статусам</div>
    }

    return (
      <div className="space-y-2">
        {Object.entries(byStatus)
          .sort((a, b) => b[1] - a[1])
          .map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0

            let barColor = 'bg-background-secondary'
            let textColor = 'text-text-secondary'
            if (status.startsWith('2')) {
              barColor = 'bg-green-500/80'
              textColor = 'text-green-400'
            } else if (status.startsWith('3')) {
              barColor = 'bg-sky-500/80'
              textColor = 'text-sky-400'
            } else if (status.startsWith('4')) {
              barColor = 'bg-amber-500/80'
              textColor = 'text-amber-400'
            } else if (
              status.startsWith('5') ||
              status.toLowerCase() === 'failed' ||
              status.toLowerCase() === 'error'
            ) {
              barColor = 'bg-red-500/80'
              textColor = 'text-red-400'
            }

            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`${textColor} font-semibold`}>{status}</span>
                  <span className="text-text-secondary">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-background-primary rounded overflow-hidden">
                  <div
                    className={`h-full ${barColor} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    )
  }

  if (loading && !metrics) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-background-secondary rounded-lg" />
            <div className="h-4 w-80 bg-background-secondary rounded-lg" />
          </div>
          <div className="h-10 w-24 bg-background-secondary rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-background-primary border border-border rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-80 bg-background-primary border border-border rounded-card" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-red-500/10 p-3 text-red-500 border border-red-500/20">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text-primary">
          Не удалось загрузить метрики системы
        </h3>
        <p className="mb-6 max-w-md text-sm text-text-secondary">
          Произошла техническая ошибка при обращении к серверному шлюзу Prometheus. Убедитесь, что
          сервис работает стабильно.
        </p>
        <Button
          onClick={() => void fetchMetrics(false)}
          variant="destructive"
        >
          <RefreshCw className="h-4 w-4" />
          Повторить попытку
        </Button>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <PageContainer maxWidth="1600px" animate={false}>
      <PageHeader
        variant="grid"
        title={
          <>
            Здоровье <span className="text-accent-primary">системы</span>
          </>
        }
        description="Оперативный пульт мониторинга шлюзов, очередей задач и аппаратных ресурсов аналитического центра."
        actions={
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-text-secondary font-mono">
                <Clock className="h-3.5 w-3.5" />
                <span>Обновлено: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
            <Button
              onClick={() => void fetchMetrics(true)}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </Button>
          </div>
        }
      />

      {/* Service Health Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Component 1: API Gateway */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                Сетевой Шлюз
              </span>
              <h3 className="text-sm font-semibold text-text-primary">API Gateway</h3>
            </div>
            <StatusBadge tone={getStatusTone(gatewayInfo.status)} pulse>
              {gatewayInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-text-secondary">P95 задержка:</span>
            <span className="text-xs font-mono font-bold text-text-primary">
              {metrics.httpRequests.total > 0 ? (
                `${(metrics.httpRequests.duration.p95 * 1000).toFixed(0)}мс`
              ) : (
                <span className="text-text-secondary italic">нет данных</span>
              )}
            </span>
          </div>
        </Card>

        {/* Component 2: VK API Integration */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                Контроллер VK
              </span>
              <h3 className="text-sm font-semibold text-text-primary">VK API Service</h3>
            </div>
            <StatusBadge tone={getStatusTone(vkInfo.status)} pulse>
              {vkInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-text-secondary">P95 задержка:</span>
            <span className="text-xs font-mono font-bold text-text-primary">
              {metrics.vkApi.total > 0 ? (
                `${(metrics.vkApi.duration.p95 * 1000).toFixed(0)}мс`
              ) : (
                <span className="text-text-secondary italic">нет данных</span>
              )}
            </span>
          </div>
        </Card>

        {/* Component 3: Tasks Executor */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                Фоновый Воркер
              </span>
              <h3 className="text-sm font-semibold text-text-primary">Tasks Queue</h3>
            </div>
            <StatusBadge tone={getStatusTone(tasksInfo.status)} pulse>
              {tasksInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-text-secondary">Активные задачи:</span>
            <span className="text-xs font-mono font-bold text-text-primary">
              {metrics.tasks.active}
            </span>
          </div>
        </Card>

        {/* Component 4: System CPU/RAM */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                Системная Среда
              </span>
              <h3 className="text-sm font-semibold text-text-primary">Node.js Runtime</h3>
            </div>
            <StatusBadge tone={getStatusTone(systemInfo.status)} pulse>
              {systemInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-text-secondary">Потребление RAM (RSS):</span>
            <span className="text-xs font-mono font-bold text-text-primary">
              {metrics.system.memory.rss.toFixed(0)} МБ
            </span>
          </div>
        </Card>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI Card 1: HTTP Requests */}
        <Card className="bg-background-secondary/40 border border-border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-text-secondary" />
                <h3 className="text-sm font-semibold text-text-primary">Сетевые запросы шлюза</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                  Всего обработано
                </span>
                <div className="text-3xl font-bold font-mono tracking-tight text-text-light">
                  {metrics.httpRequests.total}
                </div>
              </div>

              {/* Latency subgrid */}
              <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-3 text-center">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">
                    P50
                  </span>
                  <div className="text-xs font-mono font-semibold text-text-primary">
                    {(metrics.httpRequests.duration.p50 * 1000).toFixed(0)}мс
                  </div>
                </div>
                <div className="space-y-1 border-x border-border/60">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">
                    P95
                  </span>
                  <div className="text-xs font-mono font-semibold text-text-primary">
                    {(metrics.httpRequests.duration.p95 * 1000).toFixed(0)}мс
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">
                    P99
                  </span>
                  <div className="text-xs font-mono font-semibold text-text-primary">
                    {(metrics.httpRequests.duration.p99 * 1000).toFixed(0)}мс
                  </div>
                </div>
              </div>

              {/* Status Code Distribution */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono block">
                  Распределение статусов
                </span>
                {renderStatusDistribution(
                  metrics.httpRequests.byStatus,
                  metrics.httpRequests.total
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* KPI Card 2: VK API Integration */}
        <Card className="bg-background-secondary/40 border border-border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-text-secondary" />
                <h3 className="text-sm font-semibold text-text-primary">Вызовы VK API</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                  Запросы к ВКонтакте
                </span>
                <div className="text-3xl font-bold font-mono tracking-tight text-text-light">
                  {metrics.vkApi.total}
                </div>
              </div>

              {/* Latency subgrid */}
              <div className="grid grid-cols-2 gap-2 border-y border-border/60 py-3 text-center">
                <div className="space-y-1 border-r border-border/60">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">
                    P50 задержка
                  </span>
                  <div className="text-xs font-mono font-semibold text-text-primary">
                    {(metrics.vkApi.duration.p50 * 1000).toFixed(0)}мс
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">
                    P95 задержка
                  </span>
                  <div className="text-xs font-mono font-semibold text-text-primary">
                    {(metrics.vkApi.duration.p95 * 1000).toFixed(0)}мс
                  </div>
                </div>
              </div>

              {/* VK API Status Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono block">
                  Статусы вызовов API
                </span>
                {renderStatusDistribution(metrics.vkApi.byStatus, metrics.vkApi.total)}
              </div>
            </div>
          </div>
        </Card>

        {/* KPI Card 3: Tasks and Watchlist */}
        <Card className="bg-background-secondary/40 border border-border p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-text-secondary" />
                <h3 className="text-sm font-semibold text-text-primary">Очередь задач иwatchlist</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-secondary" />
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                    Всего задач
                  </span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-text-light">
                    {metrics.tasks.total}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                    Активные авторы
                  </span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-text-light">
                    {metrics.watchlist.activeAuthors}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono block">
                  Распределение состояний задач
                </span>
                {renderStatusDistribution(metrics.tasks.byStatus, metrics.tasks.total)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Collapsible Details: Technical Resources */}
      <Card className="border border-border/80 bg-background-secondary/20 overflow-hidden transition-all duration-200">
        <Button
          onClick={() => setSystemOpen(!systemOpen)}
          variant="ghost"
          className="flex w-full justify-between px-5 py-4 hover:bg-background-secondary/30"
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-text-secondary" />
            <span className="text-sm font-semibold text-text-primary">
              Системные ресурсы & Аппаратная среда
            </span>
          </div>
          {systemOpen ? (
            <ChevronUp className="h-4 w-4 text-text-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          )}
        </Button>

        {systemOpen && (
          <div className="border-t border-border/60 bg-background-secondary/20 p-5 space-y-4 animate-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Memory panel */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                    Выделение оперативной памяти
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Heap Used (занято в куче):</span>
                    <span className="font-mono text-text-primary font-medium">
                      {metrics.system.memory.heapUsed.toFixed(2)} МБ
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Heap Total (всего в куче):</span>
                    <span className="font-mono text-text-primary font-medium">
                      {metrics.system.memory.heapTotal.toFixed(2)} МБ
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-border pt-2 font-semibold">
                    <span className="text-text-primary">Resident Set Size (RSS):</span>
                    <span className="font-mono text-primary">
                      {metrics.system.memory.rss.toFixed(2)} МБ
                    </span>
                  </div>
                </div>
              </div>

              {/* CPU panel */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary font-mono">
                    Процессорное время CPU
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">User Time (пользовательский режим):</span>
                    <span className="font-mono text-text-primary font-medium">
                      {metrics.system.cpu.user.toFixed(3)}с
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">System Time (системный режим):</span>
                    <span className="font-mono text-text-primary font-medium">
                      {metrics.system.cpu.system.toFixed(3)}с
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-border pt-2 font-semibold">
                    <span className="text-text-primary">Суммарное время загрузки:</span>
                    <span className="font-mono text-primary">
                      {(metrics.system.cpu.user + metrics.system.cpu.system).toFixed(3)}с
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  )
}

export default MetricsPage
