import { X, CheckCircle, Flag, ExternalLink, Bookmark } from 'lucide-react'
import { useKeyPress } from '../../../../shared/hooks/useKeyPress'
import { useFocusTrap } from '../../../../shared/hooks/useFocusTrap'
import { Button } from '../../../ui'
import { statusColors } from '../../../../types/comments'
import type { Comment } from '../../../../types/comments'

export type Props = {
  comment: Comment | null
  onClose: () => void
  onAddToWatchlist?: () => void
  isAddingToWatchlist?: boolean
}

export function CommentDetail({ comment, onClose, onAddToWatchlist, isAddingToWatchlist }: Props) {
  useKeyPress('Escape', onClose, !!comment)
  const detailRef = useFocusTrap(!!comment)

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
      ref={detailRef}
      role="complementary"
      aria-label={`Детали комментария #${comment.id}`}
      className="fixed inset-0 z-50 flex flex-col border-l border-border bg-bg-sidebar animate-slide-in-right md:static md:z-auto md:w-80 md:shrink-0 md:animate-none"
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
            {comment.groupUrl ? (
              <a href={comment.groupUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-accent underline decoration-transparent hover:decoration-accent transition-colors duration-150">
                {comment.group}
              </a>
            ) : (
              <p className="text-sm text-text-secondary">{comment.group}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              Автор
            </p>
            {comment.authorUrl ? (
              <a href={comment.authorUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-accent underline decoration-transparent hover:decoration-accent transition-colors duration-150">
                {comment.author}
              </a>
            ) : (
              <p className="text-sm text-text-secondary">{comment.author}</p>
            )}
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
        <div className="flex gap-2 pt-2 flex-wrap">
          <Button variant="primary" semantic="success" size="sm" aria-label="Отметить как чисто" icon={<CheckCircle size={14} />}>
            Чисто
          </Button>
          <Button variant="primary" semantic="danger" size="sm" aria-label="Отметить как нарушение" icon={<Flag size={14} />}>
            Нарушение
          </Button>
          {onAddToWatchlist && (
            <Button
              variant="secondary"
              semantic="default"
              size="sm"
              aria-label="Взять автора на карандаш"
              title="Взять автора на карандаш"
              icon={<Bookmark size={14} />}
              onClick={onAddToWatchlist}
              disabled={isAddingToWatchlist}
            >
              {isAddingToWatchlist ? 'Добавление...' : 'На карандаш'}
            </Button>
          )}
          <Button variant="secondary" semantic="default" size="sm" aria-label="Открыть в источнике" icon={<ExternalLink size={14} />}>
            Открыть
          </Button>
        </div>
      </div>
    </aside>
  )
}
