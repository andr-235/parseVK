import { useState, type FormEvent } from 'react'
import { Button, Input, Spinner } from '../../../components/ui'

type VkExportFormProps = {
  onSubmit: (user_id: number) => void
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
    onSubmit(num)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="vk-user-id" className="text-xs font-medium text-text-muted">
          ID пользователя VK
        </label>
        <Input
          id="vk-user-id"
          type="number"
          min="1"
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setError(null) }}
          placeholder="Например: 12345"
          disabled={disabled}
          aria-invalid={!!error}
        />
        {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={disabled || isLoading} icon={isLoading ? <Spinner size={14} /> : undefined}>
        {isLoading ? 'Запуск...' : 'Запустить экспорт'}
      </Button>
    </form>
  )
}
