import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import type { TgmbaseProgressState } from '@/modules/tgmbase-search/hooks/useTgmbaseSearchState'

interface TgmbaseBatchToolbarProps {
  value: string
  onChange: (value: string) => void
  isLoading: boolean
  onSubmit: (queries: string[]) => void
  onNewBatch: () => void
  progress: TgmbaseProgressState | null
  hasResult: boolean
}

const parseQueries = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

const progressTitleMap: Record<TgmbaseProgressState['status'], string> = {
  connecting: 'Подключаю прогресс',
  started: 'Поиск запущен',
  progress: 'Поиск выполняется',
  completed: 'Поиск завершён',
  failed: 'Ошибка поиска',
}

export function TgmbaseBatchToolbar({
  value,
  onChange,
  isLoading,
  onSubmit,
  onNewBatch,
  progress,
  hasResult,
}: TgmbaseBatchToolbarProps) {
  const queries = parseQueries(value)
  const progressPercent =
    progress && progress.totalQueries > 0
      ? Math.round((progress.processedQueries / progress.totalQueries) * 100)
      : 0

  return (
    <Card className="sticky top-4 z-20 border-white/10 bg-slate-950/90 text-slate-100 backdrop-blur">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Пакетный ввод</CardTitle>
            <CardDescription>
              Один запрос на строку. Поддерживаются `telegramId`, `@username` и телефон.
            </CardDescription>
          </div>
          {(hasResult || progress) && (
            <Button type="button" variant="outline" onClick={onNewBatch}>
              Новый батч
            </Button>
          )}
        </div>
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
          className="min-h-40 w-full rounded-card border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
        />

        <div className="rounded-card border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Подготовлено запросов: {queries.length}</span>
            <span className="text-slate-400">По одному идентификатору на строку</span>
          </div>
        </div>

        {progress ? (
          <div className="rounded-card border border-cyan-400/20 bg-slate-900/80 p-4" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
                  Прогресс поиска
                </div>
                <div className="mt-1 text-base font-semibold text-white">
                  {progressTitleMap[progress.status]}
                </div>
              </div>
              <div className="text-sm text-slate-300">
                {progress.connected ? 'WebSocket подключен' : 'WebSocket подключается'}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full rounded-full bg-cyan-400 transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>Обработано {progress.processedQueries} из {progress.totalQueries}</span>
              <span>Батч {progress.currentBatch} из {progress.totalBatches}</span>
              <span>Прогресс {progressPercent}%</span>
            </div>
            {progress.error ? <div className="mt-2 text-sm text-rose-300">{progress.error}</div> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
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
      </CardContent>
    </Card>
  )
}
