import { useState, type FormEvent } from 'react'
import { Play } from 'lucide-react'
import { Button, Input, Spinner } from '../../../components/ui'
import type { StartOkFriendsExportParams } from '../../../shared/api/ok-friends'

type OkExportFormProps = {
  onSubmit: (params: StartOkFriendsExportParams) => void
  disabled: boolean
  isLoading: boolean
}

export function OkExportForm({ onSubmit, disabled, isLoading }: OkExportFormProps) {
  const [fid, setFid] = useState('')
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
    setError(null)
    onSubmit({ fid: trimmed })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
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
