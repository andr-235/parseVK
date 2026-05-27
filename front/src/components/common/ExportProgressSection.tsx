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
        <h2 className="font-monitoring-display text-2xl font-semibold text-white">
          Прогресс и логи
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      <Card className="border border-white/10 bg-[#131316]/90 backdrop-blur-2xl p-6 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <p className="text-sm text-slate-400 mb-6">Состояние текущего экспорта и события.</p>
        <div className="space-y-5">
          <div className="space-y-3">
            <span className="text-sm text-slate-400">Статус:</span>
            <CircularProgress
              current={jobProgress.fetchedCount}
              total={jobProgress.totalCount}
              label={progressLabel}
              indeterminate={isProgressIndeterminate}
            />
          </div>

          {jobWarning && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              <span className="font-medium">Внимание:</span> {jobWarning}
            </div>
          )}
          {jobError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {jobError}
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-400">Последние логи</div>
            {jobLogs.length === 0 ? (
              <div className="max-h-72 overflow-auto rounded-lg border border-white/10 bg-slate-800/30 px-4 py-6 text-center text-sm text-slate-400">
                Логи появятся после запуска экспорта.
              </div>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto rounded-lg border border-white/10 bg-slate-800/30 p-4">
                {jobLogs.map((log) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                      <span
                        className={`shrink-0 font-semibold ${LOG_LEVEL_CLASSES[log.level]}`}
                      >
                        {LOG_LEVEL_LABELS[log.level]}
                      </span>
                      <span className="text-white">{log.message}</span>
                      {log.createdAt && (
                        <span className="text-xs text-slate-500">
                          {formatLogTime(log.createdAt)}
                        </span>
                      )}
                    </div>
                    {log.meta !== undefined && (
                      <div className="text-xs text-slate-500">
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
