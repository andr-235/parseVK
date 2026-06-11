import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useKeyPress } from '../../../shared/hooks/useKeyPress'
import { useFocusTrap } from '../../../shared/hooks/useFocusTrap'
import { Input, Button, Select } from '../../../components/ui'
import type { MonitoringGroup, Messenger } from '../../../types/monitoring'

type Props = {
  group: MonitoringGroup | null
  onSave: (data: { name: string; chatId: string; messenger: Messenger; category: string }) => void
  onClose: () => void
  isLoading: boolean
}

const MESSENGER_OPTIONS = ['whatsapp', 'max'] as const

export function MonitoringGroupForm({ group, onSave, onClose, isLoading }: Props) {
  const isEdit = !!group
  useKeyPress('Escape', onClose)
  const formRef = useFocusTrap(true)

  const [name, setName] = useState('')
  const [chatId, setChatId] = useState('')
  const [messenger, setMessenger] = useState<Messenger>('whatsapp')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (group) {
      setName(group.name)
      setChatId(group.chatId)
      setMessenger(group.messenger)
      setCategory(group.category ?? '')
    } else {
      setName('')
      setChatId('')
      setMessenger('whatsapp')
      setCategory('')
    }
  }, [group])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !chatId.trim()) return
    onSave({ name: name.trim(), chatId: chatId.trim(), messenger, category: category.trim() })
  }

  const isValid = name.trim().length > 0 && chatId.trim().length > 0

  return (
    <aside
      ref={formRef}
      role="complementary"
      aria-label={isEdit ? 'Редактировать группу' : 'Добавить группу'}
      className="fixed inset-0 z-50 flex flex-col border-l border-border bg-bg-sidebar animate-slide-in-right md:static md:z-auto md:w-80 md:shrink-0 md:animate-none"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">
          {isEdit ? 'Редактировать' : 'Добавить группу'}
        </h2>
        <Button variant="icon" semantic="default" onClick={onClose} aria-label="Закрыть">
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="gf-name" className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Название
            </label>
            <Input
              id="gf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название чата или группы"
              required
            />
          </div>
          <div>
            <label htmlFor="gf-chatId" className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              ID чата
            </label>
            <Input
              id="gf-chatId"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="ID во внешней системе"
              required
            />
          </div>
          <div>
            <label htmlFor="gf-messenger" className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Мессенджер
            </label>
            <Select
              id="gf-messenger"
              value={messenger}
              options={MESSENGER_OPTIONS}
              onChange={(v) => setMessenger(v)}
              label="Мессенджер"
            />
          </div>
          <div>
            <label htmlFor="gf-category" className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-muted">
              Категория
            </label>
            <Input
              id="gf-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Например: работа, личное"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="primary" size="sm" type="submit" disabled={!isValid || isLoading}>
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
        </div>
      </form>
    </aside>
  )
}
