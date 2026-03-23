import { TgmbaseResultCard } from './TgmbaseResultCard'
import { TgmbaseSearchForm } from './TgmbaseSearchForm'
import { TgmbaseSearchHero } from './TgmbaseSearchHero'
import { TgmbaseSummaryTable } from './TgmbaseSummaryTable'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingState } from '@/shared/components/LoadingState'
import { useTgmbaseSearchState } from '@/modules/tgmbase-search/hooks/useTgmbaseSearchState'

export default function TgmbaseSearchPage() {
  const vm = useTgmbaseSearchState()
  const response = vm.result
  const progress = vm.progress
  const progressPercent =
    progress && progress.totalQueries > 0
      ? Math.round((progress.processedQueries / progress.totalQueries) * 100)
      : 0

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 py-6 font-monitoring-body md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <TgmbaseSearchHero />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <TgmbaseSearchForm
          value={vm.input}
          onChange={vm.setInput}
          isLoading={vm.isLoading}
          onSubmit={vm.submit}
        />
      </div>

      {vm.isLoading ? <LoadingState message="Выполняю поиск по tgmbase..." /> : null}

      {progress ? (
        <section
          className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5 text-slate-100 shadow-[0_18px_60px_rgba(15,23,42,0.35)]"
          aria-live="polite"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">Прогресс поиска</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {progress.status === 'failed'
                  ? 'Поиск завершился с ошибкой'
                  : progress.status === 'completed'
                    ? 'Поиск завершён'
                    : 'Поиск выполняется'}
              </h2>
            </div>
            <div className="text-sm text-slate-300">
              {progress.connected ? 'WebSocket подключен' : 'WebSocket подключается'}
            </div>
          </div>

          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className="h-full rounded-full bg-cyan-400 transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
            <span>Обработано: {progress.processedQueries} из {progress.totalQueries}</span>
            <span>Батч: {progress.currentBatch} из {progress.totalBatches}</span>
            <span>Прогресс: {progressPercent}%</span>
          </div>

          {progress.error ? <p className="mt-3 text-sm text-rose-300">{progress.error}</p> : null}
        </section>
      ) : null}

      {response ? (
        <>
          <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-150">
            <div className="mb-3 flex flex-wrap gap-3 text-sm text-slate-300">
              <span>Всего: {response.summary.total}</span>
              <span>Найдено: {response.summary.found}</span>
              <span>Не найдено: {response.summary.notFound}</span>
              <span>Несколько: {response.summary.ambiguous}</span>
              <span>Невалидных: {response.summary.invalid}</span>
              <span>Ошибок: {response.summary.error}</span>
            </div>
            <TgmbaseSummaryTable
              items={response.items}
              selectedQuery={vm.selectedQuery}
              onSelect={vm.selectQuery}
            />
          </div>

          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
            {response.items.map((item) => (
              <TgmbaseResultCard
                key={`${item.query}-${item.normalizedQuery}`}
                item={item}
                selected={vm.selectedQuery === item.query}
                isLoadingMore={vm.loadingMoreQuery === item.query}
                onLoadMore={() => vm.loadMoreMessages(item)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Поиск ещё не запускался"
          description="Вставь список идентификаторов и запусти массовый поиск по tgmbase."
        />
      )}
    </div>
  )
}
