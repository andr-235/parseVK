import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  RefreshCw,
  Trash2,
  Database
} from 'lucide-react'
import { Button } from '../../../components/ui'
import type { TelegramExportTask } from '../types'
import { relativeTime } from '../../../shared/utils/time'

interface TelegramTaskTableProps {
  tasks: TelegramExportTask[]
  selectedTaskId: string | null
  onSelectTask: (id: string) => void
  onDownload: (task: TelegramExportTask, e: React.MouseEvent) => void
  onCancel: (id: string, e: React.MouseEvent) => void
  onRetry: (id: string, e: React.MouseEvent) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

export function TelegramTaskTable({
  tasks,
  selectedTaskId,
  onSelectTask,
  onDownload,
  onCancel,
  onRetry,
  onDelete
}: TelegramTaskTableProps) {
  
  const getStatusBadge = (task: TelegramExportTask) => {
    const status = task.status
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-sm bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">
            <Clock size={10} />
            Ожидание
          </span>
        )
      case 'running':
        return (
          <span className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium ${
            task.taskType === 'live_parse' ? 'bg-success-soft text-success' : 'bg-accent-soft text-accent'
          }`}>
            {task.taskType === 'live_parse' ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                В эфире
              </>
            ) : (
              <>
                <Loader2 size={10} className="animate-spin" />
                Выгружается
              </>
            )}
          </span>
        )
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 rounded-sm bg-success-soft px-1.5 py-0.5 text-xs font-medium text-success">
            <CheckCircle2 size={10} />
            {task.taskType === 'live_parse' ? 'Завершен' : 'Готово'}
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-sm bg-danger-soft px-1.5 py-0.5 text-xs font-medium text-danger">
            <AlertCircle size={10} />
            Ошибка
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-sm bg-bg-hover px-1.5 py-0.5 text-xs font-medium text-text-muted">
            <X size={10} />
            Остановлена
          </span>
        )
    }
  }

  return (
    <div className="flex-1 rounded-lg border border-border bg-bg-panel flex flex-col overflow-hidden">
      <div className="border-b border-border bg-bg-sidebar px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Активные и завершенные задачи</h3>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <Database size={32} className="text-text-muted mb-2" />
          <p className="text-sm font-medium text-text-secondary">Нет активных задач выгрузки</p>
          <p className="text-xs text-text-muted mt-1">
            Введите ссылку на группу в форме выше, чтобы начать парсинг.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-sidebar text-xs font-medium uppercase tracking-wider text-text-muted">
                <th className="px-4 py-2.5 w-16">ID</th>
                <th className="px-4 py-2.5">Telegram-чат</th>
                <th className="px-4 py-2.5 w-32">Статус</th>
                <th className="px-4 py-2.5 w-44">Прогресс</th>
                <th className="px-4 py-2.5 w-32">Создана</th>
                <th className="px-4 py-2.5 w-24">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => {
                const isSelected = selectedTaskId === task.id
                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task.id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected ? 'bg-accent-soft' : 'hover:bg-bg-hover'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {task.id.slice(-6)}
                    </td>
                    <td className="px-4 py-3 max-w-[250px]">
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary truncate" title={task.target}>
                          {task.target}
                        </span>
                        <span className="text-[10px] text-text-muted mt-0.5">
                          {task.taskType === 'live_parse' ? 'Прямой эфир (tgmbase)' : 'Деанонимизация (telegram dl)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(task)}
                    </td>
                    <td className="px-4 py-3">
                      {task.taskType === 'live_parse' ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                            <span>Сообщений: {task.fetchedCount}</span>
                            {task.status === 'running' && (
                              <span className="flex items-center gap-1 text-[10px] text-success font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                task.status === 'running' ? 'bg-success' : 'bg-text-muted'
                              }`}
                              style={{ width: '100%' }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-text-muted font-mono">
                            <span>{task.fetchedCount} / {task.totalCount}</span>
                            <span>{task.progress}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                task.status === 'done' ? 'bg-success' : task.status === 'failed' ? 'bg-danger' : 'bg-accent'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary tabular-nums" title={new Date(task.createdAt).toLocaleString('ru-RU')}>
                      {relativeTime(task.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {task.status === 'done' && task.taskType !== 'live_parse' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => onDownload(task, e)}
                            icon={<Download size={13} />}
                            aria-label="Скачать XLSX результаты"
                          />
                        )}
                        {task.status === 'running' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            semantic="danger"
                            onClick={(e) => onCancel(task.id, e)}
                            icon={<X size={13} />}
                            aria-label="Остановить"
                          />
                        )}
                        {(task.status === 'failed' || task.status === 'cancelled') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => onRetry(task.id, e)}
                            icon={<RefreshCw size={13} />}
                            aria-label="Повторить"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="xs"
                          semantic="danger"
                          onClick={(e) => onDelete(task.id, e)}
                          icon={<Trash2 size={13} />}
                          aria-label="Удалить задачу"
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
