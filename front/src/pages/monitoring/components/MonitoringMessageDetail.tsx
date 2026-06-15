import { X, ExternalLink } from 'lucide-react'
import { useKeyPress } from '../../../shared/hooks/useKeyPress'
import { useFocusTrap } from '../../../shared/hooks/useFocusTrap'
import { Button } from '../../../components/ui'
import { formatDateTime } from '../../../shared/utils/time'
import type { MonitorMessage } from '../../../types/monitoring'

type Props = {
  message: MonitorMessage | null
  onClose: () => void
}

const messengerLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  max: 'Max',
}

export function MonitoringMessageDetail({ message, onClose }: Props) {
  useKeyPress('Escape', onClose, !!message)
  const detailRef = useFocusTrap(!!message)

  if (!message) {
    return (
      <aside
        role="complementary"
        aria-label="Детали сообщения"
        className="hidden w-80 shrink-0 border-l border-border bg-bg-sidebar md:flex md:flex-col"
      >
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-text-muted">
          Выберите сообщение для просмотра деталей
        </div>
      </aside>
    )
  }

  return (
    <aside
      ref={detailRef}
      role="complementary"
      aria-label="Детали сообщения"
      className="fixed inset-0 z-50 flex flex-col border-l border-border bg-bg-sidebar animate-slide-in-right md:static md:z-auto md:w-80 md:shrink-0 md:animate-none"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">
          Сообщение
        </h2>
        <Button variant="icon" semantic="default" onClick={onClose} aria-label="Закрыть панель деталей">
          <X size={16} />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {message.text && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
              Текст
            </p>
            <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
              {message.text}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {message.chat && (
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
                Чат
              </p>
              <p className="text-sm text-text-secondary">{message.chat}</p>
            </div>
          )}
          {message.author && (
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
                Автор
              </p>
              <p className="text-sm text-text-secondary">{message.author}</p>
            </div>
          )}
          {message.createdAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
                Дата
              </p>
              <p className="text-sm text-text-secondary">{formatDateTime(message.createdAt)}</p>
            </div>
          )}
          {message.source && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
                Источник
              </p>
              <p className="text-sm text-text-secondary">{messengerLabels[message.source] ?? message.source}</p>
            </div>
          )}
        </div>
        {message.contentUrl && (
          <div className="pt-2">
            <a
              href={message.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="secondary" size="sm" semantic="default" icon={<ExternalLink size={14} />}>
                Открыть в источнике
              </Button>
            </a>
          </div>
        )}
      </div>
    </aside>
  )
}
