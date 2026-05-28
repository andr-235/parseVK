import { useCallback, useMemo, memo } from 'react'
import { getGroupTableColumns } from '@/config/groups/groupTableColumns'
import RegionGroupsSearchCard from '@/components/groups/RegionGroupsSearchCard'
import { PageHeader } from '@/components/common'
import FileUpload from '@/components/common/FileUpload'
import { useGroupsViewModel } from '@/hooks/groups/useGroupsViewModel'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Users, ExternalLink, Trash2, Lock } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useTableSorting } from '@/hooks/common'
import type { Group, TableColumn } from '@/types'
import { Badge } from '@/components/ui/badge'
import { ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SearchInput from '@/components/common/SearchInput'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'

interface GroupInputProps {
  url: string
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onAdd: () => void
}

function GroupInput({ url, onUrlChange, onAdd }: GroupInputProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onAdd()
      }
    },
    [onAdd]
  )

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <Input
        value={url}
        onChange={onUrlChange}
        onKeyDown={handleKeyDown}
        placeholder="https://vk.com/группа"
        className="h-11 border-border bg-background-secondary text-text-light placeholder:text-text-secondary focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 sm:min-w-[280px] sm:flex-1"
      />
      <Button
        onClick={onAdd}
        className="h-11 bg-primary px-5 font-semibold text-text-light hover:bg-primary/90 transition-all duration-200 active:translate-y-px shadow-soft-sm hover:shadow-soft-md w-full sm:w-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <Plus className="size-4" />
          Добавить
        </span>
      </Button>
    </div>
  )
}

interface GroupCardProps {
  group: Group
  onDelete: (id: number) => void
}

const GROUP_TYPE_LABELS: Record<string, string> = {
  group: 'Группа',
  page: 'Страница',
  event: 'Событие',
}

const GroupCard = memo(function GroupCard({ group, onDelete }: GroupCardProps) {
  const link = `https://vk.com/${group.screenName || `club${group.vkId}`}`

  return (
    <div className="group relative h-full">
      <Card className="relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-background-secondary transition-all duration-300 hover:border-slate-700 hover:shadow-soft-md">
        <div className="flex shrink-0 items-start gap-3 border-b border-border bg-background-sidebar/30 p-4">
          <div className="relative shrink-0">
            {group.photo50 ? (
              <img
                src={group.photo50}
                alt={group.name}
                className="size-12 rounded-full border border-border object-cover shadow-soft-sm transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full border border-border bg-background-primary shadow-soft-sm">
                <span className="font-monitoring-display text-xl font-semibold text-text-secondary">
                  {group.name?.[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
            )}
            {group.isClosed === 1 && (
              <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-border bg-background-secondary shadow-soft-sm">
                <Lock className="size-3 text-accent-warning" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="font-monitoring-display line-clamp-2 text-base font-semibold leading-tight text-text-light transition-colors duration-200 group-hover:text-primary"
              title={group.name}
            >
              {group.name}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="font-mono-accent text-text-secondary truncate">
                {GROUP_TYPE_LABELS[group.type || ''] || group.type || 'Группа'}
              </span>
              <span className="text-border">•</span>
              <span className="font-mono-accent text-text-secondary truncate">
                ID: {group.vkId}
              </span>
            </div>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-5">
          {group.status && (
            <div className="shrink-0 rounded-md border border-border bg-background-primary/50 p-2.5">
              <p className="line-clamp-2 text-xs italic leading-snug text-text-secondary">
                "{group.status}"
              </p>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-background-sidebar text-text-secondary">
              <Users className="size-4" />
            </div>
            <span className="font-monitoring-display text-base font-semibold text-text-light">
              {group.membersCount?.toLocaleString('ru-RU') ?? 0}
            </span>
            <span className="text-xs text-text-secondary">участников</span>
          </div>

          {group.description && (
            <div className="min-h-0 flex-1 pt-1">
              <p
                className="line-clamp-3 text-xs leading-relaxed text-text-secondary"
                title={group.description}
              >
                {group.description}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-background-sidebar/30 p-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 text-text-secondary transition-colors duration-200 hover:bg-background-primary hover:text-primary"
            onClick={() => window.open(link, '_blank')}
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            <span className="truncate">Открыть</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 text-text-secondary transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(group.id)}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            <span className="truncate">Удалить</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
})

interface SortOption {
  key: string
  label: string
  directionLabel?: { asc: string; desc: string }
}

type ColumnsFactory = (deleteGroup: (id: number) => void) => TableColumn<Group>[]

interface GroupsTableCardProps {
  groups: Group[]
  totalCount: number
  isLoading: boolean
  isLoadingMore: boolean
  onClear: () => void | Promise<void>
  onDelete: (id: number) => void
  columns: ColumnsFactory
  searchTerm: string
  onSearchChange: (value: string) => void
}

function GroupsTableCard({
  groups,
  totalCount,
  isLoading,
  isLoadingMore,
  onClear,
  onDelete,
  columns,
  searchTerm,
  onSearchChange,
}: GroupsTableCardProps) {
  const hasGroups = totalCount > 0
  const hasFilteredGroups = groups.length > 0
  const tableColumns = useMemo(() => columns(onDelete), [columns, onDelete])

  const {
    sortedItems: sortedGroups,
    sortState,
    requestSort,
  } = useTableSorting(groups, tableColumns)

  const clearDisabled = isLoading || !hasGroups

  const badgeText = useMemo(() => {
    return searchTerm.trim() ? `${groups.length} из ${totalCount}` : `${totalCount}`
  }, [groups.length, totalCount, searchTerm])

  const sortOptions: SortOption[] = useMemo(() => {
    return tableColumns
      .filter((col) => col.sortable)
      .map((col) => ({
        key: col.key,
        label: col.header,
      }))
  }, [tableColumns])

  const currentSortLabel = sortOptions.find((o) => o.key === sortState?.key)?.label || 'Сортировка'

  const headerActions = useMemo(() => {
    if (!hasGroups) return null
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        disabled={clearDisabled}
        className="h-10 text-text-secondary transition-colors duration-200 hover:bg-destructive/10 hover:text-destructive"
        title="Очистить список"
      >
        <Trash2 className="mr-2 size-4" />
        <span className="sr-only sm:not-sr-only">Очистить все</span>
      </Button>
    )
  }, [hasGroups, onClear, clearDisabled])

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border bg-background-secondary shadow-soft-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border bg-background-sidebar/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
            Список групп
          </h2>
          {!isLoading && badgeText && (
            <Badge className="border border-border bg-background-primary px-3 py-1 font-mono-accent text-xs text-text-secondary">
              {badgeText}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Поиск..."
            className="h-10 w-full border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-primary/50 focus:ring-primary/20 sm:w-[250px]"
          />

          {sortOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 border-border bg-background-primary text-text-secondary hover:border-primary/50 hover:bg-background-sidebar hover:text-text-light"
                >
                  <ArrowUpDown className="size-4" />
                  <span className="max-w-[100px] truncate">{currentSortLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border border-border bg-background-secondary shadow-soft-lg animate-in fade-in-80 duration-100"
              >
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.key}
                    onClick={() => requestSort(option.key)}
                    className="text-text-secondary hover:bg-background-primary hover:text-text-light cursor-pointer"
                  >
                    {option.label}
                    {sortState?.key === option.key && (
                      <span className="ml-auto font-mono-accent text-xs text-primary">
                        {sortState.direction === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {headerActions}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 md:p-6">
        {isLoading && !hasGroups && (
          <div className="py-8">
            <LoadingState message="Загружаем группы…" />
          </div>
        )}

        {!isLoading && !hasGroups && (
          <EmptyState
            icon="📁"
            title="Список пуст"
            description="Добавьте группы по ссылке или загрузите список из файла — после обработки данные появятся здесь и будут доступны для управления."
          />
        )}

        {!isLoading && hasGroups && !hasFilteredGroups && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-text-secondary">
            По запросу «<span className="font-mono-accent text-primary">{searchTerm}</span>» ничего не найдено
          </div>
        )}

        {hasGroups && (hasFilteredGroups || isLoading) && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="h-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: index < 12 ? `${index * 50}ms` : '0ms' }}
                >
                  <GroupCard group={group} onDelete={onDelete} />
                </div>
              ))}
            </div>

            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <span className="font-mono-accent text-sm text-text-secondary">Загрузка...</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function GroupsPage() {
  const {
    groups,
    groupsCount,
    isLoading,
    isLoadingMore,
    hasMore,
    searchTerm,
    url,
    loadMoreRef,
    regionSearch,
    setSearchTerm,
    handleAddGroup,
    handleUrlChange,
    handleFilesSelect,
    handleDeleteAllGroups,
    handleRegionSearch,
    handleAddRegionGroup,
    handleAddSelectedRegionGroups,
    handleRemoveRegionGroup,
    deleteGroup,
    resetRegionSearch,
  } = useGroupsViewModel()

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6 font-monitoring-body max-w-[1600px] mx-auto w-full px-4 md:px-8">
      <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <PageHeader
          variant="simple"
          title={
            <>
              VK <span className="text-accent-primary">Группы</span>
            </>
          }
          description="Управляйте VK сообществами: добавляйте группы для парсинга, отслеживайте их метрики и аудиторию."
          actions={
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <GroupInput url={url} onUrlChange={handleUrlChange} onAdd={handleAddGroup} />
              <FileUpload
                onFilesSelect={handleFilesSelect}
                buttonText="Импорт"
                className="shrink-0"
              />
            </div>
          }
        />
      </div>

      <div className="space-y-6">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-100">
          <RegionGroupsSearchCard
            total={regionSearch.total}
            results={regionSearch.missing}
            isLoading={regionSearch.isLoading}
            error={regionSearch.error}
            onSearch={handleRegionSearch}
            onAddGroup={handleAddRegionGroup}
            onAddSelected={handleAddSelectedRegionGroups}
            onRemoveGroup={handleRemoveRegionGroup}
            onReset={resetRegionSearch}
          />
        </div>

        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
          <GroupsTableCard
            groups={groups}
            totalCount={groupsCount}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClear={handleDeleteAllGroups}
            onDelete={deleteGroup}
            columns={getGroupTableColumns}
          />
        </div>

        {hasMore && <div ref={loadMoreRef} className="h-1 w-full" />}
      </div>
    </div>
  )
}

export default GroupsPage
