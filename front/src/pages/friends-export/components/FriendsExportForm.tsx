import { useState, type FormEvent } from 'react'
import { Play } from 'lucide-react'
import { Button, Input, Spinner } from '../../../components/ui'

export type FriendsExportFormProps<TParams extends Record<string, string | number>> = {
  label: string
  placeholder: string
  inputId: string
  inputType: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'url' | 'email' | 'tel' | 'search'
  min?: string | number
  disabled: boolean
  isLoading: boolean
  validate: (value: string) => string | null
  errorMessage: string
  buildParams: (value: string) => TParams
  onSubmit: (params: TParams) => void
}

export function FriendsExportForm<TParams extends Record<string, string | number>>({
  label,
  placeholder,
  inputId,
  inputType,
  inputMode,
  min,
  disabled,
  isLoading,
  validate,
  errorMessage,
  buildParams,
  onSubmit,
}: FriendsExportFormProps<TParams>) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      setError(errorMessage)
      return
    }
    const validationError = validate(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    onSubmit(buildParams(trimmed))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end">
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-xs font-medium text-text-muted tracking-wide uppercase">
            {label}
          </label>
          <Input
            id={inputId}
            type={inputType}
            inputMode={inputMode}
            min={min}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(null) }}
            placeholder={placeholder}
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
