import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SearchInput from '@/components/SearchInput'
import { Card, CardContent } from '@/components/ui/card'
import { useTableSorting } from '@/hooks/useTableSorting'
import type { Keyword } from '@/types'
import { LoadingState } from '@/components/LoadingState'
import { EmptyState } from '@/components/EmptyState'
import { KeywordCard } from './KeywordCard'
import { ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getKeywordTableColumns } from '@/modules/keywords/config/keywordTableColumns'

interface KeywordsTableCardProps {
  keywords: Keyword[]
  isLoading: boolean
  onDelete: (id: number) => void | Promise<void>
  searchTerm: string
  onSearchChange: (value: string) => void
}

function KeywordsTableCard({
  keywords,
  isLoading,
  onDelete,
  searchTerm,
  onSearchChange,
}: KeywordsTableCardProps) {
  const tableColumns = useMemo(() => getKeywordTableColumns(), [])

  const {
    sortedItems: sortedKeywords,
    sortState,
    requestSort,
  } = useTableSorting(keywords, tableColumns)

  const sortOptions = useMemo(() => {
    return tableColumns
      .filter((col) => col.sortable)
      .map((col) => ({
        key: col.key,
        label: col.header,
      }))
  }, [tableColumns])

  const currentSortLabel = sortOptions.find((o) => o.key === sortState?.key)?.label || 'Сортировка'

  const hasKeywords = keywords.length > 0
  const hasFilteredKeywords = sortedKeywords.length > 0

  return (
    <Card className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Список слов</h2>
          {!isLoading && (
            <Badge
              variant="secondary"
              className="bg-background/50 px-2 py-0.5 text-xs font-normal text-muted-foreground"
            >
              {keywords.length}
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Поиск..."
            className="h-9 w-full sm:w-[250px]"
          />

          {hasKeywords && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <ArrowUpDown className="size-4" />
                  <span className="truncate max-w-[100px]">{currentSortLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sortOptions.map((option) => (
                  <DropdownMenuItem key={option.key} onClick={() => requestSort(option.key)}>
                    {option.label}
                    {sortState?.key === option.key && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {sortState.direction === 'asc' ? ' (А-Я)' : ' (Я-А)'}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <CardContent className="p-4 md:p-6">
        {isLoading && !hasKeywords && (
          <div className="py-8">
            <LoadingState message="Загружаем ключевые слова…" />
          </div>
        )}

        {!isLoading && !hasKeywords && (
          <EmptyState
            variant="custom"
            icon="🔑"
            title="Список пуст"
            description="Добавьте ключевые слова вручную или загрузите список из файла. Если не указать категорию, слово автоматически окажется в разделе «Без категории», и вы сможете распределить его позже."
          />
        )}

        {hasKeywords && !isLoading && !hasFilteredKeywords && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-sm text-muted-foreground">
              По запросу «{searchTerm}» ничего не найдено
            </div>
          </div>
        )}

        {hasFilteredKeywords && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {sortedKeywords.map((keyword) => (
              <KeywordCard key={keyword.id} keyword={keyword} onDelete={onDelete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default KeywordsTableCard
