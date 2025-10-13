import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableSortButton } from '@/components/ui/table-sort-button'
import { useTableSorting } from '@/hooks/useTableSorting'
import type { Keyword, TableColumn } from '@/types'
import LoadingKeywordsState from './LoadingKeywordsState'
import EmptyKeywordsState from './EmptyKeywordsState'

type ColumnsFactory = (deleteKeyword: (id: number) => void) => TableColumn<Keyword>[]

interface KeywordsTableCardProps {
  keywords: Keyword[]
  isLoading: boolean
  onDelete: (id: number) => void
  columns: ColumnsFactory
}

const getCounterLabel = (count: number) => {
  const remainder10 = count % 10
  const remainder100 = count % 100

  if (remainder10 === 1 && remainder100 !== 11) {
    return 'слово'
  }

  if (remainder10 >= 2 && remainder10 <= 4 && (remainder100 < 12 || remainder100 > 14)) {
    return 'слова'
  }

  return 'слов'
}

function KeywordsTableCard({ keywords, isLoading, onDelete, columns }: KeywordsTableCardProps) {
  const hasKeywords = keywords.length > 0
  const tableColumns = useMemo(() => columns(onDelete), [columns, onDelete])
  const { sortedItems: sortedKeywords, sortState, requestSort } = useTableSorting(keywords, tableColumns)

  const subtitle = useMemo(() => {
    if (isLoading && !hasKeywords) {
      return 'Мы подготавливаем данные и проверяем их перед отображением.'
    }

    if (hasKeywords) {
      return 'Управляйте существующими ключевыми словами, чтобы контролировать выдачу комментариев.'
    }

    return 'Добавьте первое ключевое слово, чтобы начать фильтрацию комментариев.'
  }, [hasKeywords, isLoading])

  return (
    <Card className="rounded-[26px] bg-background-secondary shadow-[0_24px_48px_-34px_rgba(0,0,0,0.28)] dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]" aria-label="Список ключевых слов">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-6 space-y-0 p-6 md:p-8">
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <CardTitle className="text-2xl font-bold text-text-primary">Список ключевых слов</CardTitle>
          <CardDescription className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">{subtitle}</CardDescription>
        </div>
        <div className="flex min-w-[220px] flex-col items-end gap-3">
          {isLoading ? (
            <Badge variant="secondary" className="bg-[rgba(241,196,15,0.18)] text-[#f1c40f] dark:text-[#f9e79f]">
              Загрузка…
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-[rgba(52,152,219,0.12)] text-[#3498db] dark:text-[#5dade2]">
              {keywords.length} {getCounterLabel(keywords.length)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-8 md:pb-8">
        {isLoading && !hasKeywords && <LoadingKeywordsState />}

        {!isLoading && !hasKeywords && <EmptyKeywordsState />}

        {hasKeywords && (
          <Card className="relative w-full overflow-hidden rounded-[20px] p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableColumns.map((column) => (
                      <TableHead key={column.key} className={column.headerClassName}>
                        {column.sortable ? (
                          <TableSortButton
                            direction={sortState?.key === column.key ? sortState.direction : null}
                            onClick={() => requestSort(column.key)}
                          >
                            {column.header}
                          </TableSortButton>
                        ) : (
                          column.header
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedKeywords.map((keyword, index) => (
                    <TableRow key={keyword.id || index}>
                      {tableColumns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.render ? column.render(keyword as Keyword, index) : keyword[column.key as keyof Keyword]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default KeywordsTableCard
