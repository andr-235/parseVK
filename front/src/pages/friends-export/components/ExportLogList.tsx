import type { RefObject } from 'react'
import type { SseEvent } from '../../../shared/api/friends-export-types'

type ExportLogListProps = {
  logs: SseEvent[]
  endRef: RefObject<HTMLDivElement | null>
}

const getLogClassName = (level: string) => {
  if (level === 'error') return 'text-danger'
  if (level === 'warn') return 'text-warning'
  return 'text-text-secondary'
}

export function ExportLogList({ logs, endRef }: ExportLogListProps) {
  const logEvents = logs.filter((event) => event.type === 'log')

  if (logEvents.length === 0) {
    return (
      <div className="rounded-md border border-border bg-bg-main p-4 text-sm text-text-muted" role="region" aria-label="Лог экспорта">
        Лог появится после запуска задачи.
      </div>
    )
  }

  return (
    <details className="rounded-md border border-border bg-bg-main" open>
      <summary className="cursor-pointer select-none px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-muted transition-colors duration-150 hover:text-text-secondary">
        Лог выполнения · {logEvents.length}
      </summary>
      <div className="max-h-56 space-y-1 overflow-y-auto border-t border-border px-4 py-3 font-mono text-xs leading-relaxed">
        {logEvents.map((event, index) => (
          <div key={index} className={getLogClassName(event.data.level)}>
            {event.data.message}
          </div>
        ))}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </details>
  )
}
