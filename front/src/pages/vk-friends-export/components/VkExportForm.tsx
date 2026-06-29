import { useState, type FormEvent } from 'react'
import { Play } from 'lucide-react'
import { Button, Input, Spinner } from '../../../components/ui'
import type { StartVkFriendsExportParams } from '../../../shared/api/vk-friends'

type VkExportFormProps = {
  onSubmit: (params: StartVkFriendsExportParams) => void
  disabled: boolean
  isLoading: boolean
}

export function VkExportForm({ onSubmit, disabled, isLoading }: VkExportFormProps) {
  const [userId, setUserId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = userId.trim()
    if (!trimmed) {
      setError('Введите ID пользователя VK')
      return
    }
    const num = Number(trimmed)
    if (!Number.isInteger(num) || num <= 0) {
      setError('ID должен быть целым положительным числом')
      return
    }
    setError(null)
    onSubmit({ user_id: num })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor="vk-user-id" className="text-xs font-medium text-text-muted tracking-wide uppercase">
            ID пользователя VK
          </label>
          <Input
            id="vk-user-id"
            type="number"
            min="1"
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setError(null) }}
            placeholder="12345"
            disabled={disabled}
            aria-invalid={!!error}
            className="h-10 w-full basis-auto"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={disabled || isLoading}
          icon={isLoading ? undefined : <Play size={16} aria-hidden="true" />}
          className="h-10 w-full lg:w-auto"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Spinner size={14} />
              Запуск...
            </span>
          ) : 'Запустить экспорт'}
        </Button>
      </div>
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      <p className="text-xs text-text-muted">Экспорт запускается с максимальным набором данных по умолчанию. Результат формируется в XLSX.</p>
    </form>
  )
}
