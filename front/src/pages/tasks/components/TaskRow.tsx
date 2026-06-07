import { memo } from 'react'
import { Trash2, RefreshCw, Play, AlertCircle, Loader2, XCircle } from 'lucide-react'
import { Button, ConfirmAction } from '../../../components/ui'
import type { Task } from '../../../shared/api/tasks'
import { relativeTime } from '../../../shared/utils/time'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание',
  running: 'Выполняется',
  done: 'Готово',
  failed: 'Ошибка',
  cancelled: 'Отменена',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning-soft text-warning',
  running: 'bg-accent-soft text-accent',
  done: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
  cancelled: 'bg-bg-hover text-text-muted',
}

const MODE_LABELS: Record<string, string> = {
  recent_posts: 'Свежие посты',
  recheck_group: 'Перепроверка',
}

type Props = {
  task: Task
  isFocused: boolean
  onResume: (id: number) => void
  onCheck: (id: number) => void
  onCancel: (id: number) => void
  onDelete: (id: number) => void
  onConfirmDelete: (id: number) => void
  onCancelDelete: () => void
  confirmDeleteId: number | null
  isDeleting: boolean
  actingId: number | null
  selected: boolean
  onToggleSelect: (id: number) => void
}

export const TaskRow = memo(function TaskRow({
  task,
  isFocused,
  onResume,
  onCheck,
  onCancel,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  confirmDeleteId,
  isDeleting,
  actingId,
  selected,
  onToggleSelect,
}: Props) {
  const isConfirming = confirmDeleteId === task.id
  const showProgress = task.totalItems > 0 && (task.status === 'running' || task.status === 'done' || task.status === 'failed')
  const progressPct = showProgress ? Math.round((task.processedItems / task.totalItems) * 100) : 0
  const progressBarColor = task.status === 'done' ? 'bg-success' : task.status === 'failed' ? 'bg-danger' : 'bg-accent'

  return (
    <tr className={`border-b border-border last:border-0 transition-colors duration-150 ${
      isFocused
        ? 'bg-bg-hover ring-1 ring-inset ring-accent/20'
        : selected ? 'bg-accent-soft' : 'hover:bg-bg-hover'
    }`}>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(task.id)}
          aria-label={`Выбрать задачу #${task.id}`}
          className="h-4 w-4 accent-accent cursor-pointer"
        />
      </td>
      <td className="px-3 py-2 font-mono text-xs text-text-secondary tabular-nums">
        #{task.id}
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] || ''}`}
        >
          {task.status === 'failed' && <AlertCircle size={10} aria-hidden="true" />}
          {task.status === 'running' && <Loader2 size={10} className="animate-spin" aria-hidden="true" />}
          {STATUS_LABELS[task.status] || task.status}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary">
        {task.mode ? (MODE_LABELS[task.mode] || task.mode) : '—'}
      </td>
      <td className="px-3 py-2">
        {task.status === 'failed' && task.error ? (
          <span className="text-xs text-danger line-clamp-2 max-w-[200px]">
            Ошибка: {task.error}
          </span>
        ) : showProgress ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-full max-w-[80px] rounded-full bg-bg-hover overflow-hidden">
              <div
                role="progressbar"
                aria-valuenow={task.processedItems}
                aria-valuemin={0}
                aria-valuemax={task.totalItems}
                className={`h-full w-full origin-left rounded-full transition-transform duration-300 ${progressBarColor}`}
                style={{ transform: `scaleX(${Math.min(progressPct, 100) / 100})` }}
              />
            </div>
            <span className="text-xs text-text-muted tabular-nums whitespace-nowrap">
              {task.processedItems}/{task.totalItems}
            </span>
          </div>
        ) : task.status === 'pending' ? (
          <span className="text-xs text-text-muted">В очереди…</span>
        ) : task.status === 'running' ? (
          <span className="inline-flex items-center gap-1 text-xs text-accent">
            <Loader2 size={10} className="animate-spin" aria-hidden="true" />
            Выполняется…
          </span>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary tabular-nums">
        {task.postLimit ?? '—'}
      </td>
      <td className="px-3 py-2 text-sm text-text-secondary tabular-nums whitespace-nowrap" title={new Date(task.createdAt).toLocaleString('ru-RU')}>
        {relativeTime(task.createdAt)}
      </td>
      <td className="px-3 py-2">
        {isConfirming ? (
          <ConfirmAction
            onConfirm={() => onDelete(task.id)}
            onCancel={onCancelDelete}
            isLoading={isDeleting}
            showIcon
          />
        ) : (
          <div className="flex items-center gap-1">
            {task.status === 'failed' && (
              <Button
                variant="ghost" size="xs" semantic="default"
                className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
                onClick={() => onResume(task.id)}
                disabled={actingId === task.id}
                aria-label="Повторить"
                icon={<RefreshCw size={13} />}
              >
                Повтор
              </Button>
            )}
            {task.status === 'pending' && (
              <Button
                variant="ghost" size="xs" semantic="default"
                className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
                onClick={() => onCheck(task.id)}
                disabled={actingId === task.id}
                aria-label="Проверить статус"
                icon={<Play size={13} />}
              >
                Проверить
              </Button>
            )}
            {task.status === 'running' && (
              <Button
                variant="ghost" size="xs" semantic="danger"
                className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
                onClick={() => onCancel(task.id)}
                disabled={actingId === task.id}
                aria-label="Остановить задачу"
                icon={<XCircle size={13} />}
              >
                Остановить
              </Button>
            )}
            <Button
              variant="ghost" size="xs" semantic="danger"
              className="max-sm:min-h-[44px] max-sm:min-w-[44px]"
              onClick={() => onConfirmDelete(task.id)}
              disabled={isDeleting}
              aria-label={`Удалить задачу #${task.id}`}
              icon={<Trash2 size={13} />}
            >
              Удалить
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
})
