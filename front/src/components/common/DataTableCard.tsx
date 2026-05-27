import { useMemo, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import SearchInput from '@/components/common/SearchInput'
import { LoadingState } from '@/components/common/LoadingState'
import { EmptyState } from '@/components/common/EmptyState'
import { ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn, declOfNumber } from '@/utils/common'

export interface SortOption {
  key: string
  label: string
  directionLabel?: { asc: string; desc: string }
}

export interface DataTableCardProps {
  // Заголовок
  title: string
  
  // Бейдж количества элементов
  totalCount?: number
  badgeText?: string
  declensionWords?: [string, string, string] // Например: ['группа', 'группы', 'групп']
  
  // Поиск
  searchTerm?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  
  // Сортировка
  sortOptions?: SortOption[]
  sortState?: { key: string; direction: 'asc' | 'desc' } | null
  onRequestSort?: (key: string) => void
  currentSortLabel?: string
  
  // Дополнительные кнопки и действия в шапке
  headerActions?: ReactNode
  
  // Состояния загрузки и отсутствия данных
  isLoading?: boolean
  loadingMessage?: string
  isEmpty?: boolean
  emptyIcon?: string | ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyVariant?: 'default' | 'custom'
  
  // Поиск ничего не нашел
  hasFilteredItems?: boolean
  noResultsMessage?: ReactNode
  
  // Дочерний контент (сама таблица, сетка или список)
  children: ReactNode
  
  // Кастомизация стилей
  className?: string
  contentClassName?: string
  headerClassName?: string
  hideHeader?: boolean
}

export function DataTableCard({
  title,
  totalCount,
  badgeText,
  declensionWords,
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Поиск...',
  sortOptions = [],
  sortState,
  onRequestSort,
  currentSortLabel = 'Сортировка',
  headerActions,
  isLoading = false,
  loadingMessage,
  isEmpty = false,
  emptyIcon,
  emptyTitle = 'Список пуст',
  emptyDescription = 'Нет данных для отображения',
  emptyVariant = 'custom',
  hasFilteredItems = true,
  noResultsMessage,
  children,
  className,
  contentClassName,
  headerClassName,
  hideHeader = false,
}: DataTableCardProps) {
  
  const displayBadgeText = useMemo(() => {
    if (badgeText !== undefined) {
      return badgeText
    }
    if (totalCount === undefined) {
      return null
    }
    
    const formattedCount = searchTerm && searchTerm.trim() 
      ? `${totalCount}` // В некоторых компонентах пишут "X из Y", это передается через badgeText
      : `${totalCount}`
      
    if (declensionWords) {
      return `${formattedCount} ${declOfNumber(totalCount, declensionWords)}`
    }
    
    return formattedCount
  }, [totalCount, badgeText, declensionWords, searchTerm])

  const hasSort = sortOptions.length > 0 && sortState !== undefined && onRequestSort !== undefined

  return (
    <Card className={cn('relative overflow-hidden rounded-xl border border-border bg-background-secondary shadow-soft-sm', className)}>
      {/* Header */}
      {!hideHeader && (
        <div className={cn('flex flex-col gap-4 border-b border-border bg-background-sidebar/30 p-4 md:flex-row md:items-center md:justify-between md:px-6', headerClassName)}>
          <div className="flex items-center gap-3">
            <h2 className="font-monitoring-display text-xl font-semibold tracking-tight text-text-light">
              {title}
            </h2>
            {!isLoading && displayBadgeText !== null && (
              <Badge className="border border-border bg-background-primary px-3 py-1 font-mono-accent text-xs text-text-secondary">
                {displayBadgeText}
              </Badge>
            )}
          </div>
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onSearchChange !== undefined && searchTerm !== undefined && (
            <SearchInput
              value={searchTerm}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="h-10 w-full border-border bg-background-primary text-text-light placeholder:text-text-secondary focus:border-primary/50 focus:ring-primary/20 sm:w-[250px]"
            />
          )}

          {hasSort && (
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
                    onClick={() => onRequestSort(option.key)}
                    className="text-text-secondary hover:bg-background-primary hover:text-text-light cursor-pointer"
                  >
                    {option.label}
                    {sortState?.key === option.key && (
                      <span className="ml-auto font-mono-accent text-xs text-primary">
                        {sortState.direction === 'asc' 
                          ? (option.directionLabel?.asc || ' ↑') 
                          : (option.directionLabel?.desc || ' ↓')}
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
      )}

      {/* Content */}
      <CardContent className={cn('p-4 md:p-6', contentClassName)}>
        {isLoading && isEmpty && (
          <div className="py-8">
            <LoadingState message={loadingMessage} />
          </div>
        )}

        {!isLoading && isEmpty && (
          <EmptyState
            variant={emptyVariant}
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}

        {!isLoading && !isEmpty && !hasFilteredItems && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {noResultsMessage ? (
              noResultsMessage
            ) : (
              <div className="text-sm text-text-secondary">
                По запросу «<span className="font-mono-accent text-primary">{searchTerm}</span>» ничего не найдено
              </div>
            )}
          </div>
        )}

        {!isEmpty && (hasFilteredItems || isLoading) && children}
      </CardContent>
    </Card>
  )
}
