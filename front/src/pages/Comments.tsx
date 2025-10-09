import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../components/PageTitle'
import SearchInput from '../components/SearchInput'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { useCommentsStore, useKeywordsStore } from '../stores'
import { getCommentTableColumns } from '../config/commentTableColumns'
import type { Comment } from '../types'

function Comments() {
  const comments = useCommentsStore((state) => state.comments)
  const isLoading = useCommentsStore((state) => state.isLoading)
  const fetchComments = useCommentsStore((state) => state.fetchComments)
  const toggleReadStatus = useCommentsStore((state) => state.toggleReadStatus)
  const keywords = useKeywordsStore((state) => state.keywords)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const [showOnlyKeywordComments, setShowOnlyKeywordComments] = useState(false)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const normalizedKeywords = useMemo(
    () =>
      keywords
        .map((keyword) => keyword.word.trim().toLowerCase())
        .filter(Boolean),
    [keywords],
  )

  const unreadCount = useMemo(
    () => comments.filter((comment) => !comment.isRead).length,
    [comments],
  )

  const readCount = useMemo(
    () => comments.filter((comment) => comment.isRead).length,
    [comments],
  )

  const keywordMatchesCount = useMemo(() => {
    if (normalizedKeywords.length === 0) {
      return 0
    }

    return comments.filter((comment) => {
      const text = comment.text.toLowerCase()
      return normalizedKeywords.some((keyword) => text.includes(keyword))
    }).length
  }, [comments, normalizedKeywords])

  const filteredComments = useMemo(() => {
    let result = comments

    if (showOnlyKeywordComments && normalizedKeywords.length > 0) {
      result = result.filter((comment) => {
        const text = comment.text.toLowerCase()
        return normalizedKeywords.some((keyword) => text.includes(keyword))
      })
    }

    if (readFilter === 'read') {
      result = result.filter((comment) => comment.isRead)
    } else if (readFilter === 'unread') {
      result = result.filter((comment) => !comment.isRead)
    }

    const trimmedSearch = searchTerm.trim().toLowerCase()

    if (trimmedSearch) {
      result = result.filter((comment) =>
        Object.values(comment).some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(trimmedSearch),
        ),
      )
    }

    return result
  }, [comments, normalizedKeywords, readFilter, searchTerm, showOnlyKeywordComments])

  const emptyMessage = useMemo(() => {
    if (isLoading) {
      return 'Загрузка...'
    }

    if (readFilter === 'read') {
      return showOnlyKeywordComments
        ? 'Нет прочитанных комментариев с ключевыми словами'
        : 'Нет прочитанных комментариев'
    }

    if (readFilter === 'unread') {
      return showOnlyKeywordComments
        ? 'Все комментарии с ключевыми словами прочитаны'
        : 'Все комментарии прочитаны'
    }

    if (showOnlyKeywordComments) {
      return 'Нет комментариев с ключевыми словами'
    }

    if (searchTerm.trim()) {
      return 'Ничего не найдено по вашему запросу'
    }

    return 'Нет комментариев'
  }, [isLoading, readFilter, showOnlyKeywordComments, searchTerm])

  const toggleButtonClass = (active: boolean) =>
    [
      'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-200',
      active
        ? 'border-transparent bg-accent-primary text-white shadow-soft-sm'
        : 'border-border bg-background-primary/40 text-text-secondary hover:bg-background-secondary/60',
    ]
      .filter(Boolean)
      .join(' ')

  useEffect(() => {
    if (comments.length === 0) {
      const load = async () => {
        try {
          await fetchComments()
        } catch (error) {
          console.error('Failed to fetch comments', error)
        }
      }

      void load()
    }
  }, [comments.length, fetchComments])

  useEffect(() => {
    if (keywords.length === 0) {
      const load = async () => {
        try {
          await fetchKeywords()
        } catch (error) {
          console.error('Failed to fetch keywords', error)
        }
      }

      void load()
    }
  }, [fetchKeywords, keywords.length])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-background-secondary/80 p-6 shadow-soft-lg transition-colors duration-300 md:flex-row md:items-center md:justify-between">
        <div>
          <PageTitle>Комментарии</PageTitle>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            Управляйте обратной связью из сообществ и отмечайте важные сообщения быстрее
          </p>
        </div>
        <div className="inline-flex h-12 items-center justify-center rounded-full bg-accent-primary/10 px-5 text-sm font-semibold text-accent-primary">
          {filteredComments.length} элементов
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Сводка по комментариям">
        <div className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Всего комментариев</span>
          <span className="mt-3 block text-3xl font-bold text-text-primary">{comments.length}</span>
        </div>
        <div className="rounded-2xl border border-accent-danger/40 bg-background-primary/50 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Непрочитанные</span>
          <span className="mt-3 block text-3xl font-bold text-accent-danger">{unreadCount}</span>
          <span className="mt-2 block text-xs text-text-secondary">Отметьте прочитанными, чтобы убрать из очереди</span>
        </div>
        <div className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Прочитанные</span>
          <span className="mt-3 block text-3xl font-bold text-accent-success">{readCount}</span>
        </div>
        <div className="rounded-2xl border border-border bg-background-primary/50 p-5 shadow-soft-sm">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">С ключевыми словами</span>
          <span className="mt-3 block text-3xl font-bold text-accent-primary">{keywordMatchesCount}</span>
          <span className="mt-2 block text-xs text-text-secondary">
            {normalizedKeywords.length > 0
              ? `Используются ключи: ${normalizedKeywords.join(', ')}`
              : 'Добавьте ключевые слова, чтобы отслеживать инсайты'}
          </span>
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-border bg-background-secondary/80 p-6 shadow-soft-lg" aria-label="Фильтры и поиск по комментариям">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Поиск по автору, тексту или ID"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Фильтр по ключевым словам">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Показать</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={toggleButtonClass(!showOnlyKeywordComments)}
                onClick={() => setShowOnlyKeywordComments(false)}
              >
                Все
              </button>
              <button
                type="button"
                className={`${toggleButtonClass(showOnlyKeywordComments)} ${keywords.length === 0 ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={() => setShowOnlyKeywordComments(true)}
                disabled={keywords.length === 0}
              >
                С ключевыми словами
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Фильтр по статусу прочтения">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Статус</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={toggleButtonClass(readFilter === 'all')}
                onClick={() => setReadFilter('all')}
              >
                Все
              </button>
              <button
                type="button"
                className={toggleButtonClass(readFilter === 'unread')}
                onClick={() => setReadFilter('unread')}
              >
                Непрочитанные
              </button>
              <button
                type="button"
                className={toggleButtonClass(readFilter === 'read')}
                onClick={() => setReadFilter('read')}
              >
                Прочитанные
              </button>
            </div>
          </div>
        </div>
        {keywords.length === 0 && (
          <span className="text-xs text-text-secondary">Добавьте ключевые слова, чтобы включить фильтр</span>
        )}
      </section>

      <div className="overflow-hidden rounded-3xl border border-border bg-background-secondary shadow-soft-lg px-2 py-4 sm:px-6">
        {filteredComments.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center text-text-secondary">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {getCommentTableColumns(keywords, toggleReadStatus).map((column) => (
                    <TableHead key={column.key} className={column.headerClassName}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.map((comment, index) => (
                  <TableRow key={comment.id}>
                    {getCommentTableColumns(keywords, toggleReadStatus).map((column) => (
                      <TableCell key={column.key} className={column.cellClassName}>
                        {column.render ? column.render(comment as Comment, index) : comment[column.key as keyof Comment]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Comments
