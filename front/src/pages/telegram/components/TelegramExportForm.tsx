import { useState } from 'react'
import { Send, Settings, Radio, Users } from 'lucide-react'
import { Button, Input } from '../../../components/ui'
import type { LimitOption } from '../types'
import type { TelegramDialog } from '../../../shared/api/telegram'

interface TelegramExportFormProps {
  onSubmit: (target: string, limit: number, activeOnly: boolean, verifyPhones: boolean) => void
  onLiveParseSubmit: (target: string) => void
  dialogs: TelegramDialog[]
}

const LIMIT_OPTIONS: LimitOption[] = [
  { label: '100 участников', value: 100 },
  { label: '500 участников', value: 500 },
  { label: '1000 участников', value: 1000 },
  { label: '5000 участников', value: 5000 },
  { label: 'Все участники (без лимита)', value: 1000000 }
]

export function TelegramExportForm({ onSubmit, onLiveParseSubmit, dialogs }: TelegramExportFormProps) {
  const [mode, setMode] = useState<'export' | 'live'>('export')
  
  // Member export settings
  const [target, setTarget] = useState('')
  const [limit, setLimit] = useState(500)
  const [activeOnly, setActiveOnly] = useState(false)
  const [verifyPhones, setVerifyPhones] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Live parse settings
  const [selectedDialog, setSelectedDialog] = useState('ALL')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'export') {
      if (!target.trim()) return
      onSubmit(target, limit, activeOnly, verifyPhones)
      setTarget('')
    } else {
      onLiveParseSubmit(selectedDialog)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-bg-panel p-4 space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-4 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setMode('export')}
          className={`flex items-center gap-2 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            mode === 'export'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users size={14} />
          Выгрузка участников
        </button>
        <button
          type="button"
          onClick={() => setMode('live')}
          className={`flex items-center gap-2 pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
            mode === 'live'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Radio size={14} className={mode === 'live' ? 'animate-pulse' : ''} />
          Прямой эфир (Парсинг сообщений)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'export' ? (
          <div className="flex flex-col md:flex-row items-end gap-3">
            <div className="flex-1 space-y-1.5 w-full">
              <label htmlFor="telegram-target" className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Ссылка, username или ID группы
              </label>
              <div className="relative">
                <Input
                  id="telegram-target"
                  type="text"
                  required
                  placeholder="Например: @group_name, https://t.me/group_name или -100123456789"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full pl-3 pr-10"
                />
              </div>
            </div>

            <div className="space-y-1.5 w-full md:w-56">
              <label htmlFor="telegram-limit" className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                Лимит участников
              </label>
              <select
                id="telegram-limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="flex h-8 w-full items-center justify-between rounded-md border border-border bg-bg-main px-3 text-sm text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {LIMIT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                icon={<Settings size={14} />}
                aria-label="Расширенные настройки"
              >
                Опции
              </Button>
              <Button
                type="submit"
                variant="primary"
                semantic="default"
                size="sm"
                icon={<Send size={14} />}
                disabled={!target.trim()}
              >
                Запустить
              </Button>
            </div>
          </div>
        ) : (
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
        )}

        {/* Advanced settings for export mode only */}
        {mode === 'export' && showSettings && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-border bg-bg-main p-3 text-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-only"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg-main text-accent focus:ring-accent"
              />
              <div>
                <label htmlFor="active-only" className="font-medium text-text-primary">
                  Только активные пользователи
                </label>
                <p className="text-xs text-text-muted">Исключает пользователей, не заходивших в сеть более 30 дней</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verify-phones"
                checked={verifyPhones}
                onChange={(e) => setVerifyPhones(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-bg-main text-accent focus:ring-accent"
              />
              <div>
                <label htmlFor="verify-phones" className="font-medium text-text-primary">
                  Сверять номера телефонов
                </label>
                <p className="text-xs text-text-muted">Попытаться обнаружить скрытые номера с помощью базы контактов</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
