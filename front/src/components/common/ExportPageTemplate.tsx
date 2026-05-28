import { type ReactNode, useState, useMemo, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import type { JobLogEntry } from '@/hooks/common/useExportJobStream'
import {
  LOG_LEVEL_CLASSES,
  LOG_LEVEL_LABELS,
  formatLogTime,
  truncateValue,
  formatCellValue,
} from '@/utils/common/exportUtils'
import { toast } from 'react-hot-toast'
import {
  Copy,
  Download,
  SlidersHorizontal,
  Terminal,
  Activity,
  AlertTriangle,
  XOctagon,
} from 'lucide-react'
import { PageHeader } from './PageHeader'

interface ExportPageTemplateProps {
  title: string | ReactNode
  description: string
  platformLabel: string
  platformColorClass: string // e.g. "text-accent-primary" or "text-accent-info"
  apiMethod: string // e.g. "friends.get"
  isExportLoading: boolean
  handleGenerateXlsx: () => void
  jobProgress: { fetchedCount: number; totalCount: number }
  progressLabel: string
  isProgressIndeterminate: boolean
  jobWarning: string | null
  jobError: string | null
  jobLogs: JobLogEntry[]
  children: ReactNode
  presets?: { label: string; onClick: () => void }[]
}

type LogFilter = 'ALL' | 'INFO' | 'WARNING' | 'ERROR'

export const ExportPageTemplate = ({
  title,
  description,
  platformLabel,
  platformColorClass,
  apiMethod,
  isExportLoading,
  handleGenerateXlsx,
  jobProgress,
  progressLabel,
  isProgressIndeterminate,
  jobWarning,
  jobError,
  jobLogs,
  children,
  presets = [],
}: ExportPageTemplateProps) => {
  const [logFilter, setLogFilter] = useState<LogFilter>('ALL')
  const logTerminalRef = useRef<HTMLDivElement>(null)

  // Auto-scroll logs to bottom on new log arrival
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight
    }
  }, [jobLogs])

  // Filter logs based on selection
  const filteredLogs = useMemo(() => {
    if (logFilter === 'ALL') return jobLogs
    return jobLogs.filter((log) => {
      if (logFilter === 'INFO') return log.level === 'info'
      if (logFilter === 'WARNING') return log.level === 'warn'
      if (logFilter === 'ERROR') return log.level === 'error'
      return true
    })
  }, [jobLogs, logFilter])

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    if (jobLogs.length === 0) return
    const logsText = jobLogs
      .map(
        (log) =>
          `[${log.level.toUpperCase()}] ${log.message} ${
            log.createdAt ? `(${new Date(log.createdAt).toLocaleTimeString()})` : ''
          }`
      )
      .join('\n')
    navigator.clipboard.writeText(logsText)
    toast.success('Логи успешно скопированы в буфер обмена')
  }

  // Calculate percentage progress
  const progressPercent = useMemo(() => {
    if (isProgressIndeterminate || jobProgress.totalCount === 0) return 0
    return Math.min(Math.round((jobProgress.fetchedCount / jobProgress.totalCount) * 100), 100)
  }, [jobProgress, isProgressIndeterminate])

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 font-monitoring-body animate-in fade-in-0 duration-700">
      {/* High-density Console Page Header */}
      <PageHeader
        title={title}
        description={description}
        platformLabel={platformLabel}
        platformColorClass={platformColorClass}
        apiMethod={apiMethod}
        formatLabel="XLSX"
      />

      {/* Main Console Workspace */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Left Column: Control Panel */}
        <div className="space-y-6">
          <PageHeader title="Параметры запуска" platformColorClass="text-accent-primary" />

          <Card className="border border-border bg-background-secondary/95 rounded-card p-6 overflow-hidden relative shadow-soft-sm">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-accent-primary/5 via-transparent to-transparent opacity-30" />

            <div className="relative space-y-6 z-10">
              {/* Parameter Presets if available */}
              {presets.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body flex items-center gap-1">
                    <SlidersHorizontal className="size-3" />
                    Быстрые пресеты
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((preset, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={preset.onClick}
                        disabled={isExportLoading}
                        className="h-8 text-xs bg-background-primary border-border hover:border-accent-primary/50 transition-all duration-200 cursor-pointer"
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Input fields */}
              <div className="space-y-5">{children}</div>

              {/* Console Trigger Button */}
              <Button
                onClick={handleGenerateXlsx}
                disabled={isExportLoading}
                variant="default"
                className="w-full h-11 shadow-soft-sm font-semibold hover:shadow-soft-md transition-all duration-200 cursor-pointer text-sm tracking-wider"
              >
                {isExportLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="size-4 animate-spin" />
                    ФОРМИРОВАНИЕ XLSX...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Download className="size-4" />
                    ЗАПУСТИТЬ ЭКСПОРТ ДАННЫХ
                  </span>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Stream Panel */}
        <div className="space-y-6">
          <PageHeader title="Служба мониторинга" platformColorClass="text-accent-primary" />

          <Card className="border border-border bg-background-secondary/95 rounded-card p-6 overflow-hidden relative shadow-soft-sm flex flex-col justify-between h-full min-h-115">
            <div className="space-y-6">
              {/* Modern Linear Progress Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Activity className="size-3.5 text-accent-primary animate-pulse" />
                    Прогресс обработки
                  </span>
                  <span className="font-mono-accent text-text-primary">
                    {progressLabel}{' '}
                    {!isProgressIndeterminate &&
                      jobProgress.totalCount > 0 &&
                      `(${progressPercent}%)`}
                  </span>
                </div>

                {isProgressIndeterminate ? (
                  <div className="h-2 w-full rounded bg-background-primary overflow-hidden relative border border-border/20">
                    <div className="absolute inset-y-0 w-1/3 bg-accent-primary rounded animate-infinite-loading" />
                  </div>
                ) : (
                  <Progress
                    value={progressPercent}
                    className="h-2 bg-background-primary border border-border/20"
                  />
                )}

                <div className="flex justify-between items-center text-[11px] text-text-secondary font-mono-accent">
                  <span>Готовность экспорта</span>
                  <span>
                    {jobProgress.fetchedCount} / {jobProgress.totalCount || 'Инициализация'}
                  </span>
                </div>
              </div>

              {/* Terminal Logs Viewport */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body flex items-center gap-1">
                    <Terminal className="size-3.5" />
                    Терминал системных логов
                  </span>

                  {/* Copy logs and tools buttons */}
                  {jobLogs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLogs}
                      className="h-7 text-xs bg-background-primary px-2 border-border/60 hover:text-accent-primary transition-all duration-200 cursor-pointer"
                    >
                      <Copy className="size-3.5 mr-1" />
                      Копировать
                    </Button>
                  )}
                </div>

                {/* Logs terminal container */}
                <div className="border border-border/80 bg-background-primary rounded-lg overflow-hidden flex flex-col shadow-inner">
                  {/* Terminal Header */}
                  <div className="flex justify-between items-center bg-background-secondary border-b border-border/60 px-4 py-2 text-[10px] font-mono-accent">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent-danger/70" />
                      <span className="w-2 h-2 rounded-full bg-accent-warning/70" />
                      <span className="w-2 h-2 rounded-full bg-accent-success/70" />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex items-center gap-1.5">
                      {(['ALL', 'INFO', 'WARNING', 'ERROR'] as LogFilter[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setLogFilter(filter)}
                          className={`px-1.5 py-0.5 rounded transition-all duration-200 cursor-pointer ${
                            logFilter === filter
                              ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/30 font-semibold'
                              : 'text-text-secondary hover:text-text-primary border border-transparent'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Logs List */}
                  <div
                    ref={logTerminalRef}
                    className="h-64 space-y-2 overflow-y-auto p-4 font-mono-accent text-xs scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent scroll-smooth"
                  >
                    {filteredLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4">
                        <Terminal className="size-8 text-border mb-2 stroke-[1.5]" />
                        <span>Консоль пуста. Запустите экспорт для вывода логов.</span>
                      </div>
                    ) : (
                      filteredLogs.map((log) => (
                        <div
                          key={log.id}
                          className="space-y-0.5 leading-relaxed animate-in fade-in-0 duration-200"
                        >
                          <div className="flex items-baseline gap-x-2">
                            <span
                              className={`shrink-0 font-semibold text-[10px] uppercase border px-1 rounded ${LOG_LEVEL_CLASSES[log.level]}`}
                            >
                              {LOG_LEVEL_LABELS[log.level]}
                            </span>
                            <span className="text-text-primary flex-1 wrap-break-word">
                              {log.message}
                            </span>
                            {log.createdAt && (
                              <span className="text-[10px] text-text-secondary select-none font-medium">
                                {formatLogTime(log.createdAt)}
                              </span>
                            )}
                          </div>
                          {log.meta !== undefined && (
                            <div className="text-[10px] text-text-secondary pl-6 font-medium break-all select-all opacity-85">
                              {truncateValue(formatCellValue(log.meta), 140)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Tonal warnings and errors display */}
              {jobWarning && (
                <div className="rounded-lg border border-accent-warning/30 bg-accent-warning/5 px-4 py-3 text-sm text-accent-warning flex items-start gap-2.5 animate-in fade-in duration-300">
                  <AlertTriangle className="size-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Предупреждение:</span> {jobWarning}
                  </div>
                </div>
              )}

              {jobError && (
                <div className="rounded-lg border border-accent-danger/30 bg-accent-danger/5 px-4 py-3 text-sm text-accent-danger flex items-start gap-2.5 animate-in fade-in duration-300">
                  <XOctagon className="size-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Критический сбой:</span> {jobError}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom microstatus block */}
            <div className="mt-4 pt-4 border-t border-border/30 flex justify-between items-center text-[10px] text-text-secondary font-mono-accent">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isExportLoading ? 'bg-accent-primary animate-pulse' : 'bg-accent-success'}`}
                />
                {isExportLoading ? 'Стриминг фазы экспорта' : 'Служба экспорта активна'}
              </span>
              <span>API POLLING CHANNEL</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
