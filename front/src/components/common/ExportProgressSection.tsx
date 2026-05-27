import CircularProgress from '@/components/common/CircularProgress'
import { Card } from '@/components/ui/card'
import type { JobLogEntry } from '@/hooks/common/useExportJobStream'
import {
  LOG_LEVEL_CLASSES,
  LOG_LEVEL_LABELS,
  formatLogTime,
  truncateValue,
  formatCellValue,
} from '@/utils/common/exportUtils'

interface ExportProgressSectionProps {
  jobProgress: { fetchedCount: number; totalCount: number }
  progressLabel: string
  isProgressIndeterminate: boolean
  jobWarning: string | null
  jobError: string | null
  jobLogs: JobLogEntry[]
}

export const ExportProgressSection = ({
  jobProgress,
  progressLabel,
  isProgressIndeterminate,
  jobWarning,
  jobError,
  jobLogs,
}: ExportProgressSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="font-monitoring-display text-2xl font-semibold text-text-light">
          Прогресс и логи
        </h2>
        <div className="h-px flex-1 bg-border/40" />
      </div>

      <Card className="border border-border bg-background-secondary rounded-card p-6 overflow-hidden relative">
        <p className="text-sm text-text-secondary mb-6">Состояние текущего экспорта и события.</p>
        <div className="space-y-5">
          <div className="space-y-3">
            <span className="text-sm text-text-secondary">Статус:</span>
            <CircularProgress
              current={jobProgress.fetchedCount}
              total={jobProgress.totalCount}
              label={progressLabel}
              indeterminate={isProgressIndeterminate}
            />
          </div>

          {jobWarning && (
            <div className="rounded-lg border border-accent-warning/40 bg-accent-warning/10 px-4 py-3 text-sm text-accent-warning">
              <span className="font-semibold">Внимание:</span> {jobWarning}
            </div>
          )}
          {jobError && (
            <div className="rounded-lg border border-accent-danger/40 bg-accent-danger/10 px-4 py-3 text-sm text-accent-danger">
              {jobError}
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-semibold uppercase tracking-wider text-text-secondary font-monitoring-body">
              Последние логи
            </div>
            {jobLogs.length === 0 ? (
              <div className="max-h-72 overflow-auto rounded-lg border border-border bg-background-primary px-4 py-6 text-center text-sm text-text-secondary">
                Логи появятся после запуска экспорта.
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-border bg-background-primary p-4 font-mono-accent text-xs">
                {jobLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className={`shrink-0 font-semibold ${LOG_LEVEL_CLASSES[log.level]}`}>
                        {LOG_LEVEL_LABELS[log.level]}
                      </span>
                      <span className="text-text-primary">{log.message}</span>
                      {log.createdAt && (
                        <span className="text-[10px] text-text-secondary">
                          {formatLogTime(log.createdAt)}
                        </span>
                      )}
                    </div>
                    {log.meta !== undefined && (
                      <div className="text-[10px] text-text-secondary pl-4 break-all">
                        {truncateValue(formatCellValue(log.meta), 140)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
