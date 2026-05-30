import { memo, useMemo } from 'react'
import { Users, Trash2, Search, X } from 'lucide-react'
import { GroupCard } from './GroupCard'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Spinner } from '@/shared/components/ui/spinner'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/shared/components/ui/empty'
import type { Group } from '@/shared/types'

interface GroupsSectionProps {
  groups: Group[]
  totalCount: number
  isLoading: boolean
  isLoadingMore: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  onDeleteGroup: (id: number) => void
  onClear: () => void
  onRetry?: () => void
}

function GroupsSkeletonGrid() {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Загрузка групп..."
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-card border border-border/60 bg-background-secondary shadow-soft-sm"
        >
          <div className="flex items-start gap-3 p-4 pb-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-4 pb-2.5">
            <Skeleton className="h-3.5 w-16" />
          </div>
          <div className="space-y-1.5 px-4 pb-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex gap-2 border-t border-border/40 p-3">
            <Skeleton className="h-8 flex-1 rounded-lg" />
            <Skeleton className="h-8 flex-1 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const GroupsSection = memo(function GroupsSection({
  groups,
  totalCount,
  isLoading,
  isLoadingMore,
  searchTerm,
  onSearchChange,
  onDeleteGroup,
  onClear,
}: GroupsSectionProps) {
  const hasGroups = totalCount > 0
  const hasFilteredGroups = groups.length > 0
  const showSearch = totalCount > 8 || searchTerm.length > 0
  const hasActiveSearch = searchTerm.trim().length > 0

  const badgeText = useMemo(() => {
    if (isLoading && !hasGroups) return null
    if (hasActiveSearch) return `${groups.length} из ${totalCount}`
    return String(totalCount)
  }, [hasActiveSearch, groups.length, totalCount, isLoading, hasGroups])

  const clearDisabled = isLoading || !hasGroups

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text-light">Группы</h2>
          {badgeText && (
            <Badge
              variant="outline"
              className="border-border/50 bg-background-primary/50 px-2.5 py-0.5 font-mono-accent text-xs text-text-secondary"
            >
              {badgeText}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-secondary" />
              <Input
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Поиск по названию или ID..."
                className="h-9 w-44 bg-background-primary pl-8 text-xs placeholder:text-text-secondary focus:w-56 transition-colors duration-200 lg:w-52"
              />
              {hasActiveSearch && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-light transition-colors"
                  aria-label="Очистить поиск"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {hasGroups && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={clearDisabled}
              className="h-9 gap-1.5 px-2.5 text-xs text-text-secondary hover:bg-destructive/10 hover:text-accent-danger"
              title="Удалить все группы"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Очистить</span>
            </Button>
          )}
        </div>
      </div>

      {isLoading && !hasGroups && <GroupsSkeletonGrid />}

      {!isLoading && !hasGroups && (
        <Empty className="min-h-[240px]" role="region" aria-label="Нет добавленных групп">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Нет добавленных групп</EmptyTitle>
            <EmptyDescription>
              Добавьте ссылку на сообщество ВКонтакте или загрузите файл со списком.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {hasGroups && hasFilteredGroups && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} onDelete={onDeleteGroup} />
            ))}
          </div>

          {isLoadingMore && (
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-secondary">
              <Spinner className="size-3" />
              Загрузка...
            </div>
          )}
        </>
      )}

      {hasGroups && !hasFilteredGroups && !isLoading && (
        <Empty className="min-h-[160px]" role="region" aria-label="Ничего не найдено">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Ничего не найдено</EmptyTitle>
            <EmptyDescription>
              По запросу &laquo;{searchTerm}&raquo; нет групп. Попробуйте изменить поиск.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  )
})
