import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SearchInput from '@/components/SearchInput'
import { Card, CardContent } from '@/components/ui/card'
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
import { Trash2 } from 'lucide-react'

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
  const tableColumns = useMemo<TableColumn<Keyword>[]>(() => [
    {
      header: 'Ключевое слово',
      key: 'word',
      sortable: true,
      render: (item) => <span className="font-medium">{item.word}</span>
    },
    {
      header: 'Категория',
      key: 'category',
      sortable: true,
      render: (item) => item.category || <span className="text-muted-foreground italic">Без категории</span>
    },
    {
      header: '',
      key: 'actions',
      headerClassName: 'w-[100px] text-right',
      cellClassName: 'text-right',
      render: (item) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(item.id)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      )
    }
  ], [onDelete])

  const { sortedItems: sortedKeywords, sortState, requestSort } = useTableSorting(keywords, tableColumns)

  return (
    <Card className="overflow-hidden rounded-xl border border-border shadow-sm">
        <div className="flex flex-col gap-4 border-b bg-muted/30 p-4 md:flex-row md:items-center md:justify-between md:px-6">
             <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">Список слов</h2>
                {!isLoading && (
                    <Badge variant="secondary" className="bg-background/50 px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        {keywords.length}
                    </Badge>
                )}
            </div>
            <div className="w-full md:w-[250px]">
                 <SearchInput
                    value={searchTerm}
                    onChange={onSearchChange}
                    placeholder="Поиск..."
                    className="h-9"
                  />
            </div>
        </div>

        <CardContent className="p-0">
             {isLoading && keywords.length === 0 && (
                <div className="p-8">
                    <LoadingKeywordsState />
                </div>
             )}

             {!isLoading && keywords.length === 0 && <EmptyKeywordsState />}
             
             {!isLoading && keywords.length > 0 && sortedKeywords.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-sm text-muted-foreground">
                        По запросу «{searchTerm}» ничего не найдено
                    </div>
                 </div>
             )}

             {sortedKeywords.length > 0 && (
                 <Table>
                    <TableHeader className="bg-muted/30">
                             <TableRow className="hover:bg-transparent">
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
                            {sortedKeywords.map((keyword) => (
                                <TableRow key={keyword.id} className="group hover:bg-muted/30">
                                    {tableColumns.map((column) => (
                                        <TableCell key={column.key} className={column.cellClassName}>
                                            {column.render
                                                ? column.render(keyword, 0)
                                                : (keyword[column.key as keyof Keyword] as ReactNode)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                     </Table>
             )}
        </CardContent>
    </Card>
  )
}

export default KeywordsTableCard
