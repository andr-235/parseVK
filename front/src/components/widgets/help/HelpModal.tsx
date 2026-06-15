import { useEffect, useRef } from 'react'
import { X, Keyboard, ShieldAlert, CheckCircle, Clock } from 'lucide-react'
import { Button } from '../../ui'

type HelpModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the close button when modal opens for accessibility
      closeButtonRef.current?.focus()

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-lg border border-border bg-bg-panel p-6 shadow-none animate-fade-in focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 text-text-primary">
            <Keyboard size={20} className="text-accent" />
            <h2 id="help-modal-title" className="text-lg font-semibold">
              Справка и горячие клавиши
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-md p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors duration-150"
            aria-label="Закрыть справку"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm">
          {/* Section 1: Keyboard Shortcuts */}
          <div>
            <h3 className="mb-3 font-semibold text-text-primary uppercase tracking-wider text-xs text-text-muted">
              Управление в таблице комментариев
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between border-b border-border/50 py-1.5 pr-2">
                <span className="text-text-secondary">Следующий комментарий</span>
                <kbd className="rounded border border-border bg-bg-main px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary shadow-none">
                  ↓ / ArrowDown
                </kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 py-1.5 pr-2">
                <span className="text-text-secondary">Предыдущий комментарий</span>
                <kbd className="rounded border border-border bg-bg-main px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary shadow-none">
                  ↑ / ArrowUp
                </kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 py-1.5 pr-2">
                <span className="text-text-secondary">Выбрать/снять выбор (чекбокс)</span>
                <kbd className="rounded border border-border bg-bg-main px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary shadow-none">
                  Пробел / Space
                </kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 py-1.5 pr-2">
                <span className="text-text-secondary">Пометить как «Чисто»</span>
                <kbd className="rounded border border-border bg-bg-main px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary shadow-none">
                  C
                </kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 py-1.5 pr-2">
                <span className="text-text-secondary">Пометить как «Нарушение»</span>
                <kbd className="rounded border border-border bg-bg-main px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary shadow-none">
                  V
                </kbd>
              </div>
              <div className="flex items-center justify-between border-b border-border/50 py-1.5 pr-2">
                <span className="text-text-secondary">Пометить как «Проверка»</span>
                <kbd className="rounded border border-border bg-bg-main px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary shadow-none">
                  R
                </kbd>
              </div>
            </div>
          </div>

          {/* Section 2: Status Meanings */}
          <div>
            <h3 className="mb-3 font-semibold text-text-primary uppercase tracking-wider text-xs text-text-muted">
              Значения статусов
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-success-soft text-success">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <span className="font-medium text-text-primary">Чисто</span> — комментарий обработан оператором, признаков противоправных высказываний не обнаружено.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-danger-soft text-danger">
                  <ShieldAlert size={14} />
                </div>
                <div>
                  <span className="font-medium text-text-primary">Нарушение</span> — в тексте обнаружено нарушение (экстремизм, разжигание ненависти, спам и др.).
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-warning-soft text-warning">
                  <Clock size={14} />
                </div>
                <div>
                  <span className="font-medium text-text-primary">Проверка</span> — спорный комментарий, требующий дополнительного рассмотрения администратором или коллегами.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Extra Tips */}
          <div className="rounded-md border border-border bg-bg-main/50 p-3.5">
            <h4 className="mb-1.5 font-semibold text-text-primary">Полезные советы по работе с интерфейсом</h4>
            <ul className="list-disc space-y-1.5 pl-4 text-text-secondary">
              <li>
                <strong>Детальный просмотр:</strong> Кликните по строке с комментарием в таблице, чтобы открыть боковую панель с полными метаданными, связями автора и текстом.
              </li>
              <li>
                <strong>Пакетные операции:</strong> Выберите несколько строк с помощью чекбоксов слева, чтобы применить статус ко всем выбранным элементам одновременно.
              </li>
              <li>
                <strong>Быстрая отмена:</strong> При случайном изменении статуса воспользуйтесь всплывающей панелью <em>«Отменить действие»</em> внизу экрана.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <Button variant="primary" size="md" onClick={onClose}>
            Понятно
          </Button>
        </div>
      </div>
    </div>
  )
}
