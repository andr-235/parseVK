import { useEffect, useMemo, useState } from 'react'
import { useCommentsStore, useKeywordsStore } from '../stores'
import CommentsFiltersPanel from './Comments/components/CommentsFiltersPanel'
import CommentsTableCard from './Comments/components/CommentsTableCard'
import { Card } from '@/components/ui/card'
import CommentsHero from './Comments/components/CommentsHero'

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
    <Card className="flex flex-col gap-8">

      <CommentsHero filteredCount={filteredComments.length} />

      <CommentsFiltersPanel
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showOnlyKeywordComments={showOnlyKeywordComments}
        onToggleKeywords={setShowOnlyKeywordComments}
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
        keywordsCount={keywords.length}
      />

      <CommentsTableCard
        comments={filteredComments}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        keywords={keywords}
        toggleReadStatus={toggleReadStatus}
      />
    </Card>
  )
}

export default Comments
