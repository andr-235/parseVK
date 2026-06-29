import { useState, type FormEvent } from 'react'
import { Play } from 'lucide-react'
import { Button, Input, Spinner } from '../../../components/ui'
import type { StartOkFriendsExportParams } from '../../../shared/api/ok-friends'
import { CheckboxGroup, FormField, FormatGroup } from '../../friends-export/components/ExportFormControls'

type OkExportFormProps = {
  onSubmit: (params: StartOkFriendsExportParams) => void
  disabled: boolean
  isLoading: boolean
}

export function OkExportForm({ onSubmit, disabled, isLoading }: OkExportFormProps) {
  const [fid, setFid] = useState('')
  const [limit, setLimit] = useState('5000')
  const [offset, setOffset] = useState('0')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = fid.trim()
    if (!trimmed) {
      setError('Введите ID пользователя OK')
      return
    }
    if (!/^\d+$/.test(trimmed)) {
      setError('ID должен содержать только цифры')
      return
    }
    const limitNum = Number(limit)
    const offsetNum = Number(offset)
    if (!Number.isInteger(limitNum) || limitNum <= 0) {
      setError('Количество должно быть целым положительным числом')
      return
    }
    if (!Number.isInteger(offsetNum) || offsetNum < 0) {
      setError('Смещение должно быть нулём или положительным числом')
      return
    }
    setError(null)
    onSubmit({ fid: trimmed, limit: limitNum, offset: offsetNum })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="ok-fid" className="text-xs font-medium text-text-muted tracking-wide uppercase">
          ID пользователя OK
        </label>
        <Input
          id="ok-fid"
          type="text"
          inputMode="numeric"
          value={fid}
          onChange={(e) => { setFid(e.target.value); setError(null) }}
          placeholder="1234567890"
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
          <Input type="number" min="1" value={limit} onChange={(e) => setLimit(e.target.value)} disabled={disabled} className="h-10 basis-auto" />
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

      <StaticFields />
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

function StaticFields() {
  const fields = ['uid', 'first_name', 'last_name', 'pic_1', 'gender', 'birthday', 'location', 'online']
  return <CheckboxGroup title="Поля профиля" items={fields} />
}
