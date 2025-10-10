import { useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Comment, Keyword } from '@/types'
import { getCommentTableColumns } from '@/config/commentTableColumns'
import LoadingCommentsState from './LoadingCommentsState'
import EmptyCommentsState from './EmptyCommentsState'

interface CommentsTableCardProps {
  comments: Comment[]
  isLoading: boolean
  emptyMessage: string
  keywords: Keyword[]
  toggleReadStatus: (id: number) => void
}

function CommentsTableCard({
  comments,
  isLoading,
  emptyMessage,
  keywords,
  toggleReadStatus,
}: CommentsTableCardProps) {
  const hasComments = comments.length > 0
  const tableColumns = useMemo(() => getCommentTableColumns(keywords, toggleReadStatus), [keywords, toggleReadStatus])

  const subtitle = useMemo(() => {
    if (isLoading && !hasComments) {
      return 'Мы подготавливаем данные и проверяем их перед отображением.'
    }

    if (hasComments) {
      return 'Ниже отображаются комментарии из добавленных групп. Вы можете отметить их как прочитанные или искать по ключевым словам.'
    }

    return 'После добавления групп и запуска парсинга комментарии появятся в таблице.'
  }, [hasComments, isLoading])

  return (
    <Card
      className="rounded-[26px] bg-background-secondary shadow-[0_24px_48px_-34px_rgba(0,0,0,0.28)] dark:shadow-[0_28px_56px_-34px_rgba(93,173,226,0.5)]"
      aria-label="Список комментариев"
    >
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-6 space-y-0 p-6 md:p-8">
        <div className="flex min-w-[260px] flex-1 flex-col gap-2">
          <CardTitle className="text-2xl font-bold text-text-primary">Список комментариев</CardTitle>
          <CardDescription className="max-w-[640px] text-[15px] leading-relaxed text-text-secondary">
            {subtitle}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-0 md:px-8 md:pb-8">
        {isLoading && !hasComments && <LoadingCommentsState />}

        {!isLoading && !hasComments && <EmptyCommentsState message={emptyMessage} />}

        {hasComments && (
          <Card className="relative w-full overflow-hidden rounded-[20px] p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableColumns.map((column) => (
                      <TableHead key={column.key} className={column.headerClassName}>
                        {column.header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment, index) => (
                    <TableRow key={comment.id}>
                      {tableColumns.map((column) => (
                        <TableCell key={column.key} className={column.cellClassName}>
                          {column.render ? column.render(comment as Comment, index) : comment[column.key as keyof Comment]}
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

export default CommentsTableCard
