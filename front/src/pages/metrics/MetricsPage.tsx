import { useEffect, useState, useMemo } from 'react'
import { metricsService, type ParsedMetrics } from '@/pages/metrics/api/metrics.api'
import { Card } from '@/shared/components/ui/card'
import { StatusBadge, type StatusBadgeTone } from '@/shared/components/ui/status-badge'
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
      return <div className="text-slate-500/70 italic text-sm">нет данных по статусам</div>
    }

    return (
      <div className="space-y-2">
        {Object.entries(byStatus)
          .sort((a, b) => b[1] - a[1])
          .map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0

            let barColor = 'bg-slate-600'
            let textColor = 'text-slate-400'
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
                  <span className="text-slate-400">
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
            <div className="h-8 w-48 bg-slate-800 rounded" />
            <div className="h-4 w-80 bg-slate-800 rounded" />
          </div>
          <div className="h-10 w-24 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-slate-850 border border-border rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-80 bg-slate-850 border border-border rounded-xl" />
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
        <h3 className="mb-2 text-lg font-semibold text-slate-200">
          Не удалось загрузить метрики системы
        </h3>
        <p className="mb-6 max-w-md text-sm text-slate-400">
          Произошла техническая ошибка при обращении к серверному шлюзу Prometheus. Убедитесь, что
          сервис работает стабильно.
        </p>
        <button
          onClick={() => void fetchMetrics(false)}
          className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Повторить попытку
        </button>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-display">
            Здоровье системы
          </h1>
          <p className="text-sm text-slate-400">
            Оперативный пульт мониторинга шлюзов, очередей задач и аппаратных ресурсов
            аналитического центра.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>Обновлено: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <button
            onClick={() => void fetchMetrics(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700/60 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
        </div>
      </div>

      {/* Service Health Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Component 1: API Gateway */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                Сетевой Шлюз
              </span>
              <h3 className="text-sm font-semibold text-slate-200">API Gateway</h3>
            </div>
            <StatusBadge tone={getStatusTone(gatewayInfo.status)} pulse>
              {gatewayInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">P95 задержка:</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {metrics.httpRequests.total > 0 ? (
                `${(metrics.httpRequests.duration.p95 * 1000).toFixed(0)}мс`
              ) : (
                <span className="text-slate-600/70 italic">нет данных</span>
              )}
            </span>
          </div>
        </Card>

        {/* Component 2: VK API Integration */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                Контроллер VK
              </span>
              <h3 className="text-sm font-semibold text-slate-200">VK API Service</h3>
            </div>
            <StatusBadge tone={getStatusTone(vkInfo.status)} pulse>
              {vkInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">P95 задержка:</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {metrics.vkApi.total > 0 ? (
                `${(metrics.vkApi.duration.p95 * 1000).toFixed(0)}мс`
              ) : (
                <span className="text-slate-600/70 italic">нет данных</span>
              )}
            </span>
          </div>
        </Card>

        {/* Component 3: Tasks Executor */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                Фоновый Воркер
              </span>
              <h3 className="text-sm font-semibold text-slate-200">Tasks Queue</h3>
            </div>
            <StatusBadge tone={getStatusTone(tasksInfo.status)} pulse>
              {tasksInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Активные задачи:</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {metrics.tasks.active}
            </span>
          </div>
        </Card>

        {/* Component 4: System CPU/RAM */}
        <Card className="relative overflow-hidden bg-background-secondary/50 border border-border p-4 transition-all duration-200 hover:border-border/80">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                Системная Среда
              </span>
              <h3 className="text-sm font-semibold text-slate-200">Node.js Runtime</h3>
            </div>
            <StatusBadge tone={getStatusTone(systemInfo.status)} pulse>
              {systemInfo.label}
            </StatusBadge>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Потребление RAM (RSS):</span>
            <span className="text-xs font-mono font-bold text-slate-300">
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
                <Server className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Сетевые запросы шлюза</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                  Всего обработано
                </span>
                <div className="text-3xl font-bold font-mono tracking-tight text-slate-100">
                  {metrics.httpRequests.total}
                </div>
              </div>

              {/* Latency subgrid */}
              <div className="grid grid-cols-3 gap-2 border-y border-border/60 py-3 text-center">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                    P50
                  </span>
                  <div className="text-xs font-mono font-semibold text-slate-300">
                    {(metrics.httpRequests.duration.p50 * 1000).toFixed(0)}мс
                  </div>
                </div>
                <div className="space-y-1 border-x border-border/60">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                    P95
                  </span>
                  <div className="text-xs font-mono font-semibold text-slate-300">
                    {(metrics.httpRequests.duration.p95 * 1000).toFixed(0)}мс
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                    P99
                  </span>
                  <div className="text-xs font-mono font-semibold text-slate-300">
                    {(metrics.httpRequests.duration.p99 * 1000).toFixed(0)}мс
                  </div>
                </div>
              </div>

              {/* Status Code Distribution */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">
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
                <Activity className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Вызовы VK API</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                  Запросы к ВКонтакте
                </span>
                <div className="text-3xl font-bold font-mono tracking-tight text-slate-100">
                  {metrics.vkApi.total}
                </div>
              </div>

              {/* Latency subgrid */}
              <div className="grid grid-cols-2 gap-2 border-y border-border/60 py-3 text-center">
                <div className="space-y-1 border-r border-border/60">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                    P50 задержка
                  </span>
                  <div className="text-xs font-mono font-semibold text-slate-300">
                    {(metrics.vkApi.duration.p50 * 1000).toFixed(0)}мс
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                    P95 задержка
                  </span>
                  <div className="text-xs font-mono font-semibold text-slate-300">
                    {(metrics.vkApi.duration.p95 * 1000).toFixed(0)}мс
                  </div>
                </div>
              </div>

              {/* VK API Status Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">
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
                <Layers className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Очередь задач иwatchlist</h3>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600" />
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Всего задач
                  </span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-slate-100">
                    {metrics.tasks.total}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Активные авторы
                  </span>
                  <div className="text-3xl font-bold font-mono tracking-tight text-slate-100">
                    {metrics.watchlist.activeAuthors}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono block">
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
        <button
          onClick={() => setSystemOpen(!systemOpen)}
          className="flex w-full items-center justify-between px-5 py-4 hover:bg-background-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-300">
              Системные ресурсы & Аппаратная среда
            </span>
          </div>
          {systemOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {systemOpen && (
          <div className="border-t border-border/60 bg-background-secondary/20 p-5 space-y-4 animate-in slide-in-from-top-1 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Memory panel */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Выделение оперативной памяти
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Heap Used (занято в куче):</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {metrics.system.memory.heapUsed.toFixed(2)} МБ
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Heap Total (всего в куче):</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {metrics.system.memory.heapTotal.toFixed(2)} МБ
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-850 pt-2 font-semibold">
                    <span className="text-slate-300">Resident Set Size (RSS):</span>
                    <span className="font-mono text-primary">
                      {metrics.system.memory.rss.toFixed(2)} МБ
                    </span>
                  </div>
                </div>
              </div>

              {/* CPU panel */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Процессорное время CPU
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">User Time (пользовательский режим):</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {metrics.system.cpu.user.toFixed(3)}с
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">System Time (системный режим):</span>
                    <span className="font-mono text-slate-200 font-medium">
                      {metrics.system.cpu.system.toFixed(3)}с
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-slate-850 pt-2 font-semibold">
                    <span className="text-slate-300">Суммарное время загрузки:</span>
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
    </div>
  )
}

export default MetricsPage
