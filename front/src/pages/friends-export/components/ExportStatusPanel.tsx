import type { RefObject } from 'react'
import { Check, X } from 'lucide-react'
import { Spinner } from '../../../components/ui/Spinner'
import type { FriendsExportStreamState } from '../../../shared/hooks/useFriendsExportStream'
import { ExportLogList } from './ExportLogList'

type ExportStatusPanelProps = {
  stream: FriendsExportStreamState
  logEndRef: RefObject<HTMLDivElement | null>
}

const statusLabel: Record<FriendsExportStreamState['status'], string> = {
  idle: 'Ожидание запуска',
  connecting: 'Подключение',
  running: 'Выполняется',
  done: 'Экспорт завершён',
  error: 'Ошибка экспорта',
}

const statusClassName: Record<FriendsExportStreamState['status'], string> = {
  idle: 'border-border text-text-muted',
  connecting: 'border-accent/30 bg-accent-soft text-accent',
  running: 'border-accent/30 bg-accent-soft text-accent',
  done: 'border-success/30 bg-success-soft text-success',
  error: 'border-danger/30 bg-danger-soft text-danger',
}

export function ExportStatusPanel({ stream, logEndRef }: ExportStatusPanelProps) {
  const progressPct = stream.progress.totalCount > 0
    ? Math.round((stream.progress.fetchedCount / stream.progress.totalCount) * 100)
    : 0
  const isActive = stream.status === 'running' || stream.status === 'connecting'

  return (
    <section className="rounded-lg border border-border bg-bg-panel">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-text-primary">Статус выполнения</h2>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            {isActive && <Spinner size={14} />}
            {stream.status === 'done' && <Check size={16} className="text-success" aria-hidden="true" />}
            {stream.status === 'error' && <X size={16} className="text-danger" aria-hidden="true" />}
            <span>{statusLabel[stream.status]}</span>
          </div>
          <span className={`rounded-md border px-2 py-1 text-xs font-medium uppercase tracking-wide ${statusClassName[stream.status]}`}>
            {stream.status}
          </span>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-xs text-text-muted">
            <span>Прогресс</span>
            <span className="font-mono">
              {stream.progress.fetchedCount} / {stream.progress.totalCount}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bg-main" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}>
            <div className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {stream.status === 'error' && (
          <div className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            {stream.error || 'Не удалось выполнить экспорт'}
          </div>
        )}

        <ExportLogList logs={stream.logs} endRef={logEndRef} />
      </div>
    </section>
  )
}
