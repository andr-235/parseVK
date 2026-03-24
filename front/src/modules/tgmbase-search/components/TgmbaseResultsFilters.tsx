import type { TgmbaseQueryType } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import type {
  TgmbasePresenceFilters,
  TgmbaseSortMode,
} from '@/modules/tgmbase-search/hooks/useTgmbaseResultsViewModel'
import { tgmbaseQueryTypeLabels } from './tgmbaseSearch.constants'

interface TgmbaseResultsFiltersProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  queryTypeFilters: TgmbaseQueryType[]
  onToggleQueryType: (value: TgmbaseQueryType) => void
  presenceFilters: TgmbasePresenceFilters
  onSetPresenceFilter: (
    key: keyof TgmbasePresenceFilters,
    value: boolean
  ) => void
  sortBy: TgmbaseSortMode
  onSortChange: (value: TgmbaseSortMode) => void
  onResetFilters: () => void
}

export function TgmbaseResultsFilters({
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
