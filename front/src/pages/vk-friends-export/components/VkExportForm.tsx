import { useState, type FormEvent } from 'react'
import { Play } from 'lucide-react'
import { Button, Input, Spinner } from '../../../components/ui'
import type { StartVkFriendsExportParams } from '../../../shared/api/vk-friends'
import { CheckboxGroup, FormField, FormatGroup } from '../../friends-export/components/ExportFormControls'

type VkExportFormProps = {
  onSubmit: (params: StartVkFriendsExportParams) => void
  disabled: boolean
  isLoading: boolean
}

const PROFILE_FIELDS = ['photo_100', 'city', 'country', 'domain', 'sex', 'bdate', 'status', 'last_seen', 'verified']

export function VkExportForm({ onSubmit, disabled, isLoading }: VkExportFormProps) {
  const [userId, setUserId] = useState('')
  const [count, setCount] = useState('5000')
  const [offset, setOffset] = useState('0')
  const [fields, setFields] = useState<string[]>(PROFILE_FIELDS)
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
    const countNum = Number(count)
    const offsetNum = Number(offset)
    if (!Number.isInteger(countNum) || countNum <= 0) {
      setError('Количество должно быть целым положительным числом')
      return
    }
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      setError('Смещение должно быть нулём или положительным числом')
      return
    }
    setError(null)
    onSubmit({ user_id: num, count: countNum, offset: offsetNum, fields })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
          className="h-10 basis-auto"
        />
        {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      </div>

      <div className="grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="Порядок">
          <select disabled className="h-10 w-full rounded-md border border-border bg-bg-main px-3 text-sm text-text-muted">
            <option>По умолчанию</option>
          </select>
        </FormField>
        <FormField label="Количество">
          <Input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} disabled={disabled} className="h-10 basis-auto" />
        </FormField>
        <FormField label="Смещение">
          <Input type="number" min="0" value={offset} onChange={(e) => setOffset(e.target.value)} disabled={disabled} className="h-10 basis-auto" />
        </FormField>
        <FormField label="Падеж имени">
          <select disabled className="h-10 w-full rounded-md border border-border bg-bg-main px-3 text-sm text-text-muted">
            <option>Именительный</option>
          </select>
        </FormField>
      </div>

      <CheckboxGroup
        title="Поля профиля"
        items={PROFILE_FIELDS}
        selected={fields}
        disabled={disabled}
        onToggle={(field) => setFields((prev) => prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field])}
      />

      <FormatGroup />

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-muted">После запуска будет создано задание экспорта.</p>
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={disabled || isLoading}
        icon={isLoading ? undefined : <Play size={16} aria-hidden="true" />}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <Spinner size={14} />
            Запуск...
          </span>
        ) : 'Запустить экспорт'}
      </Button>
      </div>
    </form>
  )
}
