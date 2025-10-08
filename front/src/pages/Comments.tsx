import { useEffect, useMemo, useState } from 'react'
import PageTitle from '../components/PageTitle'
import SearchInput from '../components/SearchInput'
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
    <div className="comments-page">
      <div className="comments-page__header">
        <div>
          <PageTitle>Комментарии</PageTitle>
          <p className="comments-page__subtitle">
            Управляйте обратной связью из сообществ и отмечайте важные сообщения быстрее
          </p>
        </div>
        <div className="comments-page__badge">{filteredComments.length} элементов</div>
      </div>

      <div className="comments-overview" aria-label="Сводка по комментариям">
        <div className="comments-overview__card">
          <span className="comments-overview__label">Всего комментариев</span>
          <span className="comments-overview__value">{comments.length}</span>
        </div>
        <div className="comments-overview__card comments-overview__card--accent">
          <span className="comments-overview__label">Непрочитанные</span>
          <span className="comments-overview__value">{unreadCount}</span>
          <span className="comments-overview__helper">Отметьте прочитанными, чтобы убрать из очереди</span>
        </div>
        <div className="comments-overview__card">
          <span className="comments-overview__label">Прочитанные</span>
          <span className="comments-overview__value">{readCount}</span>
        </div>
        <div className="comments-overview__card">
          <span className="comments-overview__label">С ключевыми словами</span>
          <span className="comments-overview__value">{keywordMatchesCount}</span>
          <span className="comments-overview__helper">
            {normalizedKeywords.length > 0
              ? `Используются ключи: ${normalizedKeywords.join(', ')}`
              : 'Добавьте ключевые слова, чтобы отслеживать инсайты'}
          </span>
        </div>
      </div>

      <section className="comments-controls" aria-label="Фильтры и поиск по комментариям">
        <div className="comments-controls__row">
          <div className="comments-controls__search">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Поиск по автору, тексту или ID"
            />
          </div>
          <div className="comments-controls__group" role="group" aria-label="Фильтр по ключевым словам">
            <span className="comments-controls__label">Показать</span>
            <div className="comments-filter__toggle">
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
          <div className="comments-controls__group" role="group" aria-label="Фильтр по статусу прочтения">
            <span className="comments-controls__label">Статус</span>
            <div className="comments-filter__toggle">
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
        </div>
        {keywords.length === 0 && (
          <span className="comments-filter__hint">Добавьте ключевые слова, чтобы включить фильтр</span>
        )}
      </section>

      <div className="comments-table-card">
        <Table
          columns={getCommentTableColumns(keywords, toggleReadStatus)}
          data={filteredComments}
          emptyMessage={emptyMessage}
        />
      </div>
    </div>
  )
}

export default Comments
