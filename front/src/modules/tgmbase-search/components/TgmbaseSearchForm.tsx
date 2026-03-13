import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

interface TgmbaseSearchFormProps {
  value: string
  onChange: (value: string) => void
  isLoading: boolean
  onSubmit: (queries: string[]) => void
}

const parseQueries = (value: string): string[] =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

export function TgmbaseSearchForm({
  value,
  onChange,
  isLoading,
  onSubmit,
}: TgmbaseSearchFormProps) {
  const queries = parseQueries(value)

  return (
    <Card className="border-white/10 bg-slate-900/70 text-slate-100">
      <CardHeader>
        <CardTitle>Пакетный ввод</CardTitle>
        <CardDescription>
          Один запрос на строку. Можно вставлять `telegramId`, `@username` или телефон.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label htmlFor="tgmbase-search-input" className="text-sm font-medium text-slate-200">
          Список запросов
        </label>
        <textarea
          id="tgmbase-search-input"
          aria-label="Список запросов"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={'581341734\n@Andrei79ru\n+79991234567'}
          className="min-h-48 w-full rounded-card border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <div>Подготовлено запросов: {queries.length}</div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onChange('')} disabled={!value}>
              Очистить
            </Button>
            <Button
              type="button"
              onClick={() => onSubmit(queries)}
              disabled={queries.length === 0 || isLoading}
            >
              {isLoading ? 'Ищу...' : 'Найти'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
