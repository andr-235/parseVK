import { useMemo, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import SearchInput from '@/shared/components/SearchInput'
import { Card, CardContent } from '@/shared/ui/card'
import { useTableSorting } from '@/shared/hooks'
import type { Keyword } from '@/types'
import { LoadingState } from '@/shared/components/LoadingState'
import { EmptyState } from '@/shared/components/EmptyState'
import { ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { getKeywordTableColumns } from '@/modules/keywords/config/keywordTableColumns'
import { groupKeywordsByCategory } from '@/modules/keywords/utils/groupKeywordsByCategory'
import { KeywordCategorySection } from './KeywordCategorySection'

interface KeywordsTableCardProps {
  keywords: Keyword[]
  isLoading: boolean
  onDelete: (id: number) => void | Promise<void>
  onManageForms: (keyword: Keyword) => void
  searchTerm: string
  onSearchChange: (value: string) => void
}

function KeywordsTableCard({
  keywords,
  isLoading,
  onDelete,
  onManageForms,
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
  const groupedKeywords = useMemo(() => groupKeywordsByCategory(sortedKeywords), [sortedKeywords])
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (category: string) => {
    setExpandedCategories((current) => ({
      ...current,
      [category]: !(current[category] ?? true),
    }))
  }

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
          <div className="space-y-4">
            {groupedKeywords.map((group) => (
              <KeywordCategorySection
                key={group.category}
                category={group.category}
                keywords={group.keywords}
                isExpanded={expandedCategories[group.category] ?? true}
                onToggle={() => toggleCategory(group.category)}
                onDelete={onDelete}
                onManageForms={onManageForms}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default KeywordsTableCard
