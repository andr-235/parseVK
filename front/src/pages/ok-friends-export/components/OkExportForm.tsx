import { useState, type FormEvent } from 'react'
import { Button, Input, Spinner } from '../../../components/ui'

type OkExportFormProps = {
  onSubmit: (fid: string) => void
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
    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="ok-fid" className="text-xs font-medium text-text-muted">
          ID пользователя OK (fid)
        </label>
        <Input
          id="ok-fid"
          type="text"
          inputMode="numeric"
          value={fid}
          onChange={(e) => { setFid(e.target.value); setError(null) }}
          placeholder="Например: 1234567890"
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
