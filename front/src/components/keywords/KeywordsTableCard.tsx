import { useMemo, useState } from 'react'
import { useTableSorting } from '@/hooks/common'
import type { Keyword } from '@/types'
import { getKeywordTableColumns } from '@/config/keywords/keywordTableColumns'
import { groupKeywordsByCategory } from '@/utils/keywords/groupKeywordsByCategory'
import { KeywordCategorySection } from './KeywordCategorySection'
import { DataTableCard, type SortOption } from '@/components/common/DataTableCard'

interface KeywordsTableCardProps {
  keywords: Keyword[]
  isLoading: boolean
  onDelete: (id: number) => void | Promise<void>
  onManageForms: (keyword: Keyword) => void
  onUpdateCategory: (id: number, category?: string | null) => void | Promise<void>
  categorySuggestions: string[]
  searchTerm: string
  onSearchChange: (value: string) => void
}

function KeywordsTableCard({
  keywords,
  isLoading,
  onDelete,
  onManageForms,
  onUpdateCategory,
  categorySuggestions,
  searchTerm,
  onSearchChange,
}: KeywordsTableCardProps) {
  const tableColumns = useMemo(() => getKeywordTableColumns(), [])

  const {
    sortedItems: sortedKeywords,
    sortState,
    requestSort,
  } = useTableSorting(keywords, tableColumns)

  const sortOptions: SortOption[] = useMemo(() => {
    return tableColumns
      .filter((col) => col.sortable)
      .map((col) => ({
        key: col.key,
        label: col.header,
        directionLabel: { asc: ' (А-Я)', desc: ' (Я-А)' },
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
    <DataTableCard
      title="Список слов"
      totalCount={keywords.length}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      sortOptions={sortOptions}
      sortState={sortState}
      onRequestSort={requestSort}
      currentSortLabel={currentSortLabel}
      isLoading={isLoading}
      loadingMessage="Загружаем ключевые слова…"
      isEmpty={!isLoading && !hasKeywords}
      emptyIcon="🔑"
      emptyTitle="Список пуст"
      emptyDescription="Добавьте ключевые слова вручную или загрузите список из файла. Если не указать категорию, слово автоматически окажется в разделе «Без категории», и вы сможете распределить его позже."
      hasFilteredItems={hasFilteredKeywords}
    >
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
            onUpdateCategory={onUpdateCategory}
            categorySuggestions={categorySuggestions}
          />
        ))}
      </div>
    </DataTableCard>
  )
}

export default KeywordsTableCard
