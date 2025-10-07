import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../components/PageTitle'
import Table from '../components/Table'
import { useCommentsStore, useKeywordsStore } from '../stores'
import { getCommentTableColumns } from '../config/commentTableColumns'

function Comments() {
  const comments = useCommentsStore((state) => state.comments)
  const isLoading = useCommentsStore((state) => state.isLoading)
  const fetchComments = useCommentsStore((state) => state.fetchComments)
  const toggleReadStatus = useCommentsStore((state) => state.toggleReadStatus)
  const keywords = useKeywordsStore((state) => state.keywords)
  const fetchKeywords = useKeywordsStore((state) => state.fetchKeywords)
  const [showOnlyKeywordComments, setShowOnlyKeywordComments] = useState(false)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')

  const filteredComments = useMemo(() => {
    let result = comments

    if (showOnlyKeywordComments) {
      const normalizedKeywords = keywords
        .map((keyword) => keyword.word.trim().toLowerCase())
        .filter(Boolean)

      if (normalizedKeywords.length > 0) {
        result = result.filter((comment) => {
          const text = comment.text.toLowerCase()
          return normalizedKeywords.some((keyword) => text.includes(keyword))
        })
      }
    }

    if (readFilter === 'read') {
      result = result.filter((comment) => comment.isRead)
    } else if (readFilter === 'unread') {
      result = result.filter((comment) => !comment.isRead)
    }

    return result
  }, [comments, keywords, readFilter, showOnlyKeywordComments])

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

    return 'Нет комментариев'
  }, [isLoading, readFilter, showOnlyKeywordComments])

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
    <div>
      <PageTitle>Комментарии</PageTitle>
      <div className="comments-filter">
        <div className="comments-filter__group">
          <span className="comments-filter__label">Показать</span>
          <div className="comments-filter__toggle" role="group" aria-label="Фильтр по ключевым словам">
            <button
              type="button"
              className={`comments-filter__option ${showOnlyKeywordComments ? '' : 'is-active'}`}
              onClick={() => setShowOnlyKeywordComments(false)}
            >
              Все
            </button>
            <button
              type="button"
              className={`comments-filter__option ${showOnlyKeywordComments ? 'is-active' : ''}`}
              onClick={() => setShowOnlyKeywordComments(true)}
              disabled={keywords.length === 0}
            >
              С ключевыми словами
            </button>
          </div>
        </div>
        <div className="comments-filter__group">
          <span className="comments-filter__label">Статус</span>
          <div className="comments-filter__toggle" role="group" aria-label="Фильтр по статусу прочтения">
            <button
              type="button"
              className={`comments-filter__option ${readFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setReadFilter('all')}
            >
              Все
            </button>
            <button
              type="button"
              className={`comments-filter__option ${readFilter === 'unread' ? 'is-active' : ''}`}
              onClick={() => setReadFilter('unread')}
            >
              Непрочитанные
            </button>
            <button
              type="button"
              className={`comments-filter__option ${readFilter === 'read' ? 'is-active' : ''}`}
              onClick={() => setReadFilter('read')}
            >
              Прочитанные
            </button>
          </div>
        </div>
        {keywords.length === 0 && (
          <span className="comments-filter__hint">Добавьте ключевые слова, чтобы включить фильтр</span>
        )}
      </div>
      <Table
        columns={getCommentTableColumns(keywords, toggleReadStatus)}
        data={filteredComments}
        emptyMessage={emptyMessage}
      />
    </div>
  )
}

export default Comments
