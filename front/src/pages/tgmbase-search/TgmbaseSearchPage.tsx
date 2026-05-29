
import { PageHeader } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Empty } from '@/components/ui/empty'
import { cn } from '@/utils/common'
import { useTgmbaseSearchState } from '@/pages/tgmbase-search/hooks/useTgmbaseSearchState'
import { useTgmbaseResultsViewModel } from '@/pages/tgmbase-search/hooks/useTgmbaseResultsViewModel'
import type { TgmbaseProgressState } from '@/pages/tgmbase-search/hooks/useTgmbaseSearchState'
import type {
  TgmbasePresenceFilters,
  TgmbaseSortMode,
} from '@/pages/tgmbase-search/hooks/useTgmbaseResultsViewModel'
import type {
  TgmbaseQueryType,
  TgmbaseSearchItem,
  TgmbaseSearchStatus,
  TgmbaseMessagesPage,
} from '@/types/common'

const tgmbaseStatusLabels: Record<TgmbaseSearchStatus, string> = {
  found: 'Найдено',
  not_found: 'Не найдено',
  ambiguous: 'Несколько',
  invalid: 'Невалидно',
  error: 'Ошибка',
}

const tgmbaseQueryTypeLabels: Record<TgmbaseQueryType, string> = {
  telegramId: 'telegramId',
  username: 'username',
  phoneNumber: 'phone',
  invalid: 'invalid',
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

const getPrimaryLabel = (item: TgmbaseSearchItem) =>
  item.profile?.fullName ?? item.candidates[0]?.fullName ?? 'Без профиля'

interface TgmbaseBatchToolbarProps {
  value: string
  onChange: (value: string) => void
  isLoading: boolean
  onSubmit: (queries: string[]) => void
  onNewBatch: () => void
  progress: TgmbaseProgressState | null
  hasResult: boolean
}

function TgmbaseBatchToolbar({
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
          className="min-h-40 w-full rounded-card border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-primary/60"
        />

        <div className="rounded-card border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Подготовлено запросов: {queries.length}</span>
            <span className="text-slate-400">По одному идентификатору на строку</span>
          </div>
        </div>

        {progress ? (
          <div
            className="rounded-card border border-primary/20 bg-[#131316]/90 p-4"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-primary/70">
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
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>
                Обработано {progress.processedQueries} из {progress.totalQueries}
              </span>
              <span>
                Батч {progress.currentBatch} из {progress.totalBatches}
              </span>
              <span>Прогресс {progressPercent}%</span>
            </div>
            {progress.error ? (
              <div className="mt-2 text-sm text-rose-300">{progress.error}</div>
            ) : null}
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

interface TgmbaseMessagesPanelProps {
  messagesPage: TgmbaseMessagesPage
  isLoadingMore: boolean
  onLoadMore: () => void
}

function TgmbaseMessagesPanel({
  messagesPage,
  isLoadingMore,
  onLoadMore,
}: TgmbaseMessagesPanelProps) {
  return (
    <Card className="border-white/10 bg-slate-950/50 text-slate-100">
      <CardHeader>
        <CardTitle>
          Последние сообщения ({messagesPage.items.length} из {messagesPage.total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messagesPage.items.length === 0 ? (
          <div className="text-sm text-slate-400">Сообщения не найдены.</div>
        ) : (
          messagesPage.items.map((message) => (
            <div
              key={message.id}
              className="rounded-card border border-white/10 bg-[#131316]/90 p-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{new Date(message.date).toLocaleString('ru-RU')}</span>
                <span>peer: {message.peerTitle ?? message.peerId}</span>
                <span>{message.peerType}</span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                {message.text ?? 'Сообщение без текста'}
              </div>
            </div>
          ))
        )}
        {messagesPage.hasMore ? (
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Загружаю...' : 'Показать ещё сообщения'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface TgmbaseResultsSummaryProps {
  total: number
  summary: Record<'total' | TgmbaseSearchStatus, number>
  activeStatuses: TgmbaseSearchStatus[]
  onToggleStatus: (status: TgmbaseSearchStatus) => void
  onShowAll: () => void
}

function TgmbaseResultsSummary({
  total,
  summary,
  activeStatuses,
  onToggleStatus,
  onShowAll,
}: TgmbaseResultsSummaryProps) {
  const statusOrder: TgmbaseSearchStatus[] = ['found', 'not_found', 'ambiguous', 'invalid', 'error']

  return (
    <Card className="border-white/10 bg-slate-900/70 text-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Результаты батча</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={activeStatuses.length === 0 ? 'default' : 'outline'}
          onClick={onShowAll}
        >
          Все {total}
        </Button>
        {statusOrder.map((status) => (
          <Button
            key={status}
            type="button"
            variant={activeStatuses.includes(status) ? 'default' : 'outline'}
            onClick={() => onToggleStatus(status)}
          >
            {tgmbaseStatusLabels[status]} {summary[status]}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

interface TgmbaseResultsFiltersProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  queryTypeFilters: TgmbaseQueryType[]
  onToggleQueryType: (value: TgmbaseQueryType) => void
  presenceFilters: TgmbasePresenceFilters
  onSetPresenceFilter: (key: keyof TgmbasePresenceFilters, value: boolean) => void
  sortBy: TgmbaseSortMode
  onSortChange: (value: TgmbaseSortMode) => void
  onResetFilters: () => void
}

function TgmbaseResultsFilters({
  searchTerm,
  onSearchTermChange,
  queryTypeFilters,
  onToggleQueryType,
  presenceFilters,
  onSetPresenceFilter,
  sortBy,
  onSortChange,
  onResetFilters,
}: TgmbaseResultsFiltersProps) {
  const queryTypes: TgmbaseQueryType[] = ['telegramId', 'username', 'phoneNumber']

  return (
    <Card className="border-white/10 bg-slate-900/60 text-slate-100">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Поиск по query, имени, username, телефону, чатам"
            aria-label="Поиск по результатам tgmbase"
            className="border-white/10 bg-slate-950/80 text-slate-100"
          />
          <select
            aria-label="Сортировка результатов tgmbase"
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as TgmbaseSortMode)}
            className="h-10 rounded-lg border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100"
          >
            <option value="priority">Сначала проблемные</option>
            <option value="input">По порядку ввода</option>
            <option value="status">По статусу</option>
            <option value="messagesDesc">По числу сообщений</option>
            <option value="contactsDesc">По числу контактов</option>
            <option value="groupsDesc">По числу чатов</option>
          </select>
          <Button type="button" variant="outline" onClick={onResetFilters}>
            Сбросить фильтры
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {queryTypes.map((queryType) => (
            <Button
              key={queryType}
              type="button"
              variant={queryTypeFilters.includes(queryType) ? 'default' : 'outline'}
              onClick={() => onToggleQueryType(queryType)}
            >
              {tgmbaseQueryTypeLabels[queryType]}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-slate-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={presenceFilters.hasProfile}
              onChange={(event) => onSetPresenceFilter('hasProfile', event.target.checked)}
            />
            Есть профиль
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={presenceFilters.hasGroups}
              onChange={(event) => onSetPresenceFilter('hasGroups', event.target.checked)}
            />
            Есть чаты
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={presenceFilters.hasContacts}
              onChange={(event) => onSetPresenceFilter('hasContacts', event.target.checked)}
            />
            Есть контакты
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={presenceFilters.hasMessages}
              onChange={(event) => onSetPresenceFilter('hasMessages', event.target.checked)}
            />
            Есть сообщения
          </label>
        </div>
      </CardContent>
    </Card>
  )
}

interface TgmbaseResultsListProps {
  items: TgmbaseSearchItem[]
  selectedQuery: string | null
  onSelect: (query: string) => void
  onMoveSelection: (direction: 'next' | 'previous') => void
}

function TgmbaseResultsList({
  items,
  selectedQuery,
  onSelect,
  onMoveSelection,
}: TgmbaseResultsListProps) {
  return (
    <Card className="border-white/10 bg-slate-900/60 text-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Список результатов</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div
          role="list"
          aria-label="Результаты поиска tgmbase"
          className="space-y-2"
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              onMoveSelection('next')
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault()
              onMoveSelection('previous')
            }
          }}
        >
          {items.map((item) => {
            const selected = selectedQuery === item.query

            return (
              <div key={`${item.query}-${item.normalizedQuery}`} role="listitem">
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(item.query)}
                  className={cn(
                    'w-full rounded-card border px-4 py-3 text-left transition',
                    selected
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-white/10 bg-slate-950/60 hover:border-primary/30 hover:bg-slate-950'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-100">{item.query}</span>
                        <Badge variant="outline" className="text-slate-200">
                          {tgmbaseQueryTypeLabels[item.queryType]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-orange-200"
                        >
                          {tgmbaseStatusLabels[item.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-300">{getPrimaryLabel(item)}</div>
                    </div>
                    <div className="flex gap-3 text-xs text-slate-400">
                      <span>Чаты {item.stats.groups}</span>
                      <span>Контакты {item.stats.contacts}</span>
                      <span>Сообщения {item.stats.messages}</span>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface TgmbaseResultDetailsProps {
  item: TgmbaseSearchItem | null
  isLoadingMore: boolean
  onLoadMore: () => void
  hasActiveFilters: boolean
  onResetFilters: () => void
}

function TgmbaseResultDetails({
  item,
  isLoadingMore,
  onLoadMore,
  hasActiveFilters,
  onResetFilters,
}: TgmbaseResultDetailsProps) {
  if (!item) {
    return (
      <Card
        className="border-white/10 bg-slate-900/60 text-slate-100"
        role="region"
        aria-label="Панель деталей tgmbase"
      >
        <CardHeader>
          <h2 className="text-xl font-semibold">Детали результата</h2>
        </CardHeader>
        <CardContent>
          <Empty className="border-white/10 bg-slate-950/60 text-slate-200">
            <div className="space-y-3">
              <div className="text-lg font-semibold">Нет видимых результатов</div>
              <div className="text-sm text-slate-400">
                {hasActiveFilters
                  ? 'Снимите часть фильтров, чтобы снова увидеть записи.'
                  : 'Запустите поиск, чтобы открыть детали результата.'}
              </div>
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="text-primary underline underline-offset-4"
                  onClick={onResetFilters}
                >
                  Сбросить фильтры
                </button>
              ) : null}
            </div>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="border-white/10 bg-slate-900/60 text-slate-100"
      role="region"
      aria-label="Панель деталей tgmbase"
    >
      <CardHeader className="gap-3 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">Детали результата</h2>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-orange-200">
            {tgmbaseStatusLabels[item.status]}
          </Badge>
        </div>
        <div className="text-sm text-slate-400">
          Исходный запрос: {item.query} · Нормализованное значение: {item.normalizedQuery}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {item.status === 'not_found' ? (
          <div className="rounded-card border border-white/10 bg-slate-950/60 p-4 text-slate-300">
            <div className="font-semibold text-slate-100">Совпадения не найдены</div>
            <div className="mt-1 text-sm">В tgmbase нет пользователя с таким идентификатором.</div>
          </div>
        ) : null}

        {item.status === 'error' ? (
          <div className="rounded-card border border-rose-400/20 bg-rose-500/10 p-4 text-rose-100">
            <div className="font-semibold">Ошибка поиска</div>
            <div className="mt-1 text-sm">{item.error ?? 'Не удалось обработать этот запрос.'}</div>
          </div>
        ) : null}

        {item.profile ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Профиль
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-card border border-white/10 bg-slate-950/60 p-4">
                <div className="text-lg font-semibold text-slate-100">{item.profile.fullName}</div>
                <div className="mt-2 space-y-1 text-sm text-slate-300">
                  <div>telegramId: {item.profile.telegramId}</div>
                  <div>username: {item.profile.username ?? '—'}</div>
                  <div>phone: {item.profile.phoneNumber ?? '—'}</div>
                  <div>premium: {item.profile.premium ? 'yes' : 'no'}</div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {item.candidates.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Кандидаты
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {item.candidates.map((candidate) => (
                <div
                  key={candidate.telegramId}
                  className="rounded-card border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="font-semibold text-slate-100">{candidate.fullName}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    {candidate.username ? `@${candidate.username}` : candidate.telegramId}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {item.groups.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Чаты и каналы
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {item.groups.map((group) => (
                <div
                  key={group.peerId}
                  className="rounded-card border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="font-semibold text-slate-100">{group.title}</div>
                  <div className="mt-2 text-sm text-slate-400">
                    {group.type} · {group.peerId}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {item.contacts.length > 0 ? (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Активные контакты
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {item.contacts.map((contact) => (
                <div
                  key={contact.telegramId}
                  className="rounded-card border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="font-semibold text-slate-100">{contact.fullName}</div>
                  <div className="mt-2 text-sm text-slate-300">
                    {contact.username ? `@${contact.username}` : contact.telegramId}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Общих чатов: {contact.commonPeersCount} · Сообщений: {contact.messageCount}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {(item.status === 'found' || item.messagesPage.total > 0) && (
          <TgmbaseMessagesPanel
            messagesPage={item.messagesPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface TgmbaseResultsWorkspaceProps {
  total: number
  summary: Record<'total' | TgmbaseSearchStatus, number>
  activeStatuses: TgmbaseSearchStatus[]
  onToggleStatus: (status: TgmbaseSearchStatus) => void
  onShowAllStatuses: () => void
  searchTerm: string
  onSearchTermChange: (value: string) => void
  queryTypeFilters: TgmbaseQueryType[]
  onToggleQueryType: (value: TgmbaseQueryType) => void
  presenceFilters: TgmbasePresenceFilters
  onSetPresenceFilter: (key: keyof TgmbasePresenceFilters, value: boolean) => void
  sortBy: TgmbaseSortMode
  onSortChange: (value: TgmbaseSortMode) => void
  onResetFilters: () => void
  items: TgmbaseSearchItem[]
  selectedQuery: string | null
  selectedItem: TgmbaseSearchItem | null
  onSelect: (query: string) => void
  onMoveSelection: (direction: 'next' | 'previous') => void
  isLoadingMore: boolean
  onLoadMore: () => void
  hasActiveFilters: boolean
}

function TgmbaseResultsWorkspace(props: TgmbaseResultsWorkspaceProps) {
  return (
    <section className="space-y-4">
      <TgmbaseResultsSummary
        total={props.total}
        summary={props.summary}
        activeStatuses={props.activeStatuses}
        onToggleStatus={props.onToggleStatus}
        onShowAll={props.onShowAllStatuses}
      />

      <TgmbaseResultsFilters
        searchTerm={props.searchTerm}
        onSearchTermChange={props.onSearchTermChange}
        queryTypeFilters={props.queryTypeFilters}
        onToggleQueryType={props.onToggleQueryType}
        presenceFilters={props.presenceFilters}
        onSetPresenceFilter={props.onSetPresenceFilter}
        sortBy={props.sortBy}
        onSortChange={props.onSortChange}
        onResetFilters={props.onResetFilters}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(380px,0.9fr)]">
        <TgmbaseResultsList
          items={props.items}
          selectedQuery={props.selectedQuery}
          onSelect={props.onSelect}
          onMoveSelection={props.onMoveSelection}
        />
        <TgmbaseResultDetails
          item={props.selectedItem}
          isLoadingMore={props.isLoadingMore}
          onLoadMore={props.onLoadMore}
          hasActiveFilters={props.hasActiveFilters}
          onResetFilters={props.onResetFilters}
        />
      </div>
    </section>
  )
}

export default function TgmbaseSearchPage() {
  const vm = useTgmbaseSearchState()
  const response = vm.result
  const resultsVm = useTgmbaseResultsViewModel({
    items: response?.items ?? [],
    selectedQuery: vm.selectedQuery,
  })
  const selectedItem = resultsVm.selectedItem

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-8 px-4 py-6 font-monitoring-body md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="hero"
          title="Telegram Intelligence Search"
          description="Массовый поиск по базе tgmbase по telegramId, username и номеру телефона. Результат показывает профиль, связанные чаты, активных контактов в общих peer'ах и последние сообщения пользователя."
          footer={
            <Badge
              className="border-accent-primary/20 bg-accent-primary/10 text-accent-primary"
              variant="outline"
            >
              TGMB Search
            </Badge>
          }
        />
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
        <TgmbaseBatchToolbar
          value={vm.input}
          onChange={vm.setInput}
          isLoading={vm.isLoading}
          onSubmit={vm.submit}
          onNewBatch={vm.resetSearch}
          progress={vm.progress}
          hasResult={Boolean(response)}
        />
      </div>

      {response ? (
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-150">
          <TgmbaseResultsWorkspace
            total={response.summary.total}
            summary={resultsVm.summary}
            activeStatuses={resultsVm.statusFilters}
            onToggleStatus={resultsVm.toggleStatus}
            onShowAllStatuses={resultsVm.clearStatusFilters}
            searchTerm={resultsVm.searchTerm}
            onSearchTermChange={resultsVm.setSearchTerm}
            queryTypeFilters={resultsVm.queryTypeFilters}
            onToggleQueryType={resultsVm.toggleQueryType}
            presenceFilters={resultsVm.presenceFilters}
            onSetPresenceFilter={resultsVm.setPresenceFilter}
            sortBy={resultsVm.sortBy}
            onSortChange={resultsVm.setSortBy}
            onResetFilters={resultsVm.resetFilters}
            items={resultsVm.visibleItems}
            selectedQuery={resultsVm.selectedQuery}
            selectedItem={selectedItem}
            onSelect={resultsVm.setSelectedQuery}
            onMoveSelection={resultsVm.moveSelection}
            isLoadingMore={vm.loadingMoreQuery === selectedItem?.query}
            onLoadMore={() => {
              if (selectedItem) {
                void vm.loadMoreMessages(selectedItem)
              }
            }}
            hasActiveFilters={resultsVm.hasActiveFilters}
          />
        </div>
      ) : (
        <EmptyState
          title="Поиск ещё не запускался"
          description="Вставь список идентификаторов и запусти массовый поиск по tgmbase."
        />
      )}
    </div>
  )
}

