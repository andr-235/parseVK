import { X, CheckCircle, Flag, ExternalLink } from 'lucide-react'
import { useKeyPress } from '../../../../shared/hooks/useKeyPress'
import { Button } from '../../../ui'
import { statusColors } from '../../../../types/comments'
import type { Comment } from '../../../../types/comments'

export type Props = {
  comment: Comment | null
  onClose: () => void
}

export function CommentDetail({ comment, onClose }: Props) {
  useKeyPress('Escape', onClose, !!comment)

  if (!comment) {
    return (
      <aside
        role="complementary"
        aria-label="Детали комментария"
        className="hidden w-80 shrink-0 border-l border-border bg-bg-sidebar md:flex md:flex-col"
      >
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-text-muted">
          Выберите комментарий для просмотра деталей
        </div>
      </aside>
    )
  }

  return (
    <aside
      role="complementary"
      aria-label={`Детали комментария #${comment.id}`}
      className="fixed inset-0 z-50 flex flex-col border-l border-border bg-bg-sidebar md:static md:z-auto md:w-80 md:shrink-0"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">
          Комментарий #{comment.id}
        </h2>
        <Button variant="icon" semantic="default" onClick={onClose} aria-label="Закрыть панель деталей">
          <X size={16} />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
            Текст
          </p>
          <p className="text-sm leading-relaxed text-text-primary">{comment.text}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              Группа
            </p>
            <p className="text-sm text-text-secondary">{comment.group}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              Автор
            </p>
            <p className="text-sm text-text-secondary">{comment.author}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              Дата
            </p>
            <p className="text-sm text-text-secondary">{comment.date}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              Статус
            </p>
            <p className={`text-sm font-medium ${statusColors[comment.status]}`}>
              {comment.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="primary" semantic="success" size="sm" aria-label="Отметить как чисто" icon={<CheckCircle size={14} />}>
            Чисто
          </Button>
          <Button variant="primary" semantic="danger" size="sm" aria-label="Отметить как нарушение" icon={<Flag size={14} />}>
            Нарушение
          </Button>
          <Button variant="secondary" semantic="default" size="sm" aria-label="Открыть в источнике" icon={<ExternalLink size={14} />}>
            Открыть
          </Button>
        </div>
      </div>
    </aside>
  )
}
