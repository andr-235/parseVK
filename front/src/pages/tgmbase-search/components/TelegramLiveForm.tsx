import { useState } from 'react'
import { Radio } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { TelegramDialog } from '../../../shared/api/telegram'

interface TelegramLiveFormProps {
  onSubmit: (target: string) => void
  dialogs: TelegramDialog[]
}

export function TelegramLiveForm({ onSubmit, dialogs }: TelegramLiveFormProps) {
  const [selectedDialog, setSelectedDialog] = useState('ALL')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(selectedDialog)
  }

  return (
    <div className="rounded-lg border border-border bg-bg-panel p-4 space-y-4">
      <div className="flex gap-4 border-b border-border pb-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <Radio size={14} className="animate-pulse" />
          Параметры прямого эфира Telegram (tgmbase)
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-end gap-3">
          <div className="flex-1 space-y-1.5 w-full">
            <label htmlFor="telegram-dialog" className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
              Выберите чат / канал для прослушивания
            </label>
            <select
              id="telegram-dialog"
              value={selectedDialog}
              onChange={(e) => setSelectedDialog(e.target.value)}
              className="flex h-8 w-full items-center justify-between rounded-md border border-border bg-bg-main px-3 text-sm text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="ALL">Все доступные диалоги аккаунта в реальном времени</option>
              {dialogs.map(d => (
                <option key={d.id} value={String(d.id)}>
                  {d.title} ({d.type === 'channel' ? 'Канал' : 'Группа'}{d.username !== '—' ? `, ${d.username}` : ''})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              semantic="default"
              size="sm"
              icon={<Radio size={14} />}
            >
              Запустить эфир
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
