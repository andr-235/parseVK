import { type ReactNode } from 'react'
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils'

export interface FiltersPanelProps {
  // Поиск
  searchTerm?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string

  // Кнопка обновления
  onRefresh?: () => void
  isRefreshing?: boolean

  // Дополнительные фильтры
  children?: ReactNode

  // Кастомизация классов
  className?: string
}

export function FiltersPanel({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Поиск...',
  onRefresh,
  isRefreshing = false,
  children,
  className,
}: FiltersPanelProps) {
  const hasSearch = searchTerm !== undefined && onSearchChange !== undefined
  const hasRefresh = onRefresh !== undefined
  const hasExtraFilters = !!children

  return (
    <div className={cn('flex flex-col gap-6 font-monitoring-body', className)}>
      {/* Search and Main actions */}
      {(hasSearch || hasRefresh) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {hasSearch && (
            <div className="relative w-full sm:max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary group-focus-within:text-accent-primary transition-colors" />
              <Input
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="pl-10 h-11 rounded-xl border-border bg-background-primary text-text-light placeholder:text-text-secondary focus-visible:ring-1 focus-visible:ring-accent-primary/30 transition-all hover:bg-background-sidebar"
              />
            </div>
          )}

          {hasRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-11 w-11 shrink-0 rounded-xl border-border bg-background-secondary hover:bg-background-sidebar text-text-secondary hover:text-text-light transition-all"
              title="Обновить"
              aria-label="Обновить"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </Button>
          )}
        </div>
      )}

      {/* Extra filters slot */}
      {hasExtraFilters && (
        <div className="flex flex-wrap items-center gap-4 bg-background-secondary/35 p-3 rounded-xl border border-border/40">
          <div className="flex items-center gap-2 mr-2 text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono-accent">
            <SlidersHorizontal className="h-4 w-4 text-text-secondary" />
            Фильтры:
          </div>

          <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
        </div>
      )}
    </div>
  )
}
