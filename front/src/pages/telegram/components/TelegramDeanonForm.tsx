import { useState } from 'react'
import { Send, Settings, Users } from 'lucide-react'
import { Button, Input } from '../../../components/ui'
import type { LimitOption } from '../types'

interface TelegramDeanonFormProps {
  onSubmit: (target: string, limit: number, activeOnly: boolean, verifyPhones: boolean) => void
}

const LIMIT_OPTIONS: LimitOption[] = [
  { label: '100 участников', value: 100 },
  { label: '500 участников', value: 500 },
  { label: '1000 участников', value: 1000 },
  { label: '5000 участников', value: 5000 },
  { label: 'Все участники (без лимита)', value: 1000000 }
]

export function TelegramDeanonForm({ onSubmit }: TelegramDeanonFormProps) {
  const [target, setTarget] = useState('')
  const [limit, setLimit] = useState(500)
  const [activeOnly, setActiveOnly] = useState(false)
  const [verifyPhones, setVerifyPhones] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!target.trim()) return
    onSubmit(target.trim(), limit, activeOnly, verifyPhones)
    setTarget('')
  }

  return (
    <div className="rounded-lg border border-border bg-bg-panel p-4 space-y-4">
      <div className="flex gap-4 border-b border-border pb-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <Users size={14} />
          Параметры выгрузки участников Telegram
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        {showSettings && (
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
