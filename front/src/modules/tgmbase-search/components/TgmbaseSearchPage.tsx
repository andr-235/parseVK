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
