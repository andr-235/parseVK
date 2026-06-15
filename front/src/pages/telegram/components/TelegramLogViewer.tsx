import { useEffect, useRef } from 'react'
import { Terminal, X, User } from 'lucide-react'
import type { TelegramExportTask } from '../types'
import { formatDateTime } from '../../../shared/utils/time'

interface TelegramLogViewerProps {
  task: TelegramExportTask
  onClose: () => void
}

export function TelegramLogViewer({ task, onClose }: TelegramLogViewerProps) {
  const consoleEndRef = useRef<HTMLDivElement>(null)

  // Автопрокрутка консоли логов при обновлении массива логов
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [task.logs])

  return (
    <div className="w-full lg:w-[400px] rounded-lg border border-border bg-bg-panel flex flex-col overflow-hidden shrink-0 animate-fade-in">
      <div className="border-b border-border bg-bg-sidebar px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-text-primary font-semibold text-sm">
          <Terminal size={14} className="text-accent" />
          <span>Лог задачи: {task.target}</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          aria-label="Закрыть логи"
        >
          <X size={14} />
        </button>
      </div>

      {/* Консольный вывод логов */}
      <div className="flex-1 bg-black p-4 font-mono text-xs text-green-400 overflow-y-auto max-h-[300px] lg:max-h-none h-[250px] lg:h-auto select-text">
        <div className="space-y-1.5">
          {task.logs.map((log, idx) => {
            let textClass = 'text-green-400'
            if (log.includes('[SUCCESS]')) textClass = 'text-emerald-400 font-medium'
            if (log.includes('[WARNING]')) textClass = 'text-amber-400'
            if (log.includes('[ERROR]')) textClass = 'text-rose-400 font-bold'
            return (
              <div key={idx} className={textClass}>
                {log}
              </div>
            )
          })}
          <div ref={consoleEndRef} />
        </div>
      </div>
      
      <div className="border-t border-border bg-bg-sidebar p-3 flex justify-between items-center text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <User size={12} />
          Статус: <strong className="text-text-secondary font-medium">{task.status.toUpperCase()}</strong>
        </span>
        <span className="tabular-nums">
          Создана: {formatDateTime(task.createdAt)}
        </span>
      </div>
    </div>
  )
}
